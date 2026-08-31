import Phaser from 'phaser';
import { BiomeType } from '../../types/game';

/**
 * LightingSystem (Eixo A — Evolução Gráfica Avançada)
 * Iluminação dinâmica Light2D do Phaser 4 (this.lights).
 * Substitui a falsa iluminação por overlays de Graphics (darknessOverlay) por
 * luzes reais com normal maps quando o renderer é WebGL.
 *
 * Em renderers Canvas ou quando a flag de performance postProcessingEnabled está
 * desligada, o sistema vira um no-op e o fallback (darknessOverlay) permanece ativo.
 */

export interface BiomeLightingConfig {
  ambientColor: number;
  playerLightRadius: number;
  playerLightColor: number;
  torchRadius: number;
  torchColor: number;
}

const BIOME_LIGHTING: Record<BiomeType, BiomeLightingConfig> = {
  fosso_chagas: {
    ambientColor: 0x1a0a10,
    playerLightRadius: 180,
    playerLightColor: 0xff5522,
    torchRadius: 120,
    torchColor: 0xff9933,
  },
  catacumbas_martires: {
    ambientColor: 0x0a0a1e,
    playerLightRadius: 140,
    playerLightColor: 0x8866ff,
    torchRadius: 100,
    torchColor: 0xaa88ff,
  },
  santuario_sangue: {
    ambientColor: 0x3a0a12,
    playerLightRadius: 320,
    playerLightColor: 0xff4433,
    torchRadius: 150,
    torchColor: 0xffaa33,
  },
  safe_house: {
    ambientColor: 0x3d2314,
    playerLightRadius: 220,
    playerLightColor: 0xff9944,
    torchRadius: 180,
    torchColor: 0xffaa44,
  },
  gloomy_woods: {
    ambientColor: 0x101a24,
    playerLightRadius: 200,
    playerLightColor: 0x66aaff,
    torchRadius: 140,
    torchColor: 0xff9944,
  },
};

interface TorchLightEntry {
  light: any;
  baseRadius: number;
  baseIntensity: number;
  seed: number;
}

export class LightingSystem {
  private scene: Phaser.Scene & { player?: { x: number; y: number } };
  private isWebGL: boolean;
  private enabled: boolean;

  private playerLight: any = null;
  private torchLights: TorchLightEntry[] = [];
  private activeBiome: BiomeType = 'fosso_chagas';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const renderer = scene.game.renderer as any;
    this.isWebGL = renderer && renderer.isWebGL === true;
    this.enabled = this.isWebGL;
  }

  public setEnabled(value: boolean): void {
    this.enabled = value && this.isWebGL;
  }

  public isActive(): boolean {
    return this.enabled;
  }

  /** Liga o sistema de luzes na cena e define o ambient color do bioma e cascata de luz. */
  public enable(biome: BiomeType, floorDepth: number = 1): void {
    if (!this.enabled) return;
    this.activeBiome = biome;
    try {
      const lights = this.scene.lights as any;
      if (lights && !lights.active) {
        lights.enable();
      }
      
      // Cascata de Luz (A.3): Transição de tom frio (azul espectral) nos primeiros andares
      // para vermelho sangrento infernal conforme o jogador aprofunda no calabouço.
      const depthProgress = Math.min(1.0, Math.max(0, (floorDepth - 1) / 8));

      // Top floors (0x101b38 - Cold Spectral Blue) -> Deep floors (0x4a050d - Deep Infernal Crimson)
      const rStart = 0x10, gStart = 0x1b, bStart = 0x38;
      const rEnd = 0x4a, gEnd = 0x05, bEnd = 0x0d;

      const r = Math.floor(rStart + (rEnd - rStart) * depthProgress);
      const g = Math.floor(gStart + (gEnd - gStart) * depthProgress);
      const b = Math.floor(bStart + (bEnd - bStart) * depthProgress);
      const cascadeColor = (r << 16) | (g << 8) | b;

      lights.setAmbientColor(cascadeColor);
    } catch (e) {
      this.enabled = false;
    }
  }

  /** Aplica o pipeline Light2D a um sprite/image se o sistema estiver ativo. */
  public applyLightPipeline(gameObject: Phaser.GameObjects.GameObject): void {
    if (this.enabled && this.isWebGL && (gameObject as any).setPipeline) {
      try {
        (gameObject as any).setPipeline('Light2D');
      } catch (e) {
        // Fallback or ignore if pipeline fails
      }
    }
  }

  /** Cria a luz que segue o player, com raio por HP. */
  public createPlayerLight(): void {
    if (!this.enabled || !this.scene.player) return;
    try {
      const lights = this.scene.lights as any;
      const config = BIOME_LIGHTING[this.activeBiome] || BIOME_LIGHTING.fosso_chagas;
      this.playerLight = lights.addLight(
        this.scene.player.x,
        this.scene.player.y,
        config.playerLightRadius,
        config.playerLightColor,
        1.0
      );
    } catch (e) {
      this.enabled = false;
    }
  }

  /** Atualiza a luz do player (posição + raio por HP). */
  public updatePlayerLight(hpRatio: number): void {
    if (!this.enabled || !this.playerLight) return;
    const config = BIOME_LIGHTING[this.activeBiome] || BIOME_LIGHTING.fosso_chagas;
    const baseRadius = config.playerLightRadius;
    // HP baixo reduz o raio de luz (ambiente mais ameaçador).
    const hpMultiplier = 0.6 + 0.4 * Math.max(0, Math.min(1, hpRatio));
    this.playerLight.x = this.scene.player ? this.scene.player.x : this.playerLight.x;
    this.playerLight.y = this.scene.player ? this.scene.player.y : this.playerLight.y;
    this.playerLight.radius = baseRadius * hpMultiplier;
  }

  /** Cria luzes estáticas nas posições de tocha/brasier com micro-flicker dinâmico. */
  public addTorchLights(positions: { x: number; y: number; kind: 'torch' | 'brazier' }[]): void {
    if (!this.enabled) return;
    const lights = this.scene.lights as any;
    const config = BIOME_LIGHTING[this.activeBiome] || BIOME_LIGHTING.fosso_chagas;
    try {
      positions.forEach((pos, idx) => {
        const radius = pos.kind === 'brazier' ? config.torchRadius * 1.6 : config.torchRadius;
        const color = pos.kind === 'brazier' ? 0xff6622 : config.torchColor;
        const baseIntensity = pos.kind === 'brazier' ? 1.0 : 0.9;
        const light = lights.addLight(pos.x, pos.y, radius, color, baseIntensity);
        this.torchLights.push({
          light,
          baseRadius: radius,
          baseIntensity,
          seed: idx * 1.73 + pos.x * 0.05 + pos.y * 0.03,
        });
      });
    } catch (e) {
      // Ignorar falhas pontuais
    }
  }

  /**
   * Atualização de ciclo de frame para simular micro-flicker orgânico das tochas.
   */
  public update(time: number, delta: number): void {
    if (!this.enabled || this.torchLights.length === 0) return;

    for (let i = 0; i < this.torchLights.length; i++) {
      const entry = this.torchLights[i];
      if (!entry.light) continue;

      const flicker = Math.sin(time * 0.007 + entry.seed) * 0.08 + Math.cos(time * 0.015 + entry.seed * 2.1) * 0.05;
      entry.light.intensity = Math.max(0.35, entry.baseIntensity + flicker);
      entry.light.radius = Math.max(20, entry.baseRadius * (1 + flicker * 0.35));
    }
  }

  /** Limpa todas as luzes de tocha (transição de andar). */
  public clearTorchLights(): void {
    const lights = this.scene.lights as any;
    try {
      this.torchLights.forEach((entry) => lights.removeLight(entry.light));
    } catch (e) {
      // Ignorar
    }
    this.torchLights = [];
  }

  public shutdown(): void {
    try {
      const lights = this.scene.lights as any;
      if (lights) {
        lights.shutdown();
      }
    } catch (e) {
      // Ignorar
    }
    this.playerLight = null;
    this.torchLights = [];
  }
}

export default LightingSystem;
