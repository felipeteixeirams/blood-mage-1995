import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathDrivenGenerator } from './PathDrivenGenerator';

vi.mock('phaser', () => {
  class MockImage {
    setDepth() { return this; }
    setAlpha() { return this; }
    setTint() { return this; }
    setSize() { return this; }
    refreshBody() { return this; }
    setVisible() { return this; }
    x = 0;
    y = 0;
  }

  return {
    default: {
      Scene: class MockScene {},
      Geom: {
        Line: class MockLine {
          setTo() {}
        },
        Rectangle: class MockRectangle {
          setTo() {}
        },
        Intersects: {
          LineToRectangle() { return false; },
        },
      },
    },
  };
});

describe('PathDrivenGenerator (Spec 18 Continuous World Topology)', () => {
  let mockScene: any;
  let pathGenerator: PathDrivenGenerator;

  beforeEach(() => {
    const createMockObj = () => ({
      setDepth() { return this; },
      setAlpha() { return this; },
      setTint() { return this; },
      setSize() { return this; },
      refreshBody() { return this; },
      setVisible() { return this; },
      x: 100,
      y: 100,
    });

    mockScene = {
      sys: { settings: { key: 'GameScene' } },
      textures: {
        exists: vi.fn().mockReturnValue(true),
        createCanvas: vi.fn().mockReturnValue({
          context: {
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            ellipse: vi.fn(),
            fill: vi.fn(),
            createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
            createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
          },
          refresh: vi.fn(),
        }),
      },
      add: {
        image: vi.fn().mockImplementation(createMockObj),
      },
      wallsGroup: {
        create: vi.fn().mockImplementation(createMockObj),
      },
      chestsGroup: {
        create: vi.fn().mockImplementation(createMockObj),
      },
      lightingSystem: {
        applyLightPipeline: vi.fn(),
      },
      dungeonGenerator: {
        getChestTextureKey: vi.fn().mockReturnValue('spr_chest_south'),
      },
    };

    pathGenerator = new PathDrivenGenerator(mockScene);
  });

  it('generates path-driven continuous topology with rooms, zones, and water tiles', () => {
    const result = pathGenerator.generate(1920, 1440);

    expect(result.rooms.length).toBeGreaterThan(0);
    expect(result.zones.length).toBeGreaterThan(0);
    expect(result.rooms[0].type).toBe('spawn');
    expect(result.rooms[result.rooms.length - 1].type).toBe('boss');
  });

  it('correctly detects water tiles for movement friction', () => {
    pathGenerator.generate(1920, 1440);

    if (pathGenerator.waterTiles.size > 0) {
      const waterKey = Array.from(pathGenerator.waterTiles)[0];
      const [gx, gy] = waterKey.split(',').map(Number);

      const tileX = 1600 + (gx - gy) * 32;
      const tileY = 400 + (gx + gy) * 16;

      expect(pathGenerator.isWaterTileAt(tileX, tileY)).toBe(true);
    }
  });

  it('injects cabin, lake, and cave entrance setpieces into zones', () => {
    const zones: any[] = [];
    pathGenerator.injectCabin(10, 10, zones);
    pathGenerator.injectLake(15, 15, 3, zones);
    pathGenerator.injectCaveEntrance(20, 20, zones);

    expect(zones.some((z) => z.type === 'ruins')).toBe(true);
    expect(zones.some((z) => z.type === 'lake')).toBe(true);
    expect(zones.some((z) => z.type === 'cave_entrance')).toBe(true);
  });
});
