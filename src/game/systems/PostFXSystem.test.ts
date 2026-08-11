import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostFXSystem } from './PostFXSystem';

function makeRenderer(isWebGL: boolean) {
  return { isWebGL };
}

function makeScene(options: { isWebGL?: boolean } = {}) {
  const isWebGL = options.isWebGL ?? true;
  const camera = {
    filters: {
      internal: {
        addVignette: vi.fn(() => ({ strength: 0 })),
        addColorMatrix: vi.fn(() => ({ colorMatrix: { reset: vi.fn(), saturate: vi.fn(), hue: vi.fn(), brightness: vi.fn(), set: vi.fn() } })),
        addDisplacement: vi.fn(() => ({ x: 0, y: 0 })),
      },
      external: {},
    },
  };
  const scene = {
    game: { renderer: makeRenderer(isWebGL) },
    cameras: { main: camera },
    time: { delayedCall: vi.fn() },
  };
  return { scene, camera };
}

describe('PostFXSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria filtros quando o renderer é WebGL', () => {
    const { scene, camera } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    expect(camera.filters.internal.addVignette).toHaveBeenCalled();
    expect(camera.filters.internal.addColorMatrix).toHaveBeenCalled();
    expect(camera.filters.internal.addDisplacement).toHaveBeenCalled();
    expect(system.isFilterActive()).toBe(true);
  });

  it('não cria filtros quando o renderer não é WebGL', () => {
    const { scene, camera } = makeScene({ isWebGL: false });
    const system = new PostFXSystem(scene as any);
    expect(camera.filters.internal.addVignette).not.toHaveBeenCalled();
    expect(system.isFilterActive()).toBe(false);
  });

  it('setEnabled(false) desliga e reseta os efeitos', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.setEnabled(false);
    expect(system.isFilterActive()).toBe(false);
  });

  it('setVignette interpola a força alvo', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.setVignette(0.8, 100);
    system.update(50);
    expect(system.isFilterActive()).toBe(true);
    // Após metade do easing, força está entre 0 e 0.8.
    system.update(50);
  });

  it('setChromaticAberration delega ao displacement', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.setChromaticAberration(0.5, 100);
    system.update(100);
    system.reset();
    expect(system.isFilterActive()).toBe(true);
  });

  it('setBiome aplica a matrix de cor por bioma', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.setBiome('catacumbas_martires');
    system.update(0);
    // Não deve lançar erro.
    expect(system.isFilterActive()).toBe(true);
  });

  it('effectDeath aplica tint vermelho e vinheta', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.effectDeath();
    system.update(0);
    expect(system.isFilterActive()).toBe(true);
  });

  it('effectCriticalDamage agenda a remoção do tint', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.effectCriticalDamage();
    expect(scene.time.delayedCall).toHaveBeenCalled();
  });
});
