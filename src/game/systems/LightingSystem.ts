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
};

export class LightingSystem {
  private scene: Phaser.Scene & { player?: { x: number; y: number } };
  private isWebGL: boolean;
  private enabled: boolean;

  private playerLight: any = null;
  private torchLights: any[] = [];
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

  /** Cria luzes estáticas nas posições de tocha/brasier. */
  public addTorchLights(positions: { x: number; y: number; kind: 'torch' | 'brazier' }[]): void {
    if (!this.enabled) return;
    const lights = this.scene.lights as any;
    const config = BIOME_LIGHTING[this.activeBiome] || BIOME_LIGHTING.fosso_chagas;
    try {
      positions.forEach((pos) => {
        const radius = pos.kind === 'brazier' ? config.torchRadius * 1.6 : config.torchRadius;
        const color = pos.kind === 'brazier' ? 0xff6622 : config.torchColor;
        const light = lights.addLight(pos.x, pos.y, radius, color, 0.9);
        this.torchLights.push(light);
      });
    } catch (e) {
      // Ignorar falhas pontuais
    }
  }

  /** Limpa todas as luzes de tocha (transição de andar). */
  public clearTorchLights(): void {
    const lights = this.scene.lights as any;
    try {
      this.torchLights.forEach((light) => lights.removeLight(light));
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
