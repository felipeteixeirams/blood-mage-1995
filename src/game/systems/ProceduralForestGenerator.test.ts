import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProceduralForestGenerator } from './ProceduralForestGenerator';

vi.mock('phaser', () => ({
  default: {
    BlendModes: { ADD: 1 },
  },
}));

function makeMockCtx() {
  const ctx: any = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    strokeRect: vi.fn(),
  };
  return ctx;
}

function makeChainable(extra: Record<string, unknown> = {}) {
  const obj: any = { ...extra };
  const methods = ['setOrigin', 'setScale', 'setDepth', 'setAlpha', 'setBlendMode', 'setPixelArt', 'setTint', 'setScrollFactor', 'setVisible', 'setSize', 'setOffset', 'refreshBody'];
  methods.forEach(m => { obj[m] = vi.fn(() => obj); });
  return obj;
}

function makeMockScene() {
  const textureKeys = new Set<string>();
  const imagesCreated: any[] = [];
  const spritesCreated: any[] = [];
  const graphicsCreated: any[] = [];
  const wallsCreated: any[] = [];

  const textures = {
    exists: vi.fn((key: string) => textureKeys.has(key)),
    remove: vi.fn((key: string) => textureKeys.delete(key)),
    createCanvas: vi.fn((key: string) => {
      textureKeys.add(key);
      return { context: makeMockCtx(), refresh: vi.fn() };
    }),
    addDynamicTexture: vi.fn((key: string) => {
      textureKeys.add(key);
      return { draw: vi.fn(), render: vi.fn() };
    }),
  };

  const depthGroupChildren: any[] = [];
  const depthGroup = { add: vi.fn((obj: any) => depthGroupChildren.push(obj)) };

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
    sprite: vi.fn((x: number, y: number, key: string) => {
      const spr = makeChainable({ x, y, textureKey: key });
      spritesCreated.push(spr);
      return spr;
    }),
    graphics: vi.fn(() => {
      const g: any = {};
      ['fillStyle', 'fillEllipse', 'fillTriangle', 'fillRect', 'lineStyle', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fillPath', 'strokePath']
        .forEach(m => { g[m] = vi.fn(() => g); });
      g.destroy = vi.fn();
      graphicsCreated.push(g);
      return g;
    }),
  };

  const scene: any = {
    sys: { settings: { key: 'GameScene' } },
    game: { renderer: { isWebGL: false } },
    textures,
    add,
    depthGroup,
    wallsGroup,
    lightingSystem: undefined,
  };

  return { scene, textureKeys, imagesCreated, spritesCreated, wallsCreated, depthGroupChildren };
}

describe('ProceduralForestGenerator', () => {
  let mock: ReturnType<typeof makeMockScene>;

  beforeEach(() => {
    mock = makeMockScene();
  });

  it('gera a floresta sem lançar exceção e retorna uma única sala de spawn', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    const rooms = gen.generate(1920, 1440);

    expect(rooms).toHaveLength(1);
    expect(rooms[0].type).toBe('spawn');
  });

  it('integra HeightmapGenerator para relevo procedural e respeita regra de falésia (Delta H >= 2 é intransponível)', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    expect(gen.heightGenerator).toBeDefined();
    const z = gen.heightGenerator.getHeightAt(10, 10);
    expect(z).toBeGreaterThanOrEqual(0);
    expect(z).toBeLessThanOrEqual(4);

    expect(gen.heightGenerator.isPathTraversable(1, 2)).toBe(true);
    expect(gen.heightGenerator.isPathTraversable(1, 3)).toBe(false);
  });

  it('adiciona corpo físico estático invisível na base do tronco para cada árvore no primeiro plano (wallsGroup)', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const treeWalls = mock.wallsCreated.filter(wall =>
      wall.setSize.mock.calls.some((args: any[]) => args[0] === 16 && args[1] === 10)
    );
    expect(treeWalls.length).toBeGreaterThanOrEqual(44);
    treeWalls.forEach(wall => {
      expect(wall.setVisible).toHaveBeenCalledWith(false);
      expect(wall.refreshBody).toHaveBeenCalled();
    });
  });

  it('converte pixels em células de grid (regressão do bug de ~2.76M iterações)', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const grassImages = mock.imagesCreated.filter(i => i.textureKey === 'forest_grass');
    expect(grassImages).toHaveLength(30 * 45);
  });

  it('cria todas as texturas procedurais esperadas (piso, tronco-fallback, luz e árvores)', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    ['forest_grass', 'forest_trunk', 'forest_light_patch',
     'procedural_tree_0', 'procedural_tree_1', 'procedural_tree_2'].forEach(key => {
      expect(mock.textureKeys.has(key)).toBe(true);
    });
  });

  it('renderiza manchas de luz solar filtrada (dappled light) com blend aditivo', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const lightPatches = mock.imagesCreated.filter(i => i.textureKey === 'forest_light_patch');
    expect(lightPatches.length).toBeGreaterThan(0);
    lightPatches.forEach(patch => {
      expect(patch.setBlendMode).toHaveBeenCalledWith(1);
    });
  });

  it('instancia uma floresta densa e coloca árvores no depthGroup para z-sorting', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    expect(mock.spritesCreated.length).toBe(58);
    expect(mock.depthGroupChildren.length).toBeGreaterThanOrEqual(44);
  });

  it('instancia árvores de paralaxe no plano de fundo com scrollFactor/escala/tint reduzidos', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const bgTrees = mock.spritesCreated.slice(0, 14);
    expect(bgTrees.length).toBe(14);
    bgTrees.forEach(bgTree => {
      expect(bgTree.setScrollFactor).toHaveBeenCalledWith(0.65, 0.65);
      expect(bgTree.setScale).toHaveBeenCalledWith(0.65);
      expect(bgTree.setTint).toHaveBeenCalledWith(0x556655);
      expect(bgTree.setAlpha).toHaveBeenCalledWith(0.75);
    });

    bgTrees.forEach(bgTree => expect(mock.depthGroupChildren).not.toContain(bgTree));
  });

  it('propaga erro se depthGroup não estiver disponível (fail-fast, sem silenciar)', () => {
    mock.scene.depthGroup = undefined;
    const gen = new ProceduralForestGenerator(mock.scene);
    expect(() => gen.generate(1920, 1440)).toThrow();
  });

  it('NÃO adiciona piso (grama/manchas de luz) ao depthGroup — piso é plano, fora do Y-sort', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const grassImages = mock.imagesCreated.filter(i => i.textureKey === 'forest_grass');
    const lightPatches = mock.imagesCreated.filter(i => i.textureKey === 'forest_light_patch');

    grassImages.forEach(g => expect(mock.depthGroupChildren).not.toContain(g));
    lightPatches.forEach(p => expect(mock.depthGroupChildren).not.toContain(p));
  });

  it('usa depth fixo e baixo para o piso, sempre atrás de qualquer objeto Y-sorted', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const grassImages = mock.imagesCreated.filter(i => i.textureKey === 'forest_grass');
    const lightPatches = mock.imagesCreated.filter(i => i.textureKey === 'forest_light_patch');

    expect(grassImages.length).toBeGreaterThan(0);
    grassImages.forEach(g => expect(g.setDepth).toHaveBeenCalledWith(-1000));
    lightPatches.forEach(p => expect(p.setDepth).toHaveBeenCalledWith(-999));
  });

  it('espalha flora variada Y-sorted (TerrainDetailFactory) como detalhe do piso', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const floraImages = mock.imagesCreated.filter(i =>
      String(i.textureKey).startsWith('terrain_grass_tuft_') ||
      String(i.textureKey).startsWith('terrain_bush_') ||
      String(i.textureKey).startsWith('terrain_mushroom_') ||
      String(i.textureKey).startsWith('terrain_rock_') ||
      String(i.textureKey).startsWith('terrain_log_')
    );
    expect(floraImages.length).toBeGreaterThan(0);
    floraImages.forEach(t => {
      expect(t.setOrigin).toHaveBeenCalledWith(0.5, 1);
      expect(mock.depthGroupChildren).toContain(t);
    });
  });

  it('desenha árvores fractais com paletas de folhagem distintas por variantIndex', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    const g = mock.scene.add.graphics();

    gen.drawFractalTreeGraphics(g, 80, 175, 1000, 0);
    const fillStyleCallsVariant0 = [...g.fillStyle.mock.calls];

    g.fillStyle.mockClear();

    gen.drawFractalTreeGraphics(g, 80, 175, 1000, 2);
    const fillStyleCallsVariant2 = [...g.fillStyle.mock.calls];

    expect(fillStyleCallsVariant0).not.toEqual(fillStyleCallsVariant2);
  });
});
