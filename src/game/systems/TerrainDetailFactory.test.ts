import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerrainDetailFactory } from './TerrainDetailFactory';

vi.mock('phaser', () => ({ default: {} }));

function makeChainable(extra: Record<string, unknown> = {}) {
  const obj: any = { ...extra };
  ['setOrigin', 'setScale', 'setDepth', 'setAlpha', 'setVisible', 'setSize', 'refreshBody'].forEach(m => { obj[m] = vi.fn(() => obj); });
  return obj;
}

function makeMockScene() {
  const textureKeys = new Set<string>();
  const imagesCreated: any[] = [];
  const wallsCreated: any[] = [];
  const depthGroupChildren: any[] = [];
  const depthGroup = { add: vi.fn((obj: any) => depthGroupChildren.push(obj)) };

  const textures = {
    exists: vi.fn((key: string) => textureKeys.has(key)),
    remove: vi.fn((key: string) => textureKeys.delete(key)),
    createCanvas: vi.fn((key: string) => {
      textureKeys.add(key);
      return { context: {}, refresh: vi.fn() };
    }),
    addDynamicTexture: vi.fn((key: string) => {
      textureKeys.add(key);
      return { draw: vi.fn(), render: vi.fn() };
    }),
  };

  const wallsGroup = {
    create: vi.fn((x: number, y: number, key?: string) => {
      const wall = makeChainable({ x, y, textureKey: key });
      wallsCreated.push(wall);
      return wall;
    }),
  };

  const add = {
    image: vi.fn((x: number, y: number, key: string) => {
      const img = makeChainable({ x, y, textureKey: key });
      imagesCreated.push(img);
      return img;
    }),
    graphics: vi.fn(() => {
      const g: any = {};
      ['fillStyle', 'fillEllipse', 'fillTriangle', 'fillRect', 'fillPath', 'lineStyle', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'strokePath'].forEach(m => { g[m] = vi.fn(() => g); });
      g.destroy = vi.fn();
      return g;
    }),
  };

  const scene: any = {
    sys: { settings: { key: 'GameScene' } },
    textures,
    add,
    depthGroup,
    wallsGroup,
    lightingSystem: { applyLightPipeline: vi.fn() },
  };

  return { scene, textureKeys, imagesCreated, wallsCreated, depthGroupChildren };
}

describe('TerrainDetailFactory', () => {
  let mock: ReturnType<typeof makeMockScene>;

  beforeEach(() => {
    mock = makeMockScene();
  });

  it('assa 5 variantes de textura de tufo via DynamicTexture (baking pattern)', () => {
    const factory = new TerrainDetailFactory(mock.scene);
    factory.bakeTuftTextures();

    ['terrain_grass_tuft_0', 'terrain_grass_tuft_1', 'terrain_grass_tuft_2', 'terrain_grass_tuft_3', 'terrain_grass_tuft_4']
      .forEach(key => expect(mock.textureKeys.has(key)).toBe(true));
    expect(mock.scene.textures.addDynamicTexture).toHaveBeenCalledTimes(5);
  });

  it('assa todas as variantes de flora (tufos, arbustos, cogumelos, rochas e troncos caídos)', () => {
    const factory = new TerrainDetailFactory(mock.scene);
    factory.bakeAllFloraTextures();

    const expectedKeys = [
      'terrain_grass_tuft_0', 'terrain_grass_tuft_4',
      'terrain_bush_0', 'terrain_bush_2',
      'terrain_mushroom_0', 'terrain_mushroom_2',
      'terrain_rock_0', 'terrain_rock_2',
      'terrain_log_0', 'terrain_log_1',
    ];
    expectedKeys.forEach(key => expect(mock.textureKeys.has(key)).toBe(true));
  });

  it('espalha a quantidade pedida de tufos e flora rica, todos no depthGroup', () => {
    const factory = new TerrainDetailFactory(mock.scene);
    factory.bakeAllFloraTextures();

    const tufts = factory.scatterRichFlora({ count: 30, areaWidth: 800, areaHeight: 600 });

    expect(tufts).toHaveLength(30);
    expect(mock.depthGroupChildren.length).toBe(30);
    tufts.forEach(tuft => {
      expect(tuft.setOrigin).toHaveBeenCalledWith(0.5, 1);
      expect(tuft.setDepth).toHaveBeenCalled();
    });
  });

  it('registra corpos físicos estáticos invisíveis no wallsGroup para rochas e troncos caídos', () => {
    const factory = new TerrainDetailFactory(mock.scene);
    factory.scatterRichFlora({ count: 100, areaWidth: 800, areaHeight: 600, seed: 1234 });

    expect(mock.wallsCreated.length).toBeGreaterThan(0);
    mock.wallsCreated.forEach(wall => {
      expect(wall.setVisible).toHaveBeenCalledWith(false);
      expect(wall.setSize).toHaveBeenCalled();
      expect(wall.refreshBody).toHaveBeenCalled();
    });
  });

  it('é determinístico: o mesmo seed reproduz o mesmo layout (posições e variantes)', () => {
    const factory1 = new TerrainDetailFactory(mock.scene);
    const tuftsA = factory1.scatterRichFlora({ count: 10, areaWidth: 400, areaHeight: 300, seed: 42 });

    const mock2 = makeMockScene();
    const factory2 = new TerrainDetailFactory(mock2.scene);
    const tuftsB = factory2.scatterRichFlora({ count: 10, areaWidth: 400, areaHeight: 300, seed: 42 });

    expect(tuftsA.map(t => (t as any).x)).toEqual(tuftsB.map(t => (t as any).x));
    expect(tuftsA.map(t => (t as any).y)).toEqual(tuftsB.map(t => (t as any).y));
    expect(tuftsA.map(t => (t as any).textureKey)).toEqual(tuftsB.map(t => (t as any).textureKey));
  });

  it('propaga erro se depthGroup não estiver disponível (fail-fast)', () => {
    mock.scene.depthGroup = undefined;
    const factory = new TerrainDetailFactory(mock.scene);
    expect(() => factory.scatterRichFlora({ areaWidth: 100, areaHeight: 100 })).toThrow();
  });

  it('aplica balanço de vento (tween de rotação yoyo, loop infinito) quando scene.tweens existe', () => {
    mock.scene.tweens = { add: vi.fn() };
    const factory = new TerrainDetailFactory(mock.scene);
    factory.scatterRichFlora({ count: 5, areaWidth: 400, areaHeight: 300 });

    expect(mock.scene.tweens.add).toHaveBeenCalled();
    const call = mock.scene.tweens.add.mock.calls[0][0];
    expect(call.yoyo).toBe(true);
    expect(call.repeat).toBe(-1);
    expect(call.rotation.from).toBeLessThan(0);
    expect(call.rotation.to).toBeGreaterThan(0);
  });

  it('NÃO lança e não exige scene.tweens (no-op headless): scatterRichFlora funciona sem balanço de vento', () => {
    expect(mock.scene.tweens).toBeUndefined();
    const factory = new TerrainDetailFactory(mock.scene);
    expect(() => factory.scatterRichFlora({ count: 5, areaWidth: 400, areaHeight: 300 })).not.toThrow();
  });
});
