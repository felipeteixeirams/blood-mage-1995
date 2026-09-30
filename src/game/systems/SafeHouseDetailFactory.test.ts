import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafeHouseDetailFactory } from './SafeHouseDetailFactory';
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
        closePath: vi.fn(),
        fill: vi.fn(),
        strokeCircle: vi.fn(),
        strokeRect: vi.fn(),
        strokeEllipse: vi.fn(),
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
  type: 'spawn',
};

describe('SafeHouseDetailFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bakes all safe house ambient detail textures into Phaser texture manager', () => {
    const { scene, texturesMap } = makeMockScene();
    const factory = new SafeHouseDetailFactory(scene);

    factory.bakeDetailTextures();

    expect(texturesMap.has('safehouse_detail_rug')).toBe(true);
    expect(texturesMap.has('safehouse_detail_bookshelf')).toBe(true);
    expect(texturesMap.has('safehouse_detail_candle')).toBe(true);
    expect(texturesMap.has('safehouse_detail_herbs')).toBe(true);
    expect(texturesMap.has('safehouse_detail_barrel_crates')).toBe(true);
    expect(texturesMap.has('safehouse_detail_wall_banner')).toBe(true);
  });

  it('scatters safe house props inside room boundaries with base origin (0.5, 1.0) and adds to depthGroup', () => {
    const { scene, depthGroupAdded } = makeMockScene();
    const factory = new SafeHouseDetailFactory(scene);

    factory.bakeDetailTextures();

    const props = factory.scatterDetails(sampleRoom, { seed: 1234 });
    expect(props.length).toBeGreaterThanOrEqual(6);

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

  it('generates props deterministically for a given seed', () => {
    const { scene: scene1 } = makeMockScene();
    const { scene: scene2 } = makeMockScene();

    const factory1 = new SafeHouseDetailFactory(scene1);
    const factory2 = new SafeHouseDetailFactory(scene2);

    factory1.bakeDetailTextures();
    factory2.bakeDetailTextures();

    const props1 = factory1.scatterDetails(sampleRoom, { seed: 999 });
    const props2 = factory2.scatterDetails(sampleRoom, { seed: 999 });

    expect(props1.length).toBe(props2.length);
    for (let i = 0; i < props1.length; i++) {
      expect(props1[i].x).toBe(props2[i].x);
      expect(props1[i].y).toBe(props2[i].y);
      expect(props1[i].texture.key).toBe(props2[i].texture.key);
    }
  });
});
