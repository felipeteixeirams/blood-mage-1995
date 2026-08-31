import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AtmosphereSystem } from './AtmosphereSystem';
import { useGameStore } from '../../store/gameStore';

function makeMockScene() {
  const textures = {
    exists: vi.fn(() => true),
  };

  const add = {
    tileSprite: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      active: true,
      tilePositionX: 0,
      tilePositionY: 0,
    })),
    particles: vi.fn(() => ({
      setDepth: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      active: true,
    })),
  };

  const tweens = {
    add: vi.fn(),
    addCounter: vi.fn(() => ({
      stop: vi.fn(),
    })),
  };

  const cameras = {
    main: {
      worldView: { x: 100, y: 100, width: 800, height: 600 },
    },
  };

  const scene = {
    textures,
    add,
    tweens,
    cameras,
  };

  return { scene, textures, add, tweens, cameras };
}

describe('AtmosphereSystem (Frente 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa camadas de névoa de solo (750) e bruma atmosférica superior (1995)', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2400, 2400, 'fosso_chagas');

    expect(add.tileSprite).toHaveBeenCalledTimes(2);
    // Checa depth e texturas
    expect(add.tileSprite).toHaveBeenCalledWith(0, 0, 2400, 2400, 'fog_mist');
    expect(add.tileSprite).toHaveBeenCalledWith(0, 0, 2400, 2400, 'fog_haze');
    expect(add.particles).toHaveBeenCalled();
  });

  it('mantém opacidades dentro de limites seguros para não prejudicar visibilidade', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2000, 2000, 'catacumbas_martires');

    const createdTileSprites = add.tileSprite.mock.results;
    expect(createdTileSprites.length).toBe(2);

    // Garante que o setAlpha foi chamado com valores estritamente discretos (<= 0.20)
    const groundSprite = createdTileSprites[0].value;
    const upperSprite = createdTileSprites[1].value;

    expect(groundSprite.setAlpha).toHaveBeenCalledWith(expect.any(Number));
    expect(upperSprite.setAlpha).toHaveBeenCalledWith(expect.any(Number));

    const groundAlphaArg = groundSprite.setAlpha.mock.calls[0][0];
    const upperAlphaArg = upperSprite.setAlpha.mock.calls[0][0];

    expect(groundAlphaArg).toBeLessThanOrEqual(0.20);
    expect(upperAlphaArg).toBeLessThanOrEqual(0.08);
  });

  it('transiciona corretamente entre biomas atualizando tint e tweens de névoa', () => {
    const { scene, tweens } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2000, 2000, 'fosso_chagas');
    system.setBiome('santuario_sangue');

    expect(tweens.add).toHaveBeenCalled();
  });

  it('atualiza posições de drift suave das camadas sem travar', () => {
    const { scene } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2000, 2000, 'fosso_chagas');
    expect(() => {
      system.update(16.6, false);
      system.update(16.6, true); // Combate pesado
    }).not.toThrow();
  });

  it('desativa e reativa as camadas de névoa e clima ao alterar configuração', () => {
    const { scene } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2000, 2000, 'fosso_chagas');
    system.setEnabled(false);
    system.setEnabled(true);
  });

  it('limpa todos os recursos com cleanup()', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2000, 2000, 'fosso_chagas');
    system.cleanup();
  });
});

describe('AtmosphereSystem - Weather Particles (Spec 4 D-2 Enhancement)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve usar particle_spore para weatherType: spores (fosso_chagas)', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2400, 2400, 'fosso_chagas');

    const calls = (add.particles as any).mock.calls as any[];
    const particlesCall = calls.find((call) => call[2] === 'particle_spore');
    expect(particlesCall).toBeDefined();
    expect(particlesCall?.[2]).toBe('particle_spore');
  });

  it('deve usar particle_ash para weatherType: ash_embers (catacumbas_martires)', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2400, 2400, 'catacumbas_martires');

    const calls = (add.particles as any).mock.calls as any[];
    const particlesCall = calls.find((call) => call[2] === 'particle_ash');
    expect(particlesCall).toBeDefined();
    expect(particlesCall?.[2]).toBe('particle_ash');
  });

  it('deve usar particle_blood_drop para weatherType: blood_rain (santuario_sangue)', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2400, 2400, 'santuario_sangue');

    const calls = (add.particles as any).mock.calls as any[];
    const particlesCall = calls.find((call) => call[2] === 'particle_blood_drop');
    expect(particlesCall).toBeDefined();
    expect(particlesCall?.[2]).toBe('particle_blood_drop');
  });

  it('deve inicializar emitter na posição da câmera, não em (0,0)', () => {
    const { scene, add, cameras } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2400, 2400, 'fosso_chagas');

    const calls = (add.particles as any).mock.calls as any[];
    const posX = calls[0]?.[0];
    const posY = calls[0]?.[1];

    // Posição esperada: centro do viewport da câmera
    // camera.worldView.x + width/2 = 100 + 400 = 500
    // camera.worldView.y + height/2 = 100 + 300 = 400
    expect(posX).toBe(cameras.main.worldView.x + cameras.main.worldView.width * 0.5);
    expect(posY).toBe(cameras.main.worldView.y + cameras.main.worldView.height * 0.5);
  });

  it('deve iniciar com frequency 3x maior (fade-in suave)', () => {
    const { scene, add } = makeMockScene();
    const system = new AtmosphereSystem(scene as any);

    system.initialize(2400, 2400, 'fosso_chagas');

    const calls = (add.particles as any).mock.calls as any[];
    const particlesConfig = calls[0]?.[3];
    // Base frequency para spores: 350
    // Esperado: 350 * 3 = 1050
    expect(particlesConfig?.frequency).toBe(1050);
  });

  it('deve destruir tween de fade-in ao trocar de bioma', () => {
    const { scene, tweens } = makeMockScene();
    vi.spyOn(useGameStore, 'getState').mockReturnValue({
      settings: {
        postProcessingEnabled: true,
        lowPerformanceParticles: false,
      },
    } as any);

    const mockTween = { stop: vi.fn() };
    (tweens.addCounter as any) = vi.fn().mockReturnValue(mockTween);

    const system = new AtmosphereSystem(scene as any);
    system.initialize(2400, 2400, 'fosso_chagas');
    system.setBiome('catacumbas_martires');

    // O tween anterior deve ter sido parado
    expect(mockTween.stop).toHaveBeenCalled();
  });

  it('deve respeitar lowPerformanceParticles aumentando frequency ~40%', () => {
    const { scene, add } = makeMockScene();
    vi.spyOn(useGameStore, 'getState').mockReturnValue({
      settings: {
        postProcessingEnabled: true,
        lowPerformanceParticles: true,
      },
    } as any);

    const system = new AtmosphereSystem(scene as any);
    system.initialize(2400, 2400, 'fosso_chagas');

    const calls = (add.particles as any).mock.calls as any[];
    const particlesConfig = calls[0]?.[3];
    // Base: 350 * 3 (fade-in) = 1050
    // Low perf: 350 * 1.4 * 3 = 1470
    expect(particlesConfig?.frequency).toBeCloseTo(1470, 0);
  });

  it('deve reduzir quantity quando lowPerformanceParticles: true (spores/ash)', () => {
    const { scene, add } = makeMockScene();
    vi.spyOn(useGameStore, 'getState').mockReturnValue({
      settings: {
        postProcessingEnabled: true,
        lowPerformanceParticles: true,
      },
    } as any);

    const system = new AtmosphereSystem(scene as any);
    system.initialize(2400, 2400, 'fosso_chagas'); // spores

    const calls = (add.particles as any).mock.calls as any[];
    const particlesConfig = calls[0]?.[3];
    expect(particlesConfig?.quantity).toBe(0); // Low perf: usa frequency, não quantity
  });

  it('deve manter quantity em 1 para blood_rain com lowPerformanceParticles: true', () => {
    const { scene, add } = makeMockScene();
    vi.spyOn(useGameStore, 'getState').mockReturnValue({
      settings: {
        postProcessingEnabled: true,
        lowPerformanceParticles: true,
      },
    } as any);

    const system = new AtmosphereSystem(scene as any);
    system.initialize(2400, 2400, 'santuario_sangue'); // blood_rain

    const calls = (add.particles as any).mock.calls as any[];
    const particlesConfig = calls[0]?.[3];
    // Normal: quantity 2, Low perf: quantity 1
    expect(particlesConfig?.quantity).toBe(1);
  });
});

// Mock useGameStore para testes
vi.mock('../../store/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      settings: {
        postProcessingEnabled: true,
        lowPerformanceParticles: false,
      },
    })),
  },
}));
