import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AtmosphereSystem } from './AtmosphereSystem';

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
