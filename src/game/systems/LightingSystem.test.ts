import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LightingSystem } from './LightingSystem';

interface MockGameObject {
  texture?: { key: string };
  setPipeline?: ReturnType<typeof vi.fn>;
}

interface MockLight {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
}

interface MockScene {
  game: {
    renderer: {
      isWebGL: boolean;
    };
  };
  player?: {
    x: number;
    y: number;
  };
  lights: {
    active: boolean;
    enable: ReturnType<typeof vi.fn>;
    setAmbientColor: ReturnType<typeof vi.fn>;
    addLight: ReturnType<typeof vi.fn>;
    removeLight: ReturnType<typeof vi.fn>;
    shutdown: ReturnType<typeof vi.fn>;
  };
  textures: {
    get: ReturnType<typeof vi.fn>;
  };
}

describe('LightingSystem', () => {
  let mockScene: MockScene;

  beforeEach(() => {
    mockScene = {
      game: {
        renderer: {
          isWebGL: true,
        },
      },
      player: {
        x: 100,
        y: 200,
      },
      lights: {
        active: false,
        enable: vi.fn(function (this: { active: boolean }) {
          this.active = true;
        }),
        setAmbientColor: vi.fn(),
        addLight: vi.fn((x: number, y: number, radius: number, color: number, intensity: number): MockLight => ({
          x,
          y,
          radius,
          color,
          intensity,
        })),
        removeLight: vi.fn(),
        shutdown: vi.fn(),
      },
      textures: {
        get: vi.fn(),
      },
    };
  });

  it('disables itself when renderer is not WebGL', () => {
    mockScene.game.renderer.isWebGL = false;
    const system = new LightingSystem(mockScene as unknown as Phaser.Scene);

    expect(system.isActive()).toBe(false);

    system.enable('fosso_chagas', 1);
    expect(mockScene.lights.enable).not.toHaveBeenCalled();
  });

  it('enables ambient light color and calculates light cascade by floor depth', () => {
    const system = new LightingSystem(mockScene as unknown as Phaser.Scene);
    expect(system.isActive()).toBe(true);

    system.enable('fosso_chagas', 1);
    expect(mockScene.lights.enable).toHaveBeenCalled();
    expect(mockScene.lights.setAmbientColor).toHaveBeenCalledWith(0x101b38); // floor 1

    system.enable('santuario_sangue', 9); // deep floor depth (depthProgress = 1.0)
    expect(mockScene.lights.setAmbientColor).toHaveBeenCalledWith(0x4a050d);
  });

  it('applies Light2D pipeline only when texture contains normal maps', () => {
    const system = new LightingSystem(mockScene as unknown as Phaser.Scene);
    const gameObjectWithNormal: MockGameObject = {
      texture: { key: 'wall_with_normal' },
      setPipeline: vi.fn(),
    };
    const gameObjectWithoutNormal: MockGameObject = {
      texture: { key: 'wall_plain' },
      setPipeline: vi.fn(),
    };

    mockScene.textures.get.mockImplementation((key: string) => {
      if (key === 'wall_with_normal') {
        return { dataSource: [{}, {}] };
      }
      return { dataSource: [{}] };
    });

    system.applyLightPipeline(gameObjectWithNormal as unknown as Phaser.GameObjects.GameObject);
    expect(gameObjectWithNormal.setPipeline).toHaveBeenCalledWith('Light2D');

    system.applyLightPipeline(gameObjectWithoutNormal as unknown as Phaser.GameObjects.GameObject);
    expect(gameObjectWithoutNormal.setPipeline).not.toHaveBeenCalled();
  });

  it('creates and updates player light based on position and HP ratio', () => {
    const system = new LightingSystem(mockScene as unknown as Phaser.Scene);
    system.enable('fosso_chagas', 1);
    system.createPlayerLight();

    expect(mockScene.lights.addLight).toHaveBeenCalledWith(100, 200, 180, 0xff5522, 1.0);

    // Full HP => radius = 180 * 1.0 = 180
    system.updatePlayerLight(1.0);

    // Low HP (0%) => radius = 180 * 0.6 = 108
    mockScene.player = { x: 150, y: 250 };
    system.updatePlayerLight(0.0);
  });

  it('adds and clears torch lights', () => {
    const system = new LightingSystem(mockScene as unknown as Phaser.Scene);
    system.enable('catacumbas_martires', 1);

    system.addTorchLights([
      { x: 50, y: 50, kind: 'torch' },
      { x: 150, y: 150, kind: 'brazier' },
    ]);

    expect(mockScene.lights.addLight).toHaveBeenCalledTimes(2);

    system.clearTorchLights();
    expect(mockScene.lights.removeLight).toHaveBeenCalledTimes(2);
  });

  it('shuts down cleanly', () => {
    const system = new LightingSystem(mockScene as unknown as Phaser.Scene);
    system.shutdown();

    expect(mockScene.lights.shutdown).toHaveBeenCalled();
  });
});
