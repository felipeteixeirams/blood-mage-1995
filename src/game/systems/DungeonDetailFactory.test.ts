import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DungeonDetailFactory } from './DungeonDetailFactory';
import type { RoomData } from './DungeonGenerator';

function makeMockScene() {
  const imagesCreated: any[] = [];
  const depthGroupAdded: any[] = [];

  const texturesMap = new Set<string>();

  const chainable = () => {
    const obj: any = {};
    obj.setOrigin = vi.fn(() => obj);
    obj.setScale = vi.fn(() => obj);
    obj.setDepth = vi.fn(() => obj);
    return obj;
  };

  const scene: any = {
    add: {
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillEllipse: vi.fn(),
        fillCircle: vi.fn(),
        fillRect: vi.fn(),
        fillTriangle: vi.fn(),
        lineStyle: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn(),
        strokeCircle: vi.fn(),
        destroy: vi.fn(),
      })),
      image: vi.fn((x: number, y: number, key: string) => {
        const img = { x, y, texture: { key }, ...chainable() };
        imagesCreated.push(img);
        return img;
      }),
    },
    textures: {
      exists: vi.fn((key: string) => texturesMap.has(key)),
      remove: vi.fn((key: string) => texturesMap.delete(key)),
      createCanvas: vi.fn((key: string) => {
        texturesMap.add(key);
        return {};
      }),
    },
    depthGroup: {
      add: vi.fn((obj: any) => depthGroupAdded.push(obj)),
    },
    lightingSystem: {
      applyLightPipeline: vi.fn(),
    },
  };

  return { scene, texturesMap, imagesCreated, depthGroupAdded };
}

const sampleRoom: RoomData = {
  x: 100,
  y: 100,
  width: 400,
  height: 300,
  centerX: 300,
  centerY: 250,
  type: 'chamber',
};

describe('DungeonDetailFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bakes all biome detail textures into Phaser texture manager', () => {
    const { scene, texturesMap } = makeMockScene();
    const factory = new DungeonDetailFactory(scene);

    factory.bakeDetailTextures();

    expect(texturesMap.has('dungeon_detail_toxic_slime')).toBe(true);
    expect(texturesMap.has('dungeon_detail_bone_pile')).toBe(true);
    expect(texturesMap.has('dungeon_detail_blood_pool_small')).toBe(true);
  });

  it('scatters props inside room boundaries and adds them to depthGroup with base origin (0.5, 1.0)', () => {
    const { scene, imagesCreated, depthGroupAdded } = makeMockScene();
    const factory = new DungeonDetailFactory(scene);

    factory.bakeDetailTextures();

    const props = factory.scatterDetails(sampleRoom, 'fosso_chagas', { seed: 1234 });
    expect(props.length).toBeGreaterThan(0);

    props.forEach((prop) => {
      expect(prop.x).toBeGreaterThanOrEqual(sampleRoom.x);
      expect(prop.x).toBeLessThanOrEqual(sampleRoom.x + sampleRoom.width);
      expect(prop.y).toBeGreaterThanOrEqual(sampleRoom.y);
      expect(prop.y).toBeLessThanOrEqual(sampleRoom.y + sampleRoom.height);

      expect(prop.setOrigin).toHaveBeenCalledWith(0.5, 1.0);
      expect(prop.setDepth).toHaveBeenCalledWith(prop.y);
    });

    expect(depthGroupAdded.length).toBe(props.length);
    expect(scene.lightingSystem.applyLightPipeline).toHaveBeenCalled();
  });
});
