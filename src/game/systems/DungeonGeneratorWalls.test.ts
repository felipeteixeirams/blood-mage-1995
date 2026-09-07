import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { DungeonGenerator } from './DungeonGenerator';

vi.mock('phaser', () => {
  const mockImage = {
    setTint: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
  };

  const mockStaticSprite = {
    setTint: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    refreshBody: vi.fn().mockReturnThis(),
    active: true,
    x: 100,
    y: 100,
  };

  class MockStaticGroup {
    create() {
      return { ...mockStaticSprite };
    }
    getChildren() {
      return [];
    }
  }

  class MockScene {
    add = {
      image: vi.fn().mockReturnValue({ ...mockImage }),
      star: vi.fn().mockReturnValue({ ...mockImage }),
      circle: vi.fn().mockReturnValue({ setStrokeStyle: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
      existing: vi.fn().mockImplementation((obj: any) => obj),
    };
    textures = {
      exists: vi.fn().mockImplementation((key: string) => {
        if (key.startsWith('tile_wall_brick')) return true;
        if (key === 'tile_wood_wall') return true;
        return false;
      }),
    };
    physics = {
      add: {
        staticGroup: vi.fn().mockReturnValue(new MockStaticGroup()),
        existing: vi.fn().mockImplementation((obj: any) => obj),
      },
    };
    spikeTrapsGroup = { add: vi.fn() };
    barrelsGroup = { add: vi.fn() };
  }

  return {
    default: {
      Scene: MockScene,
      Physics: {
        Arcade: {
          StaticGroup: MockStaticGroup,
          Sprite: class MockSprite {
            setDepth() { return this; }
            setAlpha() { return this; }
            setTint() { return this; }
            setSize() { return this; }
            refreshBody() { return this; }
            setVisible() { return this; }
          },
        },
      },
      Geom: {
        Line: class { setTo() {} },
        Rectangle: class { setTo() {} },
        Intersects: { LineToRectangle: vi.fn().mockReturnValue(false) },
      },
    },
  };
});

describe('DungeonGenerator - Wall Autotiling Bitmasks', () => {
  let generator: DungeonGenerator;
  let mockScene: any;
  let mockWallsGroup: any;
  let mockChestsGroup: any;

  beforeEach(() => {
    mockScene = new (Phaser.Scene as any)();
    mockWallsGroup = new (Phaser.Physics.Arcade.StaticGroup as any)();
    mockChestsGroup = new (Phaser.Physics.Arcade.StaticGroup as any)();
    generator = new DungeonGenerator(mockScene, mockWallsGroup, mockChestsGroup);
  });

  it('calculates 4-cardinal wall neighbor bitmask correctly', () => {
    const wallGrid = new Set<string>(['1,0', '2,1', '1,2', '0,1']);
    const mask = generator.calculateWallBitmask(1, 1, wallGrid);
    expect(mask).toBe(15); // N (1) + E (2) + S (4) + W (8) = 15
  });

  it('selects outer corners when diagonal wall is absent', () => {
    const wallGrid = new Set<string>(['1,0', '2,1']); // N + E (mask 3), no 2,0
    const key = generator.getWallTextureKey(1, 1, wallGrid, 'tile_wall_brick');
    expect(key).toBe('tile_wall_brick_corner_outer_ne');
  });

  it('selects inner corners when diagonal wall is present', () => {
    const wallGrid = new Set<string>(['1,0', '2,1', '2,0']); // N + E (mask 3) + NE diagonal (2,0)
    const key = generator.getWallTextureKey(1, 1, wallGrid, 'tile_wall_brick');
    expect(key).toBe('tile_wall_brick_corner_inner_ne');
  });

  it('selects T-junction key when 3 or 4 cardinal neighbors exist', () => {
    const wallGrid = new Set<string>(['1,0', '2,1', '1,2']); // N + E + S (mask 7)
    const key = generator.getWallTextureKey(1, 1, wallGrid, 'tile_wall_brick');
    expect(key).toBe('tile_wall_brick_t_junction');
  });

  it('selects straight wall variants for 2 opposite neighbors', () => {
    const wallGrid = new Set<string>(['1,0', '1,2']); // N + S (mask 5)
    const key = generator.getWallTextureKey(1, 1, wallGrid, 'tile_wall_brick');
    expect(key).toMatch(/^tile_wall_brick_var_\d$/);
  });

  it('preserves tile_wood_wall for Safe House walls without modification', () => {
    const wallGrid = new Set<string>(['1,0', '2,1']);
    const safeHouseKey = generator.getWallTextureKey(1, 1, wallGrid, 'tile_wood_wall');
    expect(safeHouseKey).toBe('tile_wood_wall');
  });

  it('selects endcap key when 0 or 1 neighbor exists', () => {
    const wallGrid = new Set<string>(['1,0']); // N only (mask 1)
    const endcapKey = generator.getWallTextureKey(1, 1, wallGrid, 'tile_wall_brick');
    expect(endcapKey).toBe('tile_wall_brick_endcap');
  });

  it('autotiles intersecting lines correctly during full dungeon generation', () => {
    const createdKeys: string[] = [];
    vi.spyOn(mockWallsGroup, 'create').mockImplementation((_x: number, _y: number, key: string) => {
      createdKeys.push(key);
      return {
        setTint: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        refreshBody: vi.fn().mockReturnThis(),
      } as any;
    });

    generator.generate(1280, 960, 'fosso_chagas');

    expect(createdKeys.length).toBeGreaterThan(0);
    // Outer corners should be present
    expect(createdKeys.some((k) => k.startsWith('tile_wall_brick_corner_outer_'))).toBe(true);
    // Straight wall variants should be present
    expect(createdKeys.some((k) => /^tile_wall_brick_var_\d$/.test(k))).toBe(true);
  });
});
