import Phaser from 'phaser';
import { BiomeType } from '../../types/game';
import { worldManager, BiomeEnvironmentConfig } from './WorldManager';
import { useGameStore } from '../../store/gameStore';

export interface AtmosphereConfig {
  biomeId: BiomeType;
  groundFogAlpha: number;
  upperHazeAlpha: number;
  tintColor: number;
  driftSpeedX: number;
  driftSpeedY: number;
  weatherType: 'none' | 'blood_rain' | 'ash_embers' | 'spores';
}

/**
 * AtmosphereSystem (Frente 2: Clima, Névoa Volumétrica e Atmosfera)
 *
 * Gerencia a renderização de névoa de solo (Ground Mist - depth 750)
 * e bruma atmosférica sutil (Upper Haze - depth 1995), além de partículas
 * ambientais de clima (spores, cinzas, chuva fina de sangue).
 *
 * Prioridade Absoluta: Visibilidade do Gameplay.
 * As opacidades são rigorosamente contidas (máximo 0.16 no solo e 0.06 no alto)
 * para garantir que silhuetas de inimigos, telégrafos de ataque, projéteis
 * e itens permaneçam 100% nítidos em qualquer resolução.
 */
export class AtmosphereSystem {
  private scene: Phaser.Scene;
  private groundFog: Phaser.GameObjects.TileSprite | null = null;
  private upperHaze: Phaser.GameObjects.TileSprite | null = null;
  private weatherEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private weatherFadeInTween: Phaser.Tweens.Tween | null = null;

  private currentBiome: BiomeType = 'fosso_chagas';
  private config: AtmosphereConfig;
  private enabled: boolean = true;
  private visibilityGuard: number = 1.0; // Reduz sutilmente névoa durante combates pesados/chefes
  private initialFrequency: number = 250; // Base frequency before performance scaling

  private biomeAtmosphereConfigs: Record<BiomeType, AtmosphereConfig> = {
    fosso_chagas: {
      biomeId: 'fosso_chagas',
      groundFogAlpha: 0.12,
      upperHazeAlpha: 0.04,
      tintColor: 0x948075, // Tom terroso/esporos
      driftSpeedX: 0.08,
      driftSpeedY: 0.03,
      weatherType: 'spores',
    },
    catacumbas_martires: {
      biomeId: 'catacumbas_martires',
      groundFogAlpha: 0.15,
      upperHazeAlpha: 0.05,
      tintColor: 0x94a3b8, // Tom frio/cinéreo
      driftSpeedX: -0.06,
      driftSpeedY: 0.05,
      weatherType: 'ash_embers',
    },
    santuario_sangue: {
      biomeId: 'santuario_sangue',
      groundFogAlpha: 0.09,
      upperHazeAlpha: 0.03,
      tintColor: 0x991b1b, // Tom carmesim sutil
      driftSpeedX: 0.12,
      driftSpeedY: 0.08,
      weatherType: 'blood_rain',
    },
    safe_house: {
      biomeId: 'safe_house',
      groundFogAlpha: 0.04,
      upperHazeAlpha: 0.02,
      tintColor: 0xd97706, // Tom âmbar/lareira suave
      driftSpeedX: 0.02,
      driftSpeedY: 0.01,
      weatherType: 'none',
    },
    gloomy_woods: {
      biomeId: 'gloomy_woods',
      groundFogAlpha: 0.16,
      upperHazeAlpha: 0.06,
      tintColor: 0x64748b, // Tom azulado noturno
      driftSpeedX: 0.10,
      driftSpeedY: 0.04,
      weatherType: 'ash_embers',
    },
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.config = { ...this.biomeAtmosphereConfigs['fosso_chagas'] };
  }

  /**
   * Inicializa as camadas de névoa e partículas para o mapa atual
   */
  public initialize(mapW: number, mapH: number, biome: BiomeType = 'fosso_chagas'): void {
    this.currentBiome = biome;
    this.config = { ...(this.biomeAtmosphereConfigs[biome] || this.biomeAtmosphereConfigs['fosso_chagas']) };

    const postProcessing = useGameStore.getState().settings.postProcessingEnabled;
    this.enabled = postProcessing !== false;

    this.cleanup();

    const mistKey = this.scene.textures.exists('fog_mist') ? 'fog_mist' : 'particle_blood_red';
    const hazeKey = this.scene.textures.exists('fog_haze') ? 'fog_haze' : mistKey;

    try {
      // 1. Camada de Solo (Ground Mist) - Depth 750 (abaixo das entidades, acima do piso)
      this.groundFog = this.scene.add.tileSprite(0, 0, mapW, mapH, mistKey)
        .setOrigin(0, 0)
        .setDepth(750)
        .setAlpha(this.config.groundFogAlpha)
        .setTint(this.config.tintColor)
        .setVisible(this.enabled);

      // 2. Camada Superior Volumétrica (Upper Haze) - Depth 1995 (acima das entidades, abaixo do HUD)
      this.upperHaze = this.scene.add.tileSprite(0, 0, mapW, mapH, hazeKey)
        .setOrigin(0, 0)
        .setDepth(1995)
        .setAlpha(this.config.upperHazeAlpha)
        .setTint(this.config.tintColor)
        .setVisible(this.enabled);

      // 3. Clima atmosférico de partículas
      this.initWeatherEmitter();
    } catch {
      // Safe fallback
    }
  }

  /**
   * Inicializa o emissor de partículas de clima ambiente
   * Agora com texturas distintas por tipo, posicionamento inicial da câmera,
   * e fade-in de frequência para transição suave
   */
  private initWeatherEmitter(): void {
    if (this.weatherEmitter) {
      this.weatherEmitter.destroy();
      this.weatherEmitter = null;
    }
    if (this.weatherFadeInTween) {
      this.weatherFadeInTween.stop();
      this.weatherFadeInTween = null;
    }

    if (!this.enabled || this.config.weatherType === 'none') return;

    // Respeita configuração de performance
    const settings = useGameStore.getState().settings;
    const isLowPerf = settings.lowPerformanceParticles === true;

    // Posição inicial: câmera
    const cam = this.scene.cameras.main;
    const initX = cam?.worldView ? cam.worldView.x + cam.worldView.width * 0.5 : 0;
    const initY = cam?.worldView ? cam.worldView.y + cam.worldView.height * 0.5 : 0;

    try {
      if (this.config.weatherType === 'spores') {
        // Esporos bioluminescentes flutuando devagar — textura dedicada (hexágono suave)
        const baseFreq = 350;
        const frequency = isLowPerf ? Math.round(baseFreq * 1.4) : baseFreq;
        const quantity = isLowPerf ? 0 : 1; // Low perf: usa frequency mais lenta

        this.weatherEmitter = this.scene.add.particles(initX, initY, 'particle_spore', {
          scale: { start: 0.8, end: 0.4 },
          alpha: { start: 0.5, end: 0.1 },
          speedX: { min: -15, max: 20 },
          speedY: { min: -25, max: -5 },
          lifespan: { min: 2500, max: 4500 },
          frequency: frequency * 3, // Começa 3x mais lento
          quantity,
          emitting: true,
        }).setDepth(1996);

        // Fade-in de frequência: reduz para valor normal em ~1500ms
        this.initialFrequency = baseFreq;
        this.weatherFadeInTween = this.scene.tweens.addCounter({
          from: baseFreq * 3,
          to: baseFreq,
          duration: 1500,
          onUpdate: (tween) => {
            if (this.weatherEmitter) {
              this.weatherEmitter.frequency = tween.getValue() as number;
            }
          },
        });
      } else if (this.config.weatherType === 'ash_embers') {
        // Fagulhas e cinzas ascendentes — textura dedicada (retângulo fino inclinado)
        const baseFreq = 300;
        const frequency = isLowPerf ? Math.round(baseFreq * 1.4) : baseFreq;
        const quantity = isLowPerf ? 0 : 1;

        this.weatherEmitter = this.scene.add.particles(initX, initY, 'particle_ash', {
          scale: { start: 0.9, end: 0.2 },
          alpha: { start: 0.5, end: 0 },
          speedX: { min: -20, max: 20 },
          speedY: { min: -40, max: -15 },
          lifespan: { min: 2000, max: 3500 },
          frequency: frequency * 3,
          quantity,
          emitting: true,
        }).setDepth(1996);

        this.initialFrequency = baseFreq;
        this.weatherFadeInTween = this.scene.tweens.addCounter({
          from: baseFreq * 3,
          to: baseFreq,
          duration: 1500,
          onUpdate: (tween) => {
            if (this.weatherEmitter) {
              this.weatherEmitter.frequency = tween.getValue() as number;
            }
          },
        });
      } else if (this.config.weatherType === 'blood_rain') {
        // Chuvisco carmesim sutil — textura dedicada (gota diagonal)
        const baseFreq = 200;
        const frequency = isLowPerf ? Math.round(baseFreq * 1.4) : baseFreq;
        const quantity = isLowPerf ? 1 : 2;

        this.weatherEmitter = this.scene.add.particles(initX, initY, 'particle_blood_drop', {
          scale: { start: 0.8, end: 0.1 },
          alpha: { start: 0.4, end: 0 },
          speedX: { min: 40, max: 70 },
          speedY: { min: 140, max: 220 },
          lifespan: { min: 400, max: 700 },
          frequency: frequency * 3,
          quantity,
          emitting: true,
        }).setDepth(1996);

        this.initialFrequency = baseFreq;
        this.weatherFadeInTween = this.scene.tweens.addCounter({
          from: baseFreq * 3,
          to: baseFreq,
          duration: 1500,
          onUpdate: (tween) => {
            if (this.weatherEmitter) {
              this.weatherEmitter.frequency = tween.getValue() as number;
            }
          },
        });
      }
    } catch {
      // Safe fallback
    }
  }

  /**
   * Transição suave de bioma
   */
  public setBiome(biome: BiomeType): void {
    this.currentBiome = biome;
    const targetConfig = this.biomeAtmosphereConfigs[biome] || this.biomeAtmosphereConfigs['fosso_chagas'];
    this.config = { ...targetConfig };

    if (!this.enabled) return;

    if (this.groundFog && this.groundFog.active) {
      this.groundFog.setTint(this.config.tintColor);
      this.scene.tweens.add({
        targets: this.groundFog,
        alpha: this.config.groundFogAlpha * this.visibilityGuard,
        duration: 800,
        ease: 'Sine.easeInOut',
      });
    }

    if (this.upperHaze && this.upperHaze.active) {
      this.upperHaze.setTint(this.config.tintColor);
      this.scene.tweens.add({
        targets: this.upperHaze,
        alpha: this.config.upperHazeAlpha * this.visibilityGuard,
        duration: 800,
        ease: 'Sine.easeInOut',
      });
    }

    this.initWeatherEmitter();
  }

  /**
   * Atualização contínua do movimento da névoa e partículas
   */
  public update(delta: number = 16, isCombatIntense: boolean = false): void {
    if (!this.enabled) return;

    // Ajuste dinâmico de proteção de visibilidade durante combates intensos
    const targetGuard = isCombatIntense ? 0.7 : 1.0;
    this.visibilityGuard += (targetGuard - this.visibilityGuard) * 0.05;

    const timeScale = delta / 16.6;

    if (this.groundFog && this.groundFog.active) {
      this.groundFog.tilePositionX += this.config.driftSpeedX * timeScale;
      this.groundFog.tilePositionY += this.config.driftSpeedY * timeScale;
      this.groundFog.setAlpha(this.config.groundFogAlpha * this.visibilityGuard);
    }

    if (this.upperHaze && this.upperHaze.active) {
      this.upperHaze.tilePositionX -= (this.config.driftSpeedX * 0.7) * timeScale;
      this.upperHaze.tilePositionY += (this.config.driftSpeedY * 1.3) * timeScale;
      this.upperHaze.setAlpha(this.config.upperHazeAlpha * this.visibilityGuard);
    }

    // Sincroniza a zona de emissão de clima com a câmera para que as partículas
    // fiquem apenas ao redor da tela visível do jogador sem desperdiçar memória
    if (this.weatherEmitter && this.weatherEmitter.active) {
      const cam = this.scene.cameras.main;
      if (cam) {
        this.weatherEmitter.setPosition(
          cam.worldView.x + cam.worldView.width * 0.5,
          cam.worldView.y + cam.worldView.height * 0.5
        );
      }
    }
  }

  /**
   * Ativa ou desativa a atmosfera (respeitando configurações do usuário)
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.groundFog) this.groundFog.setVisible(enabled);
    if (this.upperHaze) this.upperHaze.setVisible(enabled);
    if (this.weatherFadeInTween) {
      this.weatherFadeInTween.stop();
      this.weatherFadeInTween = null;
    }
    if (this.weatherEmitter) {
      if (enabled) {
        this.initWeatherEmitter();
      } else {
        this.weatherEmitter.destroy();
        this.weatherEmitter = null;
      }
    }
  }

  /**
   * Liberação de recursos
   */
  public cleanup(): void {
    if (this.groundFog) {
      try { this.groundFog.destroy(); } catch { /* ignore */ }
      this.groundFog = null;
    }
    if (this.upperHaze) {
      try { this.upperHaze.destroy(); } catch { /* ignore */ }
      this.upperHaze = null;
    }
    if (this.weatherFadeInTween) {
      try { this.weatherFadeInTween.stop(); } catch { /* ignore */ }
      this.weatherFadeInTween = null;
    }
    if (this.weatherEmitter) {
      try { this.weatherEmitter.destroy(); } catch { /* ignore */ }
      this.weatherEmitter = null;
    }
  }
}
