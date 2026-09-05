import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProceduralForestGenerator } from './ProceduralForestGenerator';

// Mesmo motivo do DungeonGenerator.test.ts: acessar o namespace Phaser em
// runtime (não só como tipo) cascateia dependências reais de canvas/WebGL
// que quebram em jsdom. ProceduralForestGenerator só usa `Phaser.BlendModes.ADD`
// em runtime (para as manchas de luz solar aditivas) — mockamos só isso.
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
  const methods = ['setOrigin', 'setScale', 'setDepth', 'setAlpha', 'setBlendMode', 'setPixelArt', 'setTint'];
  methods.forEach(m => { obj[m] = vi.fn(() => obj); });
  return obj;
}

function makeMockScene() {
  const textureKeys = new Set<string>();
  const imagesCreated: any[] = [];
  const spritesCreated: any[] = [];
  const graphicsCreated: any[] = [];

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
    game: { renderer: { isWebGL: false } }, // força fallback de Sprite (sem WebGL real em jsdom)
    textures,
    add,
    depthGroup,
    lightingSystem: undefined,
  };

  return { scene, textureKeys, imagesCreated, spritesCreated, depthGroupChildren };
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

  it('converte pixels em células de grid (regressão do bug de ~2.76M iterações)', () => {
    // gridW = floor(1920/64) = 30, gridH = floor(1440/32) = 45
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const grassImages = mock.imagesCreated.filter(i => i.textureKey === 'forest_grass');
    expect(grassImages).toHaveLength(30 * 45);
  });

  it('cria todas as texturas procedurais esperadas (piso, tronco-fallback, luz e árvores)', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    // forest_trunk é mantida só como fallback defensivo (ver
    // generateAndRenderTrees) — forest_foliage_1/2 e forest_shadow foram
    // removidas por serem assadas sem nunca ser instanciadas como
    // Sprite/Image (desperdício puro de CPU/GPU, sem efeito visual).
    ['forest_grass', 'forest_trunk', 'forest_light_patch',
     'procedural_tree_0', 'procedural_tree_1', 'procedural_tree_2'].forEach(key => {
      expect(mock.textureKeys.has(key)).toBe(true);
    });
    expect(mock.textureKeys.has('forest_foliage_1')).toBe(false);
    expect(mock.textureKeys.has('forest_foliage_2')).toBe(false);
    expect(mock.textureKeys.has('forest_shadow')).toBe(false);
  });

  it('renderiza manchas de luz solar filtrada (dappled light) com blend aditivo', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const lightPatches = mock.imagesCreated.filter(i => i.textureKey === 'forest_light_patch');
    expect(lightPatches.length).toBeGreaterThan(0);
    lightPatches.forEach(patch => {
      expect(patch.setBlendMode).toHaveBeenCalledWith(1); // Phaser.BlendModes.ADD (mockado)
    });
  });

  it('instancia uma floresta densa (44 árvores: 2 próximas ao spawn + 42 de fundo)', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    expect(mock.spritesCreated.length).toBe(44);
    // Todas as árvores foram adicionadas ao depthGroup para z-sorting isométrico
    expect(mock.depthGroupChildren.length).toBeGreaterThanOrEqual(44);
  });

  it('propaga erro se depthGroup não estiver disponível (fail-fast, sem silenciar)', () => {
    mock.scene.depthGroup = undefined;
    const gen = new ProceduralForestGenerator(mock.scene);
    expect(() => gen.generate(1920, 1440)).toThrow();
  });

  // Regressão: "grama cobrindo até a cabeça do personagem" — forest_grass é
  // um retângulo opaco sem recorte de silhueta isométrica; colocá-lo no
  // depthGroup (Y-sort, depth = y recalculado por frame) fazia sua metade
  // superior invadir visualmente o espaço do personagem. O piso deve ficar
  // FORA do Y-sort, com depth fixo e baixo.
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

  it('espalha tufos de grama Y-sorted (TerrainDetailFactory) como detalhe vertical do piso', () => {
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const tuftImages = mock.imagesCreated.filter(i => String(i.textureKey).startsWith('terrain_grass_tuft_'));
    expect(tuftImages.length).toBeGreaterThan(0);
    tuftImages.forEach(t => {
      expect(t.setOrigin).toHaveBeenCalledWith(0.5, 1);
      expect(mock.depthGroupChildren).toContain(t); // participa do Y-sort de verdade
    });
  });

  it('aplica respiração de alpha (tween yoyo, loop infinito) nas manchas de luz solar quando scene.tweens existe', () => {
    mock.scene.tweens = { add: vi.fn() };
    const gen = new ProceduralForestGenerator(mock.scene);
    gen.generate(1920, 1440);

    const lightPatches = mock.imagesCreated.filter(i => i.textureKey === 'forest_light_patch');
    expect(lightPatches.length).toBeGreaterThan(0);

    // scene.tweens.add é compartilhado com o balanço de vento dos tufos
    // (TerrainDetailFactory usa a mesma scene) — filtra só as chamadas
    // cujo target é uma mancha de luz.
    const patchCalls = mock.scene.tweens.add.mock.calls
      .map((args: any[]) => args[0])
      .filter((cfg: any) => lightPatches.includes(cfg.targets));

    expect(patchCalls.length).toBe(lightPatches.length);
    patchCalls.forEach((call: any) => {
      expect(call.yoyo).toBe(true);
      expect(call.repeat).toBe(-1);
      expect(call.alpha.from).toBeGreaterThan(call.alpha.to);
    });
  });

  it('NÃO lança sem scene.tweens (no-op headless): geração completa funciona sem animação de luz/vento', () => {
    expect(mock.scene.tweens).toBeUndefined();
    const gen = new ProceduralForestGenerator(mock.scene);
    expect(() => gen.generate(1920, 1440)).not.toThrow();
  });
});
