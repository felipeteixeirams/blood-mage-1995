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

  private currentBiome: BiomeType = 'fosso_chagas';
  private config: AtmosphereConfig;
  private enabled: boolean = true;
  private visibilityGuard: number = 1.0; // Reduz sutilmente névoa durante combates pesados/chefes

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
   */
  private initWeatherEmitter(): void {
    if (this.weatherEmitter) {
      this.weatherEmitter.destroy();
      this.weatherEmitter = null;
    }

    if (!this.enabled || this.config.weatherType === 'none') return;

    try {
      if (this.config.weatherType === 'spores') {
        // Esporos bioluminescentes flutuando devagar
        this.weatherEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
          scale: { start: 0.3, end: 0.1 },
          alpha: { start: 0.35, end: 0 },
          speedX: { min: -15, max: 20 },
          speedY: { min: -25, max: -5 },
          lifespan: { min: 2500, max: 4500 },
          frequency: 350,
          quantity: 1,
          tint: 0xa3e635,
          emitting: true,
        }).setDepth(1996);
      } else if (this.config.weatherType === 'ash_embers') {
        // Fagulhas e cinzas ascendentes
        this.weatherEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
          scale: { start: 0.35, end: 0.05 },
          alpha: { start: 0.4, end: 0 },
          speedX: { min: -20, max: 20 },
          speedY: { min: -40, max: -15 },
          lifespan: { min: 2000, max: 3500 },
          frequency: 300,
          quantity: 1,
          tint: [0xdcd3c1, 0xf97316],
          emitting: true,
        }).setDepth(1996);
      } else if (this.config.weatherType === 'blood_rain') {
        // Chuvisco carmesim sutil
        this.weatherEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
          scale: { start: 0.25, end: 0.05 },
          alpha: { start: 0.3, end: 0 },
          speedX: { min: 40, max: 70 },
          speedY: { min: 140, max: 220 },
          lifespan: { min: 400, max: 700 },
          frequency: 200,
          quantity: 2,
          tint: 0xdc2626,
          emitting: true,
        }).setDepth(1996);
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
    if (this.weatherEmitter) {
      try { this.weatherEmitter.destroy(); } catch { /* ignore */ }
      this.weatherEmitter = null;
    }
  }
}
