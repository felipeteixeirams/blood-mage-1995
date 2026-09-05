import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

/**
 * Advanced Particles (Fase 5)
 * Sistema de partículas avançadas para gore, sangue e efeitos visuais.
 * Usa a API do Phaser 4 (scene.add.particles -> ParticleEmitter), que
 * substituiu o antigo ParticleEmitterManager / createEmitter do Phaser 3.
 */

export interface ParticleEffect {
  type: 'blood_splatter' | 'bone_dust' | 'acid_splash' | 'spectral_burst' | 'critical_hit';
  x: number;
  y: number;
  intensity: number; // 0-1
  angle?: number;
}

export class AdvancedParticles {
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initEmitters();
  }

  /**
   * Inicializar emissores de partículas
   */
  private initEmitters(): void {
    // Blood Splatter - spray vermelho realista
    const bloodEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
      speed: { min: -300, max: 300 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.8, end: 0 },
      lifespan: 800,
      gravityY: 400,
      emitting: false,
    });
    this.emitters.set('blood_splatter', bloodEmitter);

    // Bone Dust - partículas brancas/cinzas
    const boneEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
      speed: { min: -250, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 700,
      gravityY: 200,
      tint: 0xdcd3c1,
      emitting: false,
    });
    this.emitters.set('bone_dust', boneEmitter);

    // Acid Splash - partículas verdes corrosivas
    const acidEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
      speed: { min: -280, max: 280 },
      angle: { min: 220, max: 320 },
      scale: { start: 1, end: 0 },
      lifespan: 900,
      gravityY: 350,
      tint: 0x84cc16,
      emitting: false,
    });
    this.emitters.set('acid_splash', acidEmitter);

    // Spectral Burst - partículas roxas sobrenaturais
    const spectralEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
      speed: { min: -400, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 1000,
      gravityY: 100,
      tint: 0xa855f7,
      emitting: false,
    });
    this.emitters.set('spectral_burst', spectralEmitter);

    // Critical Hit - explosão de ouro/branco
    const criticalEmitter = this.scene.add.particles(0, 0, 'particle_blood_red', {
      speed: { min: -350, max: 350 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 600,
      gravityY: 200,
      tint: 0xfacc15,
      emitting: false,
    });
    this.emitters.set('critical_hit', criticalEmitter);
  }

  /**
   * Emitir efeito de partículas com escala de performance
   */
  public emit(effect: ParticleEffect): void {
    const emitter = this.emitters.get(effect.type);
    if (!emitter) return;

    let isLowPerf = false;
    try {
      isLowPerf = useGameStore.getState().settings.lowPerformanceParticles ?? false;
    } catch {
      // safe fallback
    }

    // Ajustar intensidade (qtd de partículas)
    const baseCount = Math.floor(10 + effect.intensity * 20);
    const particleCount = isLowPerf ? Math.max(3, Math.floor(baseCount * 0.45)) : baseCount;

    // Emitir no ponto especificado
    emitter.emitParticleAt(effect.x, effect.y, particleCount);
  }

  /**
   * Helper para emitir gore específico de monstro
   */
  public emitMonsterGore(
    type: 'blood_splatter' | 'bone_dust' | 'acid_splash' | 'spectral_burst' | 'critical_hit',
    x: number,
    y: number,
    intensity: number = 1.0
  ): void {
    this.emit({
      type,
      x,
      y,
      intensity,
    });
  }

  /**
   * Emitir rastro de Dash com faíscas rubro-espectrais
   */
  public emitDashTrail(x: number, y: number, angle?: number): void {
    this.emitSpellTrail(x, y, 4);
    this.emit({
      type: 'spectral_burst',
      x,
      y,
      intensity: 0.35,
      angle,
    });
  }

  /**
   * Emitir efeito direcional (com ângulo)
   */
  public emitDirectional(effect: ParticleEffect): void {
    const emitter = this.emitters.get(effect.type);
    if (!emitter) return;

    if (effect.angle !== undefined) {
      emitter.setAngle(effect.angle);
    }

    this.emit(effect);
  }

  /**
   * Parar todas as emissões
   */
  public stopAll(): void {
    this.emitters.forEach((emitter) => {
      emitter.stop();
    });
  }

  /**
   * Inicializar emissores de atmosfera ambiental do calabouço.
   * Deve ser chamado uma vez ao iniciar a cena. Os emissores de névoa e brasa
   * ficam ativos continuamente em baixa intensidade para criar a sensação
   * de calabouço vivo.
   * @param worldWidth Largura total do mapa (para dispersar as partículas)
   * @param worldHeight Altura total do mapa
   */
  public startAmbient(worldWidth: number, worldHeight: number): void {
    // 1. Névoa rasteira — partículas lentas e translúcidas de baixo nível (fog_wisp)
    if (!this.emitters.has('atmospheric_fog')) {
      try {
        const fogEmitter = this.scene.add.particles(worldWidth / 2, worldHeight - 32, 'particle_fog_wisp', {
          x: { min: -(worldWidth / 2), max: worldWidth / 2 },
          y: { min: -12, max: 12 },
          speedX: { min: -10, max: 10 },
          speedY: { min: -3, max: 3 },
          alpha: { start: 0.55, end: 0 },
          scale: { start: 3.5, end: 6 },
          lifespan: { min: 5000, max: 9000 },
          frequency: 280,
          emitting: true,
        });
        // Phaser 4: 'depth' não existe mais em ParticleEmitterConfig — a profundidade
        // do emissor é uma propriedade da instância (Components.Depth), setada abaixo.
        fogEmitter.setDepth(-1);
        this.emitters.set('atmospheric_fog', fogEmitter);
      } catch (_) { /* Partículas indisponíveis */ }
    }

    // 2. Brasas de tochas ascendentes (particle_torch_ember) — pequenas, rápidas, quentes
    if (!this.emitters.has('torch_embers')) {
      try {
        const emberEmitter = this.scene.add.particles(0, 0, 'particle_torch_ember', {
          x: { min: 0, max: worldWidth },
          y: { min: 0, max: worldHeight },
          speedX: { min: -15, max: 15 },
          speedY: { min: -55, max: -25 },
          alpha: { start: 0.9, end: 0 },
          scale: { start: 0.9, end: 0.3 },
          lifespan: { min: 800, max: 1600 },
          frequency: 600,
          tint: [0xff9900, 0xffd700, 0xff5500],
          gravityY: -30,
          emitting: true,
        });
        emberEmitter.setDepth(10);
        this.emitters.set('torch_embers', emberEmitter);
      } catch (_) { /* Partículas indisponíveis */ }
    }
  }

  /**
   * Para os emissores ambientais (ao sair da cena ou mudar de área).
   */
  public stopAmbient(): void {
    const fog = this.emitters.get('atmospheric_fog');
    if (fog) { fog.stop(); }
    const embers = this.emitters.get('torch_embers');
    if (embers) { embers.stop(); }
    this.stopForestAmbient();
  }

  /**
   * Inicializa partículas ambientes de poeira/pólen flutuante da floresta gloomy_woods.
   * Baixa velocidade, vida longa, emissão contínua e sutil, casando com frestas de luz solar.
   */
  public startForestAmbient(worldWidth: number, worldHeight: number): void {
    if (!this.emitters.has('forest_pollen')) {
      try {
        const textureKey = this.scene.textures.exists('particle_blood_red') ? 'particle_blood_red' : 'particle_torch_ember';
        const pollenEmitter = this.scene.add.particles(worldWidth / 2, worldHeight / 2, textureKey, {
          x: { min: -(worldWidth / 2), max: worldWidth / 2 },
          y: { min: -(worldHeight / 2), max: worldHeight / 2 },
          speedX: { min: -12, max: 12 },
          speedY: { min: -8, max: 8 },
          alpha: { start: 0, end: 0.65, ease: 'Sine.easeInOut' },
          scale: { start: 0.25, end: 0.55 },
          lifespan: { min: 4500, max: 8500 },
          frequency: 320,
          tint: [0xd4e157, 0xc0ca33, 0xaed581, 0xffeb3b],
          emitting: true,
        });
        pollenEmitter.setDepth(15);
        this.emitters.set('forest_pollen', pollenEmitter);
      } catch (_) { /* Partículas indisponíveis */ }
    }
  }

  /**
   * Para o emissor de poeira/pólen flutuante da floresta.
   */
  public stopForestAmbient(): void {
    const pollen = this.emitters.get('forest_pollen');
    if (pollen) { pollen.stop(); }
  }

  /**
   * Emitir rastro de feitiço ou dash (particle_spell_trail) na posição dada.
   * Deve ser chamado a cada frame de movimento/projeção.
   * @param x Posição X do rastro
   * @param y Posição Y do rastro
   * @param count Número de partículas emitidas (padrão 3)
   */
  public emitSpellTrail(x: number, y: number, count: number = 3): void {
    if (!this.emitters.has('spell_trail')) {
      try {
        const trailEmitter = this.scene.add.particles(0, 0, 'particle_spell_trail', {
          speed: { min: 10, max: 40 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: { min: 150, max: 280 },
          gravityY: 0,
          emitting: false,
        });
        trailEmitter.setDepth(5);
        this.emitters.set('spell_trail', trailEmitter);
      } catch (_) { return; }
    }
    const emitter = this.emitters.get('spell_trail');
    if (emitter) { emitter.emitParticleAt(x, y, count); }
  }
}

export default AdvancedParticles;
