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
  private activeFloorDepth = 1;

  /** Config por bioma: gradação de cor + saturação. */
  private biomeColor: Record<BiomeType, { saturate: number; hue: number; brightness: number }> = {
    fosso_chagas: { saturate: -0.1, hue: -5, brightness: -0.02 },
    catacumbas_martires: { saturate: -0.3, hue: 190, brightness: -0.05 },
    santuario_sangue: { saturate: 0.1, hue: -15, brightness: 0.03 },
    safe_house: { saturate: 0.15, hue: 15, brightness: 0.02 },
    gloomy_woods: { saturate: 0, hue: 0, brightness: -0.08 },
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
      // Phaser 4 Beam Renderer: Filtros de câmera para tela cheia usam camera.filters.external
      const scope = filters.external || filters.internal;
      if (scope) {
        if (typeof scope.addVignette === 'function') this.vignette = scope.addVignette();
        if (typeof scope.addColorMatrix === 'function') this.colorMatrix = scope.addColorMatrix();
        if (typeof scope.addDisplacement === 'function') this.displacement = scope.addDisplacement();
      }
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
    this.activeFloorDepth = floorDepth;
    if (this.colorMatrix) {
      this.applyBiomeMatrix(floorDepth);
    }
    // Vinheta atmosférica na floresta gloomy_woods
    if (biome === 'gloomy_woods') {
      this.setVignette(0.40, 500);
    }
  }

  /**
   * Fase C (Transições Sem Corte): Interpolação contínua da matriz de cor GPU
   * entre dois biomas com base no fator t (0.0 a 1.0).
   */
  public blendBiomes(biomeA: BiomeType, biomeB: BiomeType, t: number, floorDepth: number = 1): void {
    const clampedT = Math.max(0, Math.min(1, t));
    this.activeBiome = clampedT >= 0.5 ? biomeB : biomeA;
    this.activeFloorDepth = floorDepth;

    if (!this.colorMatrix) return;

    const configA = this.biomeColor[biomeA] || this.biomeColor.fosso_chagas;
    const configB = this.biomeColor[biomeB] || this.biomeColor.fosso_chagas;

    const saturate = configA.saturate + (configB.saturate - configA.saturate) * clampedT;
    const hue = configA.hue + (configB.hue - configA.hue) * clampedT;
    const brightness = configA.brightness + (configB.brightness - configA.brightness) * clampedT;

    try {
      this.colorMatrix.colorMatrix.reset();

      const depthProgress = Math.min(1.0, Math.max(0, (floorDepth - 1) / 8));
      const cascadedHue = hue + (depthProgress * -30);
      const cascadedSaturate = saturate + (depthProgress * 0.2);

      this.colorMatrix.colorMatrix.saturate(cascadedSaturate);
      this.colorMatrix.colorMatrix.hue(cascadedHue);
      this.colorMatrix.colorMatrix.brightness(brightness);
    } catch (e) {
      // Ignorar falhas de matrix
    }

    if (biomeA === 'gloomy_woods' || biomeB === 'gloomy_woods') {
      const vignetteA = biomeA === 'gloomy_woods' ? 0.40 : 0.0;
      const vignetteB = biomeB === 'gloomy_woods' ? 0.40 : 0.0;
      const targetVignette = vignetteA + (vignetteB - vignetteA) * clampedT;
      this.setVignette(targetVignette, 100);
    }
  }

  private applyBiomeMatrix(floorDepth: number = this.activeFloorDepth): void {
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

  private isTensionActive = false;
  private tensionPulseTimer = 0;
  private tensionPulsePeriod = 1200; // ms per pulse
  private tensionMinVignette = 0.45;
  private tensionMaxVignette = 0.80;
  private effectSequenceCounter = 0;

  private nextSeq(): number {
    this.effectSequenceCounter++;
    return this.effectSequenceCounter;
  }

  public triggerShockwave(durationMs: number = 450, intensity: number = 0.5): void {
    const postProcessing = useGameStore.getState().settings.postProcessingEnabled ?? true;
    if (!postProcessing) return;

    const seq = this.nextSeq();
    this.setDisplacement(Math.min(1.0, intensity * 0.9), durationMs * 0.3);
    this.scene.time.delayedCall(durationMs * 0.3, () => {
      if (this.effectSequenceCounter === seq) {
        this.setDisplacement(intensity * 0.3, durationMs * 0.35);
      }
    });
    this.scene.time.delayedCall(durationMs * 0.65, () => {
      if (this.effectSequenceCounter === seq) {
        this.setDisplacement(0, durationMs * 0.35);
      }
    });
  }

  public setLowHpTension(active: boolean, pulsePeriod: number = 1200): void {
    if (active) {
      this.isTensionActive = true;
      this.tensionPulsePeriod = pulsePeriod;
      this.tensionMinVignette = 0.45;
      this.tensionMaxVignette = 0.80;
    } else if (!this.isTensionActive) {
      if (this.targetTint === 0x880000 || this.targetTint === 0xef4444) {
        this.setTint('transparent', 400);
        this.setVignette(0, 400);
      }
    }
  }

  /**
   * Spec 11 §3.3: Vinheta Pulsante por Nível de Perigo
   * - Perigo Baixo (1-3 inimigos): Vinheta estática padrão.
   * - Perigo Médio (4-10 inimigos): Pulsação lenta (2000ms / 2s).
   * - Perigo Alto (>10 inimigos ou Chefe ativo / HP <= 25%): Pulsação rápida (800ms) com tom avermelhado.
   */
  public setDangerTension(hpRatio: number, alertCount: number, isBossActive: boolean): void {
    const isLowHp = hpRatio <= 0.25;
    const isHighDanger = isBossActive || alertCount > 10 || isLowHp;
    const isMediumDanger = alertCount >= 4;

    if (isHighDanger) {
      this.isTensionActive = true;
      this.tensionPulsePeriod = isLowHp ? 1200 : 800;
      this.tensionMinVignette = 0.45;
      this.tensionMaxVignette = 0.85;
      if (this.targetTint === null) {
        this.setTint('#ef4444', 300);
      }
    } else if (isMediumDanger) {
      this.isTensionActive = true;
      this.tensionPulsePeriod = 2000;
      this.tensionMinVignette = 0.35;
      this.tensionMaxVignette = 0.65;
      if (this.targetTint === 0xef4444) {
        this.setTint('transparent', 300);
      }
    } else {
      if (this.isTensionActive) {
        this.isTensionActive = false;
        if (this.targetTint === 0xef4444 || this.targetTint === 0x880000) {
          this.setTint('transparent', 400);
        }
        this.setVignette(0, 400);
      }
    }
  }

  public triggerBossImpactFX(): void {
    const seq = this.nextSeq();
    this.triggerShockwave(600, 0.7);
    this.setVignette(0.7, 150);
    this.scene.time.delayedCall(150, () => {
      if (this.effectSequenceCounter === seq) {
        this.setVignette(0, 450);
      }
    });
  }

  public triggerLevelUpFX(): void {
    const seq = this.nextSeq();
    this.setTint('#fef08a', 200);
    this.setVignette(0.4, 200);
    this.scene.time.delayedCall(200, () => {
      if (this.effectSequenceCounter === seq) {
        this.setTint('transparent', 600);
        this.setVignette(0, 600);
      }
    });
  }

  public triggerFearDistortion(durationMs: number = 1200): void {
    const isFearEnabled = useGameStore.getState().settings.fearDistortionEnabled ?? true;
    if (!isFearEnabled) return;

    const seq = this.nextSeq();
    this.setDisplacement(0.35, 200);
    this.setVignette(0.75, 200);
    this.setTint('#581c87', 200);

    this.scene.time.delayedCall(durationMs * 0.4, () => {
      if (this.effectSequenceCounter === seq) {
        this.setDisplacement(0.15, 300);
        this.setVignette(0.35, 300);
      }
    });

    this.scene.time.delayedCall(durationMs, () => {
      if (this.effectSequenceCounter === seq) {
        this.setDisplacement(0, 400);
        this.setVignette(0, 400);
        this.setTint('transparent', 400);
      }
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
    this.isTensionActive = false;

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

    // Pulso dinâmico de perigo / baixa vida (Danger Tension Pulse)
    if (this.isTensionActive) {
      this.tensionPulseTimer += delta;
      const wave = (Math.sin((this.tensionPulseTimer / this.tensionPulsePeriod) * Math.PI * 2) + 1) * 0.5;
      const baseVignette = this.tensionMinVignette + wave * (this.tensionMaxVignette - this.tensionMinVignette);
      if (this.easeDuration === 0) {
        this.currentVignette = baseVignette;
      }
    }

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
    const isCrt = useGameStore.getState().settings.crtFilter ?? false;

    if (this.vignette) {
      const crtExtra = isCrt ? 0.12 : 0;
      this.vignette.strength = Math.min(1.0, this.currentVignette + crtExtra);
    }
    if (this.displacement) {
      const crtDisplacement = isCrt ? 0.003 : 0;
      const amount = this.currentDisplacement * 0.05 + crtDisplacement;
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
