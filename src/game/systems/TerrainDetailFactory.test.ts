import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerrainDetailFactory } from './TerrainDetailFactory';

// Mesmo motivo do ProceduralForestGenerator.test.ts / DungeonGenerator.test.ts:
// acessar o namespace Phaser em runtime cascateia dependências reais de
// canvas/WebGL que quebram em jsdom. TerrainDetailFactory não toca
// `Phaser.*` em runtime (só usa `import Phaser` para tipos) — mock vazio.
vi.mock('phaser', () => ({ default: {} }));

function makeChainable(extra: Record<string, unknown> = {}) {
  const obj: any = { ...extra };
  ['setOrigin', 'setScale', 'setDepth', 'setAlpha'].forEach(m => { obj[m] = vi.fn(() => obj); });
  return obj;
}

function makeMockScene() {
  const textureKeys = new Set<string>();
  const imagesCreated: any[] = [];
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

  const add = {
    image: vi.fn((x: number, y: number, key: string) => {
      const img = makeChainable({ x, y, textureKey: key });
      imagesCreated.push(img);
      return img;
    }),
    graphics: vi.fn(() => {
      const g: any = {};
      ['fillStyle', 'fillEllipse', 'lineStyle', 'beginPath', 'moveTo', 'lineTo', 'strokePath'].forEach(m => { g[m] = vi.fn(() => g); });
      g.destroy = vi.fn();
      return g;
    }),
  };

  const scene: any = {
    sys: { settings: { key: 'GameScene' } },
    textures,
    add,
    depthGroup,
    lightingSystem: { applyLightPipeline: vi.fn() },
  };

  return { scene, textureKeys, imagesCreated, depthGroupChildren };
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

  it('espalha a quantidade pedida de tufos, todos com origem na base e no depthGroup', () => {
    const factory = new TerrainDetailFactory(mock.scene);
    factory.bakeTuftTextures();

    const tufts = factory.scatterTufts({ count: 30, areaWidth: 800, areaHeight: 600 });

    expect(tufts).toHaveLength(30);
    expect(mock.depthGroupChildren.length).toBe(30);
    tufts.forEach(tuft => {
      expect(tuft.setOrigin).toHaveBeenCalledWith(0.5, 1);
      expect(tuft.setDepth).toHaveBeenCalled();
    });
  });

  it('é determinístico: o mesmo seed reproduz o mesmo layout (posições e variantes)', () => {
    const factory1 = new TerrainDetailFactory(mock.scene);
    factory1.bakeTuftTextures();
    const tuftsA = factory1.scatterTufts({ count: 10, areaWidth: 400, areaHeight: 300, seed: 42 });

    const mock2 = makeMockScene();
    const factory2 = new TerrainDetailFactory(mock2.scene);
    factory2.bakeTuftTextures();
    const tuftsB = factory2.scatterTufts({ count: 10, areaWidth: 400, areaHeight: 300, seed: 42 });

    expect(tuftsA.map(t => (t as any).x)).toEqual(tuftsB.map(t => (t as any).x));
    expect(tuftsA.map(t => (t as any).y)).toEqual(tuftsB.map(t => (t as any).y));
    expect(tuftsA.map(t => (t as any).textureKey)).toEqual(tuftsB.map(t => (t as any).textureKey));
  });

  it('propaga erro se depthGroup não estiver disponível (fail-fast)', () => {
    mock.scene.depthGroup = undefined;
    const factory = new TerrainDetailFactory(mock.scene);
    expect(() => factory.scatterTufts({ areaWidth: 100, areaHeight: 100 })).toThrow();
  });

  it('aplica balanço de vento (tween de rotação yoyo, loop infinito) a cada tufo quando scene.tweens existe', () => {
    mock.scene.tweens = { add: vi.fn() };
    const factory = new TerrainDetailFactory(mock.scene);
    factory.bakeTuftTextures();
    const tufts = factory.scatterTufts({ count: 5, areaWidth: 400, areaHeight: 300 });

    expect(mock.scene.tweens.add).toHaveBeenCalledTimes(5);
    const call = mock.scene.tweens.add.mock.calls[0][0];
    expect(call.targets).toBe(tufts[0]);
    expect(call.yoyo).toBe(true);
    expect(call.repeat).toBe(-1);
    expect(call.rotation.from).toBeLessThan(0);
    expect(call.rotation.to).toBeGreaterThan(0);
  });

  it('NÃO lança e não exige scene.tweens (no-op headless): scatterTufts funciona sem balanço de vento', () => {
    // mock.scene padrão (makeMockScene) já não define `tweens` — regressão
    // implícita em toda outra suite acima, esta é a asserção explícita.
    expect(mock.scene.tweens).toBeUndefined();
    const factory = new TerrainDetailFactory(mock.scene);
    factory.bakeTuftTextures();
    expect(() => factory.scatterTufts({ count: 5, areaWidth: 400, areaHeight: 300 })).not.toThrow();
  });
});
