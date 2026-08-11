/**
 * Advanced Particles (Fase 5)
 * Sistema de partículas avançadas para gore, sangue e efeitos visuais
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
    const particleSystem = this.scene.make.particles({
      speed: { min: -200, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
    });

    // Blood Splatter - spray vermelho realista
    const bloodEmitter = particleSystem.createEmitter({
      speed: { min: -300, max: 300 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.8, end: 0 },
      lifespan: 800,
      gravityY: 400,
      emitZone: { type: 'circle', source: new Phaser.Geom.Circle(0, 0, 5) },
    });
    bloodEmitter.stop();
    this.emitters.set('blood_splatter', bloodEmitter);

    // Bone Dust - partículas brancas/cinzas
    const boneEmitter = particleSystem.createEmitter({
      speed: { min: -250, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 700,
      gravityY: 200,
      emitZone: { type: 'circle', source: new Phaser.Geom.Circle(0, 0, 8) },
    });
    boneEmitter.stop();
    this.emitters.set('bone_dust', boneEmitter);

    // Acid Splash - partículas verdes corrosivas
    const acidEmitter = particleSystem.createEmitter({
      speed: { min: -280, max: 280 },
      angle: { min: 220, max: 320 },
      scale: { start: 1, end: 0 },
      lifespan: 900,
      gravityY: 350,
      emitZone: { type: 'circle', source: new Phaser.Geom.Circle(0, 0, 6) },
    });
    acidEmitter.stop();
    this.emitters.set('acid_splash', acidEmitter);

    // Spectral Burst - partículas roxas sobrenaturais
    const spectralEmitter = particleSystem.createEmitter({
      speed: { min: -400, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 1000,
      gravityY: 100,
      emitZone: { type: 'circle', source: new Phaser.Geom.Circle(0, 0, 10) },
    });
    spectralEmitter.stop();
    this.emitters.set('spectral_burst', spectralEmitter);

    // Critical Hit - explosão de ouro/branco
    const criticalEmitter = particleSystem.createEmitter({
      speed: { min: -350, max: 350 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 600,
      gravityY: 200,
      emitZone: { type: 'circle', source: new Phaser.Geom.Circle(0, 0, 8) },
    });
    criticalEmitter.stop();
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
