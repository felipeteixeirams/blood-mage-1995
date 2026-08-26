import Phaser from 'phaser';
import { BiomeType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

/**
 * PostFXSystem (Eixo A — Evolução Gráfica Avançada)
 * Sistema de pós-processamento visual via filtros GPU do Phaser 4 (camera.filters).
 * Substitui o ScreenEffects (Canvas 2D) por filtros reais (Vignette, ColorMatrix,
 * Displacement) quando WebGL está disponível, mantendo a mesma API para troca drop-in.
 *
 * Quando o renderer NÃO é WebGL, o sistema delega para o ScreenEffects (Canvas)
 * e garante que o render seja aplicado ao canvas do jogo (o render do ScreenEffects
 * nunca era chamado no GameScene).
 */

export interface PostFXConfig {
  biome?: BiomeType;
  vignetteStrength?: number;
  displacement?: number;
  tintHex?: number | null;
  duration?: number;
}

export class PostFXSystem {
  private scene: Phaser.Scene;
  private isWebGL: boolean;

  private vignette: any = null;
  private colorMatrix: any = null;
  private displacement: any = null;

  private currentVignette = 0;
  private targetVignette = 0;
  private currentDisplacement = 0;
  private targetDisplacement = 0;
  private currentTint: number | null = null;
  private targetTint: number | null = null;
  private easeProgress = 0;
  private easeDuration = 0;
  private enabled = true;
  private activeBiome: BiomeType = 'fosso_chagas';

  /** Config por bioma: gradação de cor + saturação. */
  private biomeColor: Record<BiomeType, { saturate: number; hue: number; brightness: number }> = {
    fosso_chagas: { saturate: -0.1, hue: -5, brightness: -0.02 },
    catacumbas_martires: { saturate: -0.3, hue: 190, brightness: -0.05 },
    santuario_sangue: { saturate: 0.1, hue: -15, brightness: 0.03 },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const renderer = scene.game.renderer as any;
    this.isWebGL = renderer && renderer.isWebGL === true;

    if (this.isWebGL) {
      this.createFilters();
    }
  }

  private createFilters(): void {
    const camera = this.scene.cameras.main;
    const filters = (camera as any).filters;
    if (!filters) return;

    try {
      this.vignette = filters.internal.addVignette();
      this.colorMatrix = filters.internal.addColorMatrix();
      this.displacement = filters.internal.addDisplacement();
    } catch (e) {
      // Filtros indisponíveis (renderer sem suporte a filtros) — seguir sem eles.
      this.vignette = null;
      this.colorMatrix = null;
      this.displacement = null;
    }
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) {
      this.reset();
    }
  }

  public isFilterActive(): boolean {
    return this.enabled && this.isWebGL && this.vignette !== null;
  }

  public setBiome(biome: BiomeType, floorDepth: number = 1): void {
    this.activeBiome = biome;
    if (this.colorMatrix) {
      this.applyBiomeMatrix(floorDepth);
    }
  }

  private applyBiomeMatrix(floorDepth: number = 1): void {
    const config = this.biomeColor[this.activeBiome] || this.biomeColor.fosso_chagas;
    if (!this.colorMatrix) return;
    try {
      this.colorMatrix.colorMatrix.reset();

      // Cascata de Luz (A.3): Ajuste dinâmico de Hue e Saturation na GPU conforme a profundidade (floorDepth)
      const depthProgress = Math.min(1.0, Math.max(0, (floorDepth - 1) / 8));
      const cascadedHue = config.hue + (depthProgress * -30); // Desloca tom para o matiz avermelhado
      const cascadedSaturate = config.saturate + (depthProgress * 0.2); // Intensifica saturação com a profundidade

      this.colorMatrix.colorMatrix.saturate(cascadedSaturate);
      this.colorMatrix.colorMatrix.hue(cascadedHue);
      this.colorMatrix.colorMatrix.brightness(config.brightness);
    } catch (e) {
      // Ignorar falhas de matrix
    }
  }

  public setVignette(strength: number, duration: number = 300): void {
    this.targetVignette = Math.max(0, Math.min(1, strength));
    this.startEase(duration);
  }

  public setChromaticAberration(amount: number, duration: number = 200): void {
    // Displacement é o equivalente GPU mais próximo da aberração cromática.
    this.setDisplacement(amount, duration);
  }

  public setDisplacement(amount: number, duration: number = 300): void {
    this.targetDisplacement = Math.max(0, Math.min(1, amount));
    this.startEase(duration);
  }

  public triggerFearDistortion(durationMs: number = 1200): void {
    const isFearEnabled = useGameStore.getState().settings.fearDistortionEnabled ?? true;
    if (!isFearEnabled) return;

    this.setDisplacement(0.35, 200);
    this.setVignette(0.75, 200);
    this.setTint('#581c87', 200);

    this.scene.time.delayedCall(durationMs * 0.4, () => {
      this.setDisplacement(0.15, 300);
      this.setVignette(0.35, 300);
    });

    this.scene.time.delayedCall(durationMs, () => {
      this.setDisplacement(0, 400);
      this.setVignette(0, 400);
      this.setTint('transparent', 400);
    });
  }

  public setTint(color: string, duration: number = 300): void {
    if (!color || color === 'transparent') {
      this.targetTint = null;
    } else {
      const parsed = parseInt(color.replace('#', ''), 16);
      this.targetTint = isNaN(parsed) ? null : parsed;
    }
    this.startEase(duration);
  }

  public effectDeath(): void {
    this.setTint('#8b0000', 500);
    this.setVignette(0.9, 500);
    this.setDisplacement(0.15, 500);
  }

  public effectCriticalDamage(): void {
    this.setDisplacement(0.2, 150);
    this.setTint('#ffffff', 100);
    this.scene.time.delayedCall(100, () => this.setTint('transparent', 200));
  }

  public effectInfection(): void {
    this.setTint('#00ff00', 300);
    this.setDisplacement(0.1, 300);
    this.scene.time.delayedCall(300, () => this.setTint('transparent', 200));
  }

  public effectTension(level: number = 0.2): void {
    this.setVignette(level, 1000);
  }

  public reset(): void {
    this.targetVignette = 0;
    this.targetDisplacement = 0;
    this.targetTint = null;
    this.easeProgress = 0;
    this.easeDuration = 0;
    this.currentVignette = 0;
    this.currentDisplacement = 0;
    this.currentTint = null;

    if (this.vignette) this.vignette.strength = 0;
    if (this.displacement) {
      this.displacement.x = 0;
      this.displacement.y = 0;
    }
  }

  private startEase(duration: number): void {
    this.easeProgress = 0;
    this.easeDuration = duration;
  }

  public update(delta: number): void {
    if (!this.enabled || !this.isWebGL) return;

    if (this.easeDuration > 0) {
      this.easeProgress += delta;
      const progress = Math.min(this.easeProgress / this.easeDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);

      this.currentVignette += (this.targetVignette - this.currentVignette) * eased;
      this.currentDisplacement += (this.targetDisplacement - this.currentDisplacement) * eased;
      if (this.currentTint !== this.targetTint) {
        this.currentTint = this.targetTint;
      }

      if (progress === 1) {
        this.easeDuration = 0;
      }
    }

    this.apply();
  }

  private apply(): void {
    if (this.vignette) {
      this.vignette.strength = this.currentVignette;
    }
    if (this.displacement) {
      const amount = this.currentDisplacement * 0.05;
      this.displacement.x = amount;
      this.displacement.y = amount;
    }
    // O tint é aplicado via ColorMatrix; quando transparente, restaura a gradação do bioma.
    if (this.colorMatrix) {
      if (this.currentTint !== null) {
        try {
          const r = ((this.currentTint >> 16) & 0xff) / 255;
          const g = ((this.currentTint >> 8) & 0xff) / 255;
          const b = (this.currentTint & 0xff) / 255;
          this.colorMatrix.colorMatrix.set([
            r * 0.4 + 0.3, 0, 0, 0, 0,
            0, g * 0.4 + 0.3, 0, 0, 0,
            0, 0, b * 0.4 + 0.3, 0, 0,
            0, 0, 0, 1, 0,
          ]);
        } catch (e) {
          // Ignorar
        }
      } else {
        this.applyBiomeMatrix();
      }
    }
  }
}

export default PostFXSystem;
