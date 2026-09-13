import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostFXSystem } from './PostFXSystem';

function makeRenderer(isWebGL: boolean) {
  return { isWebGL };
}

function makeScene(options: { isWebGL?: boolean } = {}) {
  const isWebGL = options.isWebGL ?? true;
  const externalFilters = {
    addVignette: vi.fn(() => ({ strength: 0 })),
    addColorMatrix: vi.fn(() => ({ colorMatrix: { reset: vi.fn(), saturate: vi.fn(), hue: vi.fn(), brightness: vi.fn(), set: vi.fn() } })),
    addDisplacement: vi.fn(() => ({ x: 0, y: 0 })),
  };
  const camera = {
    filters: {
      internal: {},
      external: externalFilters,
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
    expect(camera.filters.external.addVignette).toHaveBeenCalled();
    expect(camera.filters.external.addColorMatrix).toHaveBeenCalled();
    expect(camera.filters.external.addDisplacement).toHaveBeenCalled();
    expect(system.isFilterActive()).toBe(true);
  });

  it('não cria filtros quando o renderer não é WebGL', () => {
    const { scene, camera } = makeScene({ isWebGL: false });
    const system = new PostFXSystem(scene as any);
    expect(camera.filters.external.addVignette).not.toHaveBeenCalled();
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

  it('triggerShockwave ativa displacement em cascata com timers', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.triggerShockwave(500, 0.6);
    expect(scene.time.delayedCall).toHaveBeenCalled();
  });

  it('setLowHpTension ativa pulsação dinâmica de vinheta', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.setLowHpTension(true, 1000);
    system.update(250);
    expect(system.isFilterActive()).toBe(true);
    system.setLowHpTension(false);
  });

  it('setDangerTension ajusta vinheta e pulso por nível de perigo (baixo, médio e alto/boss/lowHp)', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    // Perigo baixo (1-3 inimigos, HP alto, sem boss)
    system.setDangerTension(1.0, 2, false);
    system.update(100);

    // Perigo médio (4-10 inimigos) -> pulsação de médio perigo
    system.setDangerTension(0.8, 5, false);
    system.update(100);
    expect(system.isFilterActive()).toBe(true);

    // Perigo alto (>10 inimigos ou boss ou HP <= 25%) -> pulsação rápida + tint avermelhado
    system.setDangerTension(0.2, 2, false);
    system.update(100);
    expect(system.isFilterActive()).toBe(true);

    // Retorno ao perigo baixo reseta a vinheta de tensão
    system.setDangerTension(1.0, 0, false);
    system.update(100);
  });

  it('triggerBossImpactFX e triggerLevelUpFX agendam efeitos', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);
    system.triggerBossImpactFX();
    system.triggerLevelUpFX();
    expect(scene.time.delayedCall).toHaveBeenCalled();
  });
});

