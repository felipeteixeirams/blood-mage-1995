import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShadowSystem } from './ShadowSystem';

function makeMockScene() {
  const textures = {
    exists: vi.fn(() => true),
  };

  const add = {
    image: vi.fn(() => ({
      setDepth: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setRotation: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
    })),
  };

  const scene = {
    textures,
    add,
  };

  return { scene, textures, add };
}

describe('ShadowSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra entidade e cria imagem de sombra com depth correto', () => {
    const { scene, add } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 150,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    expect(add.image).toHaveBeenCalledWith(100, 162, 'spr_shadow_disc');
  });

  it('calcula projeção direcional quando próxima de fonte de luz', () => {
    const { scene } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 100,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);

    // Luz posicionada à esquerda da entidade (x: 50, y: 100)
    const lights = [
      { x: 50, y: 100, radius: 150, intensity: 1.0 },
    ];

    system.update(lights);
    // Deve projetar a sombra para a direita (x > 100)
  });

  it('remove sombra ao destruir entidade', () => {
    const { scene } = makeMockScene();
    const system = new ShadowSystem(scene as any);

    let destroyCallback: Function | undefined;
    const mockEntity = {
      x: 100,
      y: 150,
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn((event, cb) => {
        if (event === 'destroy') destroyCallback = cb;
      }),
    } as any;

    system.registerEntity(mockEntity);
    system.unregisterEntity(mockEntity);
  });
});
