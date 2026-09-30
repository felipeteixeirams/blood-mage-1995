import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReflectionSystem } from './ReflectionSystem';

function makeMockScene() {
  const add = {
    sprite: vi.fn(() => ({
      setDepth: vi.fn().mockReturnThis(),
      setFlipY: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      setFrame: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      frame: { name: 'default' },
    })),
  };

  const scene = {
    add,
  };

  return { scene, add };
}

describe('ReflectionSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra entidade e cria sprite de reflexo invertido', () => {
    const { scene, add } = makeMockScene();
    const system = new ReflectionSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 100,
      texture: { key: 'spr_bloodmage' },
      frame: { name: 'bloodmage_idle_0' },
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);
    expect(add.sprite).toHaveBeenCalledWith(100, 100, 'spr_bloodmage');
  });

  it('ativa reflexo com ondulação quando entidade está sobre poça de sangue', () => {
    const { scene, add } = makeMockScene();
    const system = new ReflectionSystem(scene as any);

    const mockEntity = {
      x: 100,
      y: 100,
      texture: { key: 'spr_bloodmage' },
      frame: { name: 'bloodmage_idle_0' },
      scaleX: 1,
      scaleY: 1,
      height: 32,
      active: true,
      visible: true,
      once: vi.fn(),
    } as any;

    system.registerEntity(mockEntity);

    // Configura poça de sangue na mesma coordenada (x: 100, y: 110, radius: 30)
    system.setLiquidZones([{ x: 100, y: 110, radius: 30, type: 'blood' }]);
    system.update(1000);

    const createdSprite = add.sprite.mock.results[0].value;
    expect(createdSprite.setVisible).toHaveBeenCalledWith(true);
    expect(createdSprite.setTint).toHaveBeenCalledWith(0x7f1d1d);
  });
});
