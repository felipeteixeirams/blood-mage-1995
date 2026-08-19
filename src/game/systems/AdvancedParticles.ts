import Phaser from 'phaser';

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
   * Emitir efeito de partículas
   */
  public emit(effect: ParticleEffect): void {
    const emitter = this.emitters.get(effect.type);
    if (!emitter) return;

    // Ajustar intensidade (qtd de partículas)
    const particleCount = Math.floor(10 + effect.intensity * 20);

    // Emitir no ponto especificado
    emitter.emitParticleAt(effect.x, effect.y, particleCount);
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
}

export default AdvancedParticles;
