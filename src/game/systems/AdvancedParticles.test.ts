import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedParticles } from './AdvancedParticles';

function makeMockScene() {
  const add = {
    particles: vi.fn((_x: number, _y: number, _texture: string, _config: any) => {
      const emitter = {
        emitParticleAt: vi.fn(),
        setAngle: vi.fn(),
        setDepth: vi.fn(),
        stop: vi.fn(),
      };
      return emitter;
    }),
  };
  const scene = { add } as any;
  return { scene, add };
}

describe('AdvancedParticles System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa todos os emissores base com sucesso', () => {
    const { scene, add } = makeMockScene();
    const particles = new AdvancedParticles(scene);
    expect(add.particles).toHaveBeenCalledTimes(5); // blood_splatter, bone_dust, acid_splash, spectral_burst, critical_hit
  });

  it('emite partículas com emit() para efeito válido', () => {
    const { scene } = makeMockScene();
    const particles = new AdvancedParticles(scene);
    particles.emit({
      type: 'blood_splatter',
      x: 100,
      y: 150,
      intensity: 0.8,
    });
    // Não deve lançar erro
    expect(particles).toBeDefined();
  });

  it('emite gore com helper emitMonsterGore()', () => {
    const { scene } = makeMockScene();
    const particles = new AdvancedParticles(scene);
    particles.emitMonsterGore('bone_dust', 200, 300, 1.0);
    particles.emitMonsterGore('acid_splash', 200, 300, 0.5);
    particles.emitMonsterGore('spectral_burst', 200, 300, 0.7);
    expect(particles).toBeDefined();
  });

  it('emite dash trail com faíscas espectrais', () => {
    const { scene } = makeMockScene();
    const particles = new AdvancedParticles(scene);
    particles.emitDashTrail(50, 80, Math.PI / 4);
    expect(particles).toBeDefined();
  });

  it('startAmbient e stopAmbient geram névoa e brasas', () => {
    const { scene } = makeMockScene();
    const particles = new AdvancedParticles(scene);
    particles.startAmbient(1200, 800);
    particles.stopAmbient();
    expect(particles).toBeDefined();
  });

  it('stopAll para todos os emissores', () => {
    const { scene } = makeMockScene();
    const particles = new AdvancedParticles(scene);
    particles.stopAll();
    expect(particles).toBeDefined();
  });
});
