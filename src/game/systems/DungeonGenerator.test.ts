import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser before importing DungeonGenerator to prevent canvas environment check failures in jsdom
vi.mock('phaser', () => {
  class MockLine {
    setTo() {}
  }
  class MockRectangle {
    setTo() {}
  }
  class MockScene {}
  class MockStaticGroup {}

  return {
    default: {
      Scene: MockScene,
      Physics: {
        Arcade: {
          StaticGroup: MockStaticGroup,
        },
      },
      Geom: {
        Line: MockLine,
        Rectangle: MockRectangle,
        Intersects: {
          LineToRectangle: vi.fn().mockReturnValue(false),
        },
      },
    },
  };
});

import { DungeonGenerator, RoomData } from './DungeonGenerator';

interface MockGameObject {
  x: number;
  y: number;
  key: string;
  tint?: number;
  depth?: number;
  size?: { w: number; h: number };
  active?: boolean;
  setTint?: (t: number) => MockGameObject;
  setSize?: (w: number, h: number) => MockGameObject;
  setDepth?: (d: number) => MockGameObject;
  refreshBody?: () => void;
}

interface MockScene {
  add: {
    image: (x: number, y: number, key: string) => MockGameObject;
    star: (x: number, y: number, points: number, innerRadius: number, outerRadius: number, fillColor: number, fillAlpha: number) => { setDepth: (d: number) => void };
    circle: (x: number, y: number, radius: number) => { setStrokeStyle: (width: number, color: number, alpha: number) => { setDepth: (d: number) => void } };
  };
  textures: {
    exists: (key: string) => boolean;
  };
}

interface MockGroup {
  create: (x: number, y: number, key: string) => MockGameObject;
  getChildren: () => MockGameObject[];
}

describe('DungeonGenerator', () => {
  let mockScene: MockScene;
  let mockWallsGroup: MockGroup;
  let mockChestsGroup: MockGroup;
  let createdWalls: MockGameObject[];
  let createdChests: MockGameObject[];
  let createdImages: MockGameObject[];

  beforeEach(() => {
    createdWalls = [];
    createdChests = [];
    createdImages = [];

    mockScene = {
      add: {
        image: (x: number, y: number, key: string) => {
          const img: MockGameObject = {
            x,
            y,
            key,
            tint: 0,
            depth: 0,
            setTint(t: number) { this.tint = t; return this; },
            setDepth(d: number) { this.depth = d; return this; },
          };
          createdImages.push(img);
          return img;
        },
        star: () => ({ setDepth: vi.fn() }),
        circle: () => ({ setStrokeStyle: () => ({ setDepth: vi.fn() }) }),
      },
      textures: {
        exists: (key: string) => key.startsWith('spr_chest_'),
      },
    };

    mockWallsGroup = {
      create: (x: number, y: number, key: string) => {
        const wall: MockGameObject = {
          x,
          y,
          key,
          active: true,
          tint: 0,
          depth: 0,
          size: { w: 0, h: 0 },
          setTint(t: number) { this.tint = t; return this; },
          setSize(w: number, h: number) { this.size = { w, h }; return this; },
          setDepth(d: number) { this.depth = d; return this; },
          refreshBody: vi.fn(),
        };
        createdWalls.push(wall);
        return wall;
      },
      getChildren: () => createdWalls,
    };

    mockChestsGroup = {
      create: (x: number, y: number, key: string) => {
        const chest: MockGameObject = {
          x,
          y,
          key,
          depth: 0,
          setDepth(d: number) { this.depth = d; return this; },
        };
        createdChests.push(chest);
        return chest;
      },
      getChildren: () => createdChests,
    };
  });

  it('generates a 3x3 room grid layout with correct spawn, secret_treasure and boss rooms', () => {
    const generator = new DungeonGenerator(
      mockScene as unknown as Phaser.Scene,
      mockWallsGroup as unknown as Phaser.Physics.Arcade.StaticGroup,
      mockChestsGroup as unknown as Phaser.Physics.Arcade.StaticGroup
    );
    const rooms: RoomData[] = generator.generate(2000, 1500, 'fosso_chagas');

    expect(rooms.length).toBe(9);
    expect(rooms[0].type).toBe('spawn');
    expect(rooms[2].type).toBe('secret_treasure');
    expect(rooms[8].type).toBe('boss');

    // Secret treasure room should guarantee 2 chests
    expect(createdChests.length).toBeGreaterThanOrEqual(2);
  });

  it('returns valid chest texture keys based on directional facing', () => {
    const generator = new DungeonGenerator(
      mockScene as unknown as Phaser.Scene,
      mockWallsGroup as unknown as Phaser.Physics.Arcade.StaticGroup,
      mockChestsGroup as unknown as Phaser.Physics.Arcade.StaticGroup
    );
    const key = generator.getChestTextureKey('south_east');
    expect(key).toBe('spr_chest_south_east');

    // Non-existing texture fallback check
    mockScene.textures.exists = () => false;
    const fallbackKey = generator.getChestTextureKey('unknown');
    expect(fallbackKey).toBe('spr_chest');
  });

  it('performs line-of-sight checks with AABB pruning phase', () => {
    const generator = new DungeonGenerator(
      mockScene as unknown as Phaser.Scene,
      mockWallsGroup as unknown as Phaser.Physics.Arcade.StaticGroup,
      mockChestsGroup as unknown as Phaser.Physics.Arcade.StaticGroup
    );

    // Add a wall sprite at (100, 100)
    mockWallsGroup.create(100, 100, 'tile_wall_brick');

    // Clear raycast line from (0,0) to (50,50) - wall at 100,100 is pruned by AABB bounds
    const hasSightClear = generator.hasLineOfSight(0, 0, 50, 50);
    expect(hasSightClear).toBe(true);
  });
});
