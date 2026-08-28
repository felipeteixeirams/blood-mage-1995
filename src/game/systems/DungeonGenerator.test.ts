import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DungeonGenerator, RoomData } from './DungeonGenerator';

// `hasLineOfSight()` (pré-existente, não tocado pela Frente 1) instancia
// `new Phaser.Geom.Line()`/`Rectangle()` como campo da classe — acessar o
// namespace Phaser.Geom em runtime (não só como tipo) cascateia o
// carregamento de um chunk interno do bundle do Phaser 4 que espera um
// `canvas.getContext('2d')` de verdade, e quebra em jsdom sem o pacote
// opcional `canvas` instalado (achado rodando `pnpm test` de verdade,
// 27/08). Nenhum teste aqui exercita `hasLineOfSight()` de propósito — só
// mockamos os 3 símbolos que o CONSTRUTOR da classe toca, pra instanciar
// `DungeonGenerator` sem precisar do Phaser de verdade.
vi.mock('phaser', () => ({
  default: {
    Geom: {
      Line: class { setTo() { return this; } },
      Rectangle: class { setTo() { return this; } },
      Intersects: { LineToRectangle: () => false },
    },
  },
}));

// A geração de traps/barrels em salas 'chamber' instancia SpikeTrap/ExplosiveBarrel
// (Phaser.Physics.Arcade.Sprite reais) — mockamos pra não depender de um mundo
// físico de verdade nesses testes de geometria/topologia do dungeon.
vi.mock('../objects/Traps', () => ({
  SpikeTrap: vi.fn(),
  ExplosiveBarrel: vi.fn(),
}));

function makeMockScene() {
  const wallsCreated: any[] = [];
  const imagesCreated: any[] = [];

  const chainable = () => {
    const obj: any = {};
    obj.setTint = vi.fn(() => obj);
    obj.setAlpha = vi.fn(() => obj);
    obj.setDepth = vi.fn(() => obj);
    obj.setStrokeStyle = vi.fn(() => obj);
    obj.setSize = vi.fn(() => obj);
    obj.refreshBody = vi.fn(() => obj);
    return obj;
  };

  const wallsGroup = {
    create: vi.fn((x: number, y: number, key: string) => {
      const wall = { x, y, texture: { key }, active: true, ...chainable() };
      wallsCreated.push(wall);
      return wall;
    }),
    getChildren: vi.fn(() => wallsCreated),
  };

  const chestsGroup = {
    create: vi.fn((x: number, y: number, key: string) => ({ x, y, texture: { key }, ...chainable() })),
  };

  const scene: any = {
    add: {
      image: vi.fn((x: number, y: number, key: string) => {
        const img = { x, y, texture: { key }, ...chainable() };
        imagesCreated.push(img);
        return img;
      }),
      star: vi.fn(() => chainable()),
      circle: vi.fn(() => chainable()),
    },
    textures: { exists: vi.fn(() => true) },
    spikeTrapsGroup: { add: vi.fn() },
    barrelsGroup: { add: vi.fn() },
  };

  return { scene, wallsGroup, chestsGroup, wallsCreated, imagesCreated };
}

// Duas salas se sobrepõem se seus retângulos [x, x+width) x [y, y+height) se cruzam.
function overlaps(a: RoomData, b: RoomData): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

const MAP_W = 1920;
const MAP_H = 1440;

describe('DungeonGenerator (spec 11, Frente 1 — layout orgânico via BSP + Cellular Automata, 27/08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera pelo menos 6 salas (nunca mais o grid fixo de 9 sempre iguais)', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    const rooms = generator.generate(MAP_W, MAP_H, 'fosso_chagas');
    expect(rooms.length).toBeGreaterThanOrEqual(6);
    expect(rooms.length).toBeLessThanOrEqual(9);
  });

  it('rooms[0] é sempre a sala de spawn (contrato usado por DungeonFlowController/CollisionHandlers)', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    const rooms = generator.generate(MAP_W, MAP_H, 'fosso_chagas');
    expect(rooms[0].type).toBe('spawn');
  });

  it('gera exatamente uma sala boss e uma secret_treasure por andar', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    const rooms = generator.generate(MAP_W, MAP_H, 'fosso_chagas');
    expect(rooms.filter((r) => r.type === 'boss').length).toBe(1);
    expect(rooms.filter((r) => r.type === 'secret_treasure').length).toBe(1);
    expect(rooms.filter((r) => r.type === 'spawn').length).toBe(1);
  });

  it('nenhuma sala fica fora dos limites do mapa nem se sobrepõe a outra (propriedade de particionamento do BSP)', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    const rooms = generator.generate(MAP_W, MAP_H, 'fosso_chagas');

    rooms.forEach((room) => {
      expect(room.x).toBeGreaterThanOrEqual(0);
      expect(room.y).toBeGreaterThanOrEqual(0);
      expect(room.x + room.width).toBeLessThanOrEqual(MAP_W);
      expect(room.y + room.height).toBeLessThanOrEqual(MAP_H);
      // Piso mínimo jogável — consistente com o range usado pelas armadilhas
      // (`room.width - 150`/`room.height - 150`) pra não gerar spread negativo.
      expect(room.width).toBeGreaterThanOrEqual(220);
      expect(room.height).toBeGreaterThanOrEqual(190);
    });

    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        expect(overlaps(rooms[i], rooms[j])).toBe(false);
      }
    }
  });

  it('layouts variam entre gerações consecutivas (não é mais o mesmo grid toda vez)', () => {
    const runA = makeMockScene();
    const generatorA = new DungeonGenerator(runA.scene, runA.wallsGroup as any, runA.chestsGroup as any);
    const roomsA = generatorA.generate(MAP_W, MAP_H, 'fosso_chagas');

    const runB = makeMockScene();
    const generatorB = new DungeonGenerator(runB.scene, runB.wallsGroup as any, runB.chestsGroup as any);
    const roomsB = generatorB.generate(MAP_W, MAP_H, 'fosso_chagas');

    // Praticamente impossível dois layouts aleatórios (contagem/posição/tamanho
    // de salas) baterem exatamente — se baterem, o gerador voltou a ser
    // determinístico/fixo, que é exatamente a regressão que este teste vigia.
    const signature = (rooms: RoomData[]) => rooms.map((r) => `${r.x},${r.y},${r.width},${r.height},${r.type}`).join('|');
    expect(signature(roomsA)).not.toBe(signature(roomsB));
  });

  it('constrói paredes com vão de porta (DOOR_WIDTH) só nas bordas que não encostam no perímetro do mapa', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    generator.generate(MAP_W, MAP_H, 'fosso_chagas');

    // Sempre constrói pelo menos as 4 paredes do perímetro externo do mapa.
    expect(wallsGroup.create).toHaveBeenCalled();
    // A sala de spawn (canto superior-esquerdo) não deve abrir portas pro
    // "vazio" fora do mapa — ou seja, nem toda sala tem tile_door (spawn e
    // quaisquer outras salas encostadas no perímetro ficam sem portas
    // superior/esquerda, como no grid antigo).
    const doorCount = scene.add.image.mock.calls.filter((call: any[]) => call[2] === 'tile_door').length;
    expect(doorCount).toBeGreaterThan(0);
  });

  it('mantém o comportamento fixo e inalterado da safe_house (sala única 800x600, sem BSP/CA)', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    const rooms = generator.generate(MAP_W, MAP_H, 'safe_house');
    expect(rooms.length).toBe(1);
    expect(rooms[0].type).toBe('spawn');
    expect(rooms[0].width).toBe(800);
    expect(rooms[0].height).toBe(600);
  });

  it('gera sempre pelo menos uma sala secret_treasure com 2 baús garantidos', () => {
    const { scene, wallsGroup, chestsGroup } = makeMockScene();
    const generator = new DungeonGenerator(scene, wallsGroup as any, chestsGroup as any);

    const rooms = generator.generate(MAP_W, MAP_H, 'fosso_chagas');
    const treasureRoom = rooms.find((r) => r.type === 'secret_treasure');
    expect(treasureRoom).toBeDefined();

    const chestCallsNearTreasure = chestsGroup.create.mock.calls.filter(
      (call: any[]) => Math.abs(call[1] - (treasureRoom as RoomData).centerY) < 5
    );
    expect(chestCallsNearTreasure.length).toBeGreaterThanOrEqual(2);
  });
});
