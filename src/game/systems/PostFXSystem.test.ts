import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostFXSystem } from './PostFXSystem';
import { useGameStore } from '../../store/gameStore';

function makeRenderer(isWebGL: boolean) {
  return { isWebGL };
}

function makeScene(options: { isWebGL?: boolean; cameraFilters?: any; noCamera?: boolean } = {}) {
  const isWebGL = options.isWebGL ?? true;
  const externalFilters = {
    addVignette: vi.fn(() => ({ strength: 0 })),
    addColorMatrix: vi.fn(() => ({ colorMatrix: { reset: vi.fn(), saturate: vi.fn(), hue: vi.fn(), brightness: vi.fn(), set: vi.fn() } })),
    addDisplacement: vi.fn(() => ({ x: 0, y: 0 })),
  };
  const camera = options.noCamera ? null : {
    filters: options.cameraFilters !== undefined ? options.cameraFilters : {
      internal: {},
      external: externalFilters,
    },
  };
  const scene = {
    game: { renderer: makeRenderer(isWebGL) },
    cameras: { main: camera },
    time: { delayedCall: vi.fn((delay, cb) => { cb?.(); return {}; }) },
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
    expect(camera!.filters.external.addVignette).toHaveBeenCalled();
    expect(camera!.filters.external.addColorMatrix).toHaveBeenCalled();
    expect(camera!.filters.external.addDisplacement).toHaveBeenCalled();
    expect(system.isFilterActive()).toBe(true);
  });

  it('não cria filtros quando o renderer não é WebGL', () => {
    const { scene, camera } = makeScene({ isWebGL: false });
    const system = new PostFXSystem(scene as any);
    expect(camera!.filters.external.addVignette).not.toHaveBeenCalled();
    expect(system.isFilterActive()).toBe(false);
  });

  it('trata graciosamente câmera ou filtros ausentes/parciais', () => {
    // Câmera sem filtros
    const { scene: sceneNoFilters } = makeScene({ cameraFilters: null });
    const system1 = new PostFXSystem(sceneNoFilters as any);
    expect(system1.isFilterActive()).toBe(false);

    // Câmera com exceção durante a criação de filtros
    const throwingFilters = {
      external: {
        addVignette: () => { throw new Error('Filter creation error'); },
      },
    };
    const { scene: sceneThrowing } = makeScene({ cameraFilters: throwingFilters });
    const system2 = new PostFXSystem(sceneThrowing as any);
    expect(system2.isFilterActive()).toBe(false);
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
    expect(system.isFilterActive()).toBe(true);

    // Testar bioma gloom_woods que ativa vinheta
    system.setBiome('gloomy_woods');
    system.update(100);

    // Testar bioma desconhecido (fallback)
    system.setBiome('unknown_biome' as any);
    system.update(100);
  });

  it('trata erros durante colorMatrix.reset() graciosamente em applyBiomeMatrix e blendBiomes', () => {
    const { scene, camera } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    // Injeta erro no colorMatrix
    camera!.filters.external.addColorMatrix().colorMatrix.reset.mockImplementation(() => {
      throw new Error('ColorMatrix GPU error');
    });

    expect(() => system.setBiome('santuario_sangue')).not.toThrow();
    expect(() => system.blendBiomes('safe_house', 'gloomy_woods', 0.5)).not.toThrow();
    expect(() => system.update(100)).not.toThrow();
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

  it('triggerShockwave respeita a configuração postProcessingEnabled', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    useGameStore.setState({
      settings: { ...useGameStore.getState().settings, postProcessingEnabled: false },
    });
    system.triggerShockwave(500, 0.6);

    useGameStore.setState({
      settings: { ...useGameStore.getState().settings, postProcessingEnabled: true },
    });
    system.triggerShockwave(500, 0.6);
    expect(scene.time.delayedCall).toHaveBeenCalled();
  });

  it('triggerFearDistortion respeita a configuração fearDistortionEnabled', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    useGameStore.setState({
      settings: { ...useGameStore.getState().settings, fearDistortionEnabled: false },
    });
    system.triggerFearDistortion(1000);

    useGameStore.setState({
      settings: { ...useGameStore.getState().settings, fearDistortionEnabled: true },
    });
    system.triggerFearDistortion(1000);
    expect(scene.time.delayedCall).toHaveBeenCalled();
  });

  it('setLowHpTension ativa pulsação dinâmica de vinheta e lida com desativação', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    system.setLowHpTension(true, 1000);
    system.update(250);
    expect(system.isFilterActive()).toBe(true);

    system.setLowHpTension(false);
    system.update(250);
  });

  it('setDangerTension ajusta vinheta e pulso por nível de perigo (baixo, médio e alto/boss/lowHp)', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    // Perigo baixo
    system.setDangerTension(1.0, 2, false);
    system.update(100);

    // Perigo médio
    system.setDangerTension(0.8, 5, false);
    system.update(100);
    expect(system.isFilterActive()).toBe(true);

    // Perigo alto
    system.setDangerTension(0.2, 2, false);
    system.update(100);
    expect(system.isFilterActive()).toBe(true);

    // Retorno ao perigo baixo
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

  it('blendBiomes interpola matriz de cor e vinheta entre dois biomas', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    system.blendBiomes('safe_house', 'gloomy_woods', 0.5, 3);
    system.update(100);
    expect(system.isFilterActive()).toBe(true);

    system.blendBiomes('gloomy_woods', 'catacumbas_martires', 1.2, 5);
    system.update(100);
  });

  it('setTint trata transparente, invalid hex e cores validas e aplica CRT extra', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    useGameStore.setState({
      settings: { ...useGameStore.getState().settings, crtFilter: true },
    });

    system.setTint('#ff0000', 100);
    system.update(100);

    system.setTint('invalid-color', 100);
    system.update(100);

    system.setTint('transparent', 100);
    system.update(100);
  });

  it('effectInfection e effectTension configuram tint e vinheta', () => {
    const { scene } = makeScene({ isWebGL: true });
    const system = new PostFXSystem(scene as any);

    system.effectInfection();
    system.effectTension(0.5);
    system.update(100);
  });
});
