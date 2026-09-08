import Phaser from 'phaser';
import { BiomeType } from '../../types/game';
import { SpikeTrap, ExplosiveBarrel } from '../objects/Traps';
import { HeightmapGenerator, calculateIsometricDepth } from './HeightmapGenerator';
import { ProceduralForestGenerator } from './ProceduralForestGenerator';
import { DungeonDetailFactory } from './DungeonDetailFactory';
import { SafeHouseDetailFactory } from './SafeHouseDetailFactory';
// Spec 18 de origin/main (PathDrivenGenerator, mundo contínuo por nós) e o
// ProceduralForestGenerator desta branch (floresta orgânica por ruído) são
// duas implementações concorrentes pro MESMO bioma (gloomy_woods) — decisão
// arquitetural pendente (ver docs/reviews/03_AUDITORIA_BASE_DOCUMENTAL_2026_09.md).
// Por ora, mantido instanciado mas NÃO usado em generate() — gloomy_woods
// continua no ProceduralForestGenerator (produção/testado ao vivo) até a
// escolha ser feita; não remover este import sem antes decidir o vencedor.
import { PathDrivenGenerator, PathZone } from './PathDrivenGenerator';
import type { GameScene } from '../scenes/GameScene';

export interface RoomData {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  type: 'spawn' | 'chamber' | 'secret_treasure' | 'boss';
}

// Frente 1 (spec 11, 27/08): retângulo de partição do BSP, ANTES de esculpir a
// sala dentro dele — não faz parte do contrato público (`RoomData`), é só o
// espaço bruto que `carveRoomFromLeaf` usa pra decidir tamanho/posição da sala.
interface BspLeaf {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Fase 3.2 de docs/archive/specs/propostas/10_POLIMENTO_VISUAL_PROCEDURAL_LUZ_E_CENARIO.md:
// exportado pra GameScene.ts (posicionamento de tochas) usar o MESMO número em vez de um
// valor solto (±70) que nunca foi conferido contra o vão de porta real.
export const DOOR_WIDTH = 80;

const BIOME_TINTS: Record<BiomeType, { ground: number; wall: number }> = {
  fosso_chagas: { ground: 0x86efac, wall: 0x15803d }, // Toxic Green tint
  catacumbas_martires: { ground: 0xcccccc, wall: 0x475569 }, // Cold Stone Brick
  santuario_sangue: { ground: 0xfca5a5, wall: 0x991b1b }, // Blood Obsidian Tint
  safe_house: { ground: 0xffffff, wall: 0xffffff }, // No tint, use raw wood colors
  gloomy_woods: { ground: 0x5e796e, wall: 0x2f3e46 }, // Swampy deep pine green
};

export class DungeonGenerator {
  private scene: Phaser.Scene;
  private wallsGroup: Phaser.Physics.Arcade.StaticGroup;
  private chestsGroup: Phaser.Physics.Arcade.StaticGroup;
  private cachedLine = new Phaser.Geom.Line();
  private cachedRect = new Phaser.Geom.Rectangle();
  public heightGenerator: HeightmapGenerator;
  public pathDrivenGenerator: PathDrivenGenerator;

  constructor(
    scene: Phaser.Scene,
    wallsGroup: Phaser.Physics.Arcade.StaticGroup,
    chestsGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene;
    this.wallsGroup = wallsGroup;
    this.chestsGroup = chestsGroup;
    this.heightGenerator = new HeightmapGenerator(1995);
    this.pathDrivenGenerator = new PathDrivenGenerator(scene);
  }

  public isTraversable(fromX: number, fromY: number, toX: number, toY: number, isWorldCoords: boolean = true): boolean {
    return this.heightGenerator.isTraversable(fromX, fromY, toX, toY, isWorldCoords);
  }

  public generate(
    mapW: number,
    mapH: number,
    biome: BiomeType = 'fosso_chagas',
    offsetX: number = 0,
    offsetY: number = 0
  ): RoomData[] {
    if (biome === 'gloomy_woods') {
      const forestGen = new ProceduralForestGenerator(this.scene);
      this.heightGenerator = forestGen.heightGenerator;
      return forestGen.generate(mapW, mapH, offsetX, offsetY);
    }

    const isSafeHouse = biome === 'safe_house';
    const groundTexture = 'tile_ground';
    const tints = BIOME_TINTS[biome] || BIOME_TINTS.fosso_chagas;
    this.heightGenerator = new HeightmapGenerator(1995);
    const heightGen = this.heightGenerator;

    const wallTextureKey = this.scene.textures?.exists('spr_wall') ? 'spr_wall' : 'tile_wall_brick';

    let rooms: RoomData[] = [];
    let orderedCells: Array<{ leaf: BspLeaf; room: RoomData }> = [];

    const originX = offsetX + 90;
    const originY = offsetY + 70;
    const usableW = mapW - 180;
    const usableH = mapH - 140;

    if (isSafeHouse) {
      const roomW = 550; // Reduzido de 800 (41% menor)
      const roomH = 420; // Reduzido de 600 (30% menor)
      const rx = offsetX + (mapW - roomW) / 2;
      const ry = offsetY + (mapH - roomH) / 2;

      rooms.push({
        x: rx,
        y: ry,
        width: roomW,
        height: roomH,
        centerX: rx + roomW / 2,
        centerY: ry + roomH / 2,
        type: 'spawn',
      });
    } else {
      // Frente 1 (spec 11, 27/08) — layout orgânico via BSP + Cellular Automata
      const minLeafW = 380;
      const minLeafH = 320;
      const targetLeafCount = 6 + Math.floor(Math.random() * 4); // 6..9 inclusive

      const leaves = this.bspSplit(
        { x: originX, y: originY, width: usableW, height: usableH },
        targetLeafCount,
        minLeafW,
        minLeafH
      );

      const caCols = 6;
      const caRows = 5;
      const corridorGrid = this.computeCorridorZoneGrid(caCols, caRows);

      const cells = leaves.map((leaf) => ({
        leaf,
        room: this.carveRoomFromLeaf(leaf, corridorGrid, caCols, caRows, originX, originY, usableW, usableH),
      }));

      // Sala de spawn: a mais próxima do canto superior-esquerdo utilizável
      let spawnCell = cells[0];
      cells.forEach((cell) => {
        if (cell.room.centerX + cell.room.centerY < spawnCell.room.centerX + spawnCell.room.centerY) {
          spawnCell = cell;
        }
      });
      spawnCell.room.type = 'spawn';

      const distFromSpawn = (c: typeof cells[number]) =>
        Math.hypot(c.room.centerX - spawnCell.room.centerX, c.room.centerY - spawnCell.room.centerY);

      let bossCell: typeof cells[number] | null = null;
      cells.forEach((cell) => {
        if (cell === spawnCell) return;
        if (!bossCell || distFromSpawn(cell) > distFromSpawn(bossCell)) bossCell = cell;
      });
      if (bossCell) (bossCell as typeof cells[number]).room.type = 'boss';

      let treasureCell: typeof cells[number] | null = null;
      cells.forEach((cell) => {
        if (cell === spawnCell || cell === bossCell) return;
        if (!treasureCell || distFromSpawn(cell) > distFromSpawn(treasureCell)) treasureCell = cell;
      });
      if (treasureCell) (treasureCell as typeof cells[number]).room.type = 'secret_treasure';

      orderedCells = [spawnCell, ...cells.filter((c) => c !== spawnCell)];
      rooms = orderedCells.map((c) => c.room);
    }

    // Spatial predicate to check if a grid cell belongs to a carved room or door zone
    const isFloorCell = (gx: number, gy: number): boolean => {
      const wx = gx * 48;
      const wy = gy * 24;
      if (isSafeHouse) {
        // Mesma janela usada para posicionar a sala (rx/ry acima) — precisa do
        // offsetX/offsetY do chunk contíguo, senão a checagem de piso desalinha
        // da sala real assim que a safe_house deixar de estar sempre no offset 0.
        return (
          wx >= offsetX + (mapW - 550) / 2 &&
          wx <= offsetX + (mapW + 550) / 2 &&
          wy >= offsetY + (mapH - 420) / 2 &&
          wy <= offsetY + (mapH + 420) / 2
        );
      }
      return rooms.some((r) => wx >= r.x - 24 && wx <= r.x + r.width + 24 && wy >= r.y - 24 && wy <= r.y + r.height + 24);
    };

    // Fill Isometric Floor Tiles with Autotiling Bitmask & Biome Tinting (Spec 16)
    for (let x = offsetX; x < offsetX + mapW; x += 48) {
      for (let y = offsetY; y < offsetY + mapH; y += 24) {
        const gridX = Math.floor((x - offsetX) / 48);
        const gridY = Math.floor((y - offsetY) / 24);
        const zElevation = isSafeHouse ? 0 : heightGen.getHeightAt(gridX, gridY);
        // Deslocamento sutil em Y conforme a elevação Z (Spec 16 - heightStep 2px nos tiles 2D)
        const renderY = y - (zElevation * 2);
        const tileX = x + ((y - offsetY) % 48 === 0 ? 0 : 24);

        const tileTexKey = this.getGroundTextureKey(gridX, gridY, isSafeHouse, isFloorCell);
        const tile = this.scene.add.image(tileX, renderY, tileTexKey);
        if (!isSafeHouse) {
          tile.setTint(tints.ground);
          // Sombreamento sutil conforme elevação Z para profundidade visual
          if (zElevation === 0) {
            tile.setAlpha?.(0.85); // Vale/água mais escuro
          } else if (zElevation >= 3) {
            tile.setAlpha?.(1.0);
          }
        }
        const isoDepth = calculateIsometricDepth(gridX, gridY, zElevation, 1);
        tile.setDepth?.(isoDepth);
        if ((this.scene as any).lightingSystem) {
          (this.scene as any).lightingSystem.applyLightPipeline(tile);
        }

        // Render Cliff Faces for elevation drops Z > 0 (Cliff Faces & Elevation Shading)
        if (!isSafeHouse && zElevation > 0) {
          const cliffEdges = heightGen.getCliffEdges(gridX, gridY);
          if (cliffEdges.hasSouthCliff || cliffEdges.hasSouthEastCliff || cliffEdges.hasSouthWestCliff) {
            const maxDelta = Math.max(
              cliffEdges.deltaZSouth,
              cliffEdges.deltaZSouthEast,
              cliffEdges.deltaZSouthWest
            );

            for (let step = 1; step <= maxDelta; step++) {
              const cliffY = renderY + step * 8;
              const cliffSprite = this.scene.add.image(tileX, cliffY, wallTextureKey);
              cliffSprite.setTint(tints.wall);

              const cliffDepth = calculateIsometricDepth(gridX, gridY, zElevation, 2);
              cliffSprite.setDepth?.(cliffDepth);

              if ((this.scene as any).lightingSystem) {
                (this.scene as any).lightingSystem.applyLightPipeline(cliffSprite);
              }
            }
          }
        }
      }
    }

    // Poisson Disk Sampling para vegetação / props em relevo Z > 0 (Spec 16 - Cap. 3.3)
    if (!isSafeHouse) {
      const cols = Math.floor(mapW / 48);
      const rows = Math.floor(mapH / 24);
      const points = heightGen.samplePoissonDisk(cols, rows, 4.5);
      points.forEach((pt) => {
        if (pt.height > 0 && Math.random() < 0.35) {
          const propX = offsetX + pt.gridX * 48;
          const propY = offsetY + pt.gridY * 24 - pt.height * 2;
          const prop = this.scene.add.image(propX, propY, 'spr_skeleton_remains');
          prop.setTint(tints.ground);
          const depth = calculateIsometricDepth(pt.gridX, pt.gridY, pt.height, 5);
          prop.setDepth(depth);
          if ((this.scene as any).lightingSystem) {
            (this.scene as any).lightingSystem.applyLightPipeline(prop);
          }
        }
      });
    }

    if (isSafeHouse) {
      const roomW = 550;
      const roomH = 420;
      const rx = offsetX + (mapW - roomW) / 2;
      const ry = offsetY + (mapH - roomH) / 2;

      const safeHouseWallGrid = new Set<string>();

      // Build safe house specific walls with thickness for cozy atmosphere
      this.buildWallLine(rx, ry, rx + roomW, ry, 0xffffff, 'tile_wood_wall', true, safeHouseWallGrid); // Top
      this.buildWallLine(rx, ry + roomH, rx + roomW, ry + roomH, 0xffffff, 'tile_wood_wall', true, safeHouseWallGrid); // Bottom
      this.buildWallLine(rx, ry, rx, ry + roomH, 0xffffff, 'tile_wood_wall', true, safeHouseWallGrid); // Left
      this.buildWallLine(rx + roomW, ry, rx + roomW, ry + roomH, 0xffffff, 'tile_wood_wall', true, safeHouseWallGrid); // Right

      // Props ambiente da Safe House (tapete, estante, vela, ervas, barril,
      // tapeçaria) — PRECISA rodar aqui, antes do `return rooms` acima ser
      // alcançado. O bloco "Scatter decor details" mais abaixo (que trata o
      // ramo `isSafeHouse` do if/else) nunca é executado pra safe house
      // porque este `return` sai da função antes de chegar lá — confirmado
      // rodando o jogo de verdade (Playwright): 0 props apareciam na Safe
      // House mesmo com bakeDetailTextures()/scatterDetails() implementados
      // corretamente, porque eram código morto.
      const safeHouseFactory = new SafeHouseDetailFactory(this.scene);
      safeHouseFactory.bakeDetailTextures();
      rooms.forEach((room) => {
        safeHouseFactory.scatterDetails(room);
      });

      return rooms;
    }

    // Master Wall Grid collecting all wall line coordinates for accurate autotiling
    const masterWallGrid = new Set<string>();

    // Helper to register wall coordinates into masterWallGrid before rendering
    const registerWallLine = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      const steps = Math.ceil(dist / 32);
      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const wx = x1 + dx * t;
        const wy = y1 + dy * t;
        const gx = Math.round(wx / 32);
        const gy = Math.round(wy / 32);
        masterWallGrid.add(`${gx},${gy}`);
      }
    };

    // Pre-pass: Register outer perimeter wall coordinates
    registerWallLine(offsetX, offsetY, offsetX + mapW, offsetY);
    registerWallLine(offsetX, offsetY + mapH - 32, offsetX + mapW, offsetY + mapH - 32);
    registerWallLine(offsetX, offsetY, offsetX, offsetY + mapH);
    registerWallLine(offsetX + mapW - 32, offsetY, offsetX + mapW - 32, offsetY + mapH);

    // Pre-pass: Register partition wall coordinates
    orderedCells.forEach(({ room, leaf }) => {
      const doorWidth = DOOR_WIDTH;
      if (leaf.y > originY + 1) {
        const midX = room.centerX;
        registerWallLine(room.x, room.y, midX - doorWidth / 2, room.y);
        registerWallLine(midX + doorWidth / 2, room.y, room.x + room.width, room.y);
      }
      if (leaf.x > originX + 1) {
        const midY = room.centerY;
        registerWallLine(room.x, room.y, room.x, midY - doorWidth / 2);
        registerWallLine(room.x, midY + doorWidth / 2, room.x, room.y + room.height);
      }
    });

    const renderedWallGrid = new Set<string>();

    // Outer Perimeter Walls
    this.buildWallLine(offsetX, offsetY, offsetX + mapW, offsetY, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid); // Top
    this.buildWallLine(offsetX, offsetY + mapH - 32, offsetX + mapW, offsetY + mapH - 32, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid); // Bottom
    this.buildWallLine(offsetX, offsetY, offsetX, offsetY + mapH, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid); // Left
    this.buildWallLine(offsetX + mapW - 32, offsetY, offsetX + mapW - 32, offsetY + mapH, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid); // Right

    // Build Partition Walls around rooms with door openings
    orderedCells.forEach(({ room, leaf }) => {
      const doorWidth = DOOR_WIDTH;

      // Top Wall — só se a folha BSP desta sala não encostar na borda superior
      // utilizável (senão a parede/porta duplicaria a Outer Perimeter Wall).
      if (leaf.y > originY + 1) {
        const midX = room.centerX;
        this.buildWallLine(room.x, room.y, midX - doorWidth / 2, room.y, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid);
        this.buildWallLine(midX + doorWidth / 2, room.y, room.x + room.width, room.y, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid);
        this.scene.add.image(midX, room.y, 'tile_door').setDepth(2);
      }

      // Left Wall — mesma lógica, pra borda esquerda utilizável.
      if (leaf.x > originX + 1) {
        const midY = room.centerY;
        this.buildWallLine(room.x, room.y, room.x, midY - doorWidth / 2, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid);
        this.buildWallLine(room.x, midY + doorWidth / 2, room.x, room.y + room.height, tints.wall, 'tile_wall_brick', false, masterWallGrid, renderedWallGrid);
        this.scene.add.image(room.x, midY, 'tile_door').setDepth(2);
      }

      // Special Room Features
      if (room.type === 'boss') {
        // Pentagram Ritual Decal on Floor
        const star = this.scene.add.star(room.centerX, room.centerY, 5, 25, 55, 0xdc2626, 0.35).setDepth(2);
        const circle = this.scene.add.circle(room.centerX, room.centerY, 60).setStrokeStyle(3, 0xf43f5e, 0.8).setDepth(2);
        if ((this.scene as any).lightingSystem) {
          (this.scene as any).lightingSystem.applyLightPipeline(star);
          (this.scene as any).lightingSystem.applyLightPipeline(circle);
        }
      } else
      // Spikes and Barrels in regular chambers — mas não em `gloomy_woods`
      // (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md, observação de escopo da
      // Frente 2/3): é a introdução da Campanha, o jogador começa desarmado e
      // corpo a corpo contra os scout_beast — armadilhas de área/barril
      // explosivo empilhadas em cima disso é punitivo demais pra quem ainda tá
      // aprendendo o combate corpo a corpo, sem nenhuma magia de escape.
      if (room.type === 'chamber') {
        const gameScene = this.scene as GameScene;

        // 40% chance of traps
        if (Math.random() < 0.40) {
          // Trap cluster in center
          const spikeCount = 3 + Math.floor(Math.random() * 4);
          for(let i=0; i<spikeCount; i++) {
            const trapX = room.centerX + (Math.random() - 0.5) * (room.width - 150);
            const trapY = room.centerY + (Math.random() - 0.5) * (room.height - 150);
            const trap = new SpikeTrap(this.scene, trapX, trapY);
            gameScene.spikeTrapsGroup.add(trap);
          }
        }

        // 30% chance of barrels
        if (Math.random() < 0.30) {
          const barrelCount = 2 + Math.floor(Math.random() * 3);
          for(let i=0; i<barrelCount; i++) {
            const bx = room.centerX + (Math.random() - 0.5) * (room.width - 100);
            const by = room.centerY + (Math.random() - 0.5) * (room.height - 100);
            const barrel = new ExplosiveBarrel(this.scene, bx, by);
            gameScene.barrelsGroup.add(barrel);
          }
        }
      }

      if (room.type === 'secret_treasure') {
        // Guarantee 2 chests in secret treasure room with directional facing
        const key1 = this.getChestTextureKey('south_east');
        const key2 = this.getChestTextureKey('south_west');
        const chest1 = this.chestsGroup.create(room.centerX - 50, room.centerY, key1);
        const chest2 = this.chestsGroup.create(room.centerX + 50, room.centerY, key2);
        chest1.setDepth(room.centerY);
        chest2.setDepth(room.centerY);
        if ((this.scene as any).lightingSystem) {
          (this.scene as any).lightingSystem.applyLightPipeline(chest1);
          (this.scene as any).lightingSystem.applyLightPipeline(chest2);
        }
      } else if (room.type !== 'spawn' && Math.random() < 0.15) {
        const chestX = room.x + 40 + Math.random() * (room.width - 80);
        const chestY = room.y + 40 + Math.random() * (room.height - 80);
        const chestKey = this.getChestTextureKey();
        const chest = this.chestsGroup.create(chestX, chestY, chestKey);
        chest.setDepth(chestY);
        if ((this.scene as any).lightingSystem) {
          (this.scene as any).lightingSystem.applyLightPipeline(chest);
        }
      }
    });

    // Scatter decor details per room using DungeonDetailFactory.
    // NOTA: isSafeHouse já retornou mais acima (bloco `if (isSafeHouse)`),
    // onde o SafeHouseDetailFactory correspondente roda — chegar aqui
    // implica sempre !isSafeHouse, então não há mais ramo a checar.
    const detailFactory = new DungeonDetailFactory(this.scene);
    detailFactory.bakeDetailTextures();
    rooms.forEach((room) => {
      detailFactory.scatterDetails(room, biome);
    });

    return rooms;
  }

  /**
   * Frente 1 (spec 11, 27/08) — Binary Space Partitioning: parte recursivamente
   * o retângulo `root` em `targetCount` folhas (ou até não haver mais nenhuma
   * folha grande o bastante pra dividir de novo, o que vier primeiro). Cada
   * iteração escolhe a folha de MAIOR área ainda divisível e a corta ao meio
   * (com uma variação de 42%-58%, não sempre exatamente no centro) ao longo do
   * seu eixo mais longo — troca de eixo automática quando só um dos dois cabe
   * o `minW`/`minH` mínimo. É isso que substitui o grid fixo 3x3: o número, o
   * tamanho e a posição das folhas variam a cada geração.
   */
  private bspSplit(root: BspLeaf, targetCount: number, minW: number, minH: number): BspLeaf[] {
    const leaves: BspLeaf[] = [root];
    let safety = 0;

    while (leaves.length < targetCount && safety < 200) {
      safety++;

      let bestIdx = -1;
      let bestArea = 0;
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        const canSplitH = leaf.width >= minW * 2 + 20;
        const canSplitV = leaf.height >= minH * 2 + 20;
        if (!canSplitH && !canSplitV) continue;
        const area = leaf.width * leaf.height;
        if (area > bestArea) {
          bestArea = area;
          bestIdx = i;
        }
      }
      if (bestIdx === -1) break; // nenhuma folha grande o bastante pra dividir

      const leaf = leaves[bestIdx];
      const canSplitH = leaf.width >= minW * 2 + 20;
      const canSplitV = leaf.height >= minH * 2 + 20;
      const splitHorizontally = canSplitH && (leaf.width > leaf.height || !canSplitV);
      const ratio = 0.42 + Math.random() * 0.16;

      let a: BspLeaf;
      let b: BspLeaf;
      if (splitHorizontally) {
        const splitAt = Math.round(leaf.width * ratio);
        a = { x: leaf.x, y: leaf.y, width: splitAt, height: leaf.height };
        b = { x: leaf.x + splitAt, y: leaf.y, width: leaf.width - splitAt, height: leaf.height };
      } else {
        const splitAt = Math.round(leaf.height * ratio);
        a = { x: leaf.x, y: leaf.y, width: leaf.width, height: splitAt };
        b = { x: leaf.x, y: leaf.y + splitAt, width: leaf.width, height: leaf.height - splitAt };
      }
      leaves.splice(bestIdx, 1, a, b);
    }

    return leaves;
  }

  /**
   * Frente 1 (spec 11, 27/08) — Cellular Automata clássico (regra 4-5 de
   * vizinhança 8-direcional, bordas contam como "vivas" pra fechar bolhas em
   * vez de vazar infinitamente): gera um mapa grosseiro `caRows x caCols` de
   * zonas "corredor natural" (true) vs. "cripta quadrada" (false). Cada folha
   * do BSP amostra a zona sob o centro dela em `carveRoomFromLeaf` — zonas de
   * corredor esculpem salas mais estreitas e deslocadas dentro da própria
   * folha; zonas de cripta esculpem salas que preenchem quase toda a folha.
   * É exatamente a mistura que o mapeamento geral desta spec descreve:
   * "corredores naturais com criptas quadradas".
   */
  private computeCorridorZoneGrid(cols: number, rows: number): boolean[][] {
    let grid: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = Math.random() < 0.45;
      }
    }

    const countAliveNeighbors = (g: boolean[][], r: number, c: number): number => {
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            count++; // borda conta como "viva" — fecha bolsões em vez de vazar
          } else if (g[nr][nc]) {
            count++;
          }
        }
      }
      return count;
    };

    for (let iter = 0; iter < 2; iter++) {
      const next: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        next[r] = [];
        for (let c = 0; c < cols; c++) {
          const n = countAliveNeighbors(grid, r, c);
          next[r][c] = n >= 5 ? true : n <= 3 ? false : grid[r][c];
        }
      }
      grid = next;
    }

    return grid;
  }

  /**
   * Frente 1 (spec 11, 27/08) — esculpe a sala real dentro da folha do BSP:
   * nunca preenche a folha inteira (a "sobra" à direita/embaixo vira o espaço
   * aberto que conecta com a próxima sala, igual ao antigo grid, só que agora
   * com folgas variáveis em vez de sempre 140x120px fixos). O fator de
   * preenchimento vem da zona do Cellular Automata sob o centro da folha.
   */
  private carveRoomFromLeaf(
    leaf: BspLeaf,
    corridorGrid: boolean[][],
    caCols: number,
    caRows: number,
    originX: number,
    originY: number,
    usableW: number,
    usableH: number
  ): RoomData {
    // Clamp manual (não Phaser.Math.Clamp) pelo mesmo motivo do comentário em
    // `generate()` — evita tocar o namespace Phaser.Math em runtime.
    const gc = Math.max(0, Math.min(caCols - 1, Math.floor(((leaf.x + leaf.width / 2 - originX) / usableW) * caCols)));
    const gr = Math.max(0, Math.min(caRows - 1, Math.floor(((leaf.y + leaf.height / 2 - originY) / usableH) * caRows)));
    const isCorridorZone = corridorGrid[gr][gc];

    const pad = 30;
    const [fillMin, fillMax] = isCorridorZone ? [0.5, 0.68] : [0.74, 0.9];
    const fillW = fillMin + Math.random() * (fillMax - fillMin);
    const fillH = fillMin + Math.random() * (fillMax - fillMin);

    const width = Math.max(220, Math.round((leaf.width - pad) * fillW));
    const height = Math.max(190, Math.round((leaf.height - pad) * fillH));
    const x = Math.round(leaf.x + pad / 2);
    const y = Math.round(leaf.y + pad / 2);

    return {
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      type: 'chamber',
    };
  }

  public getChestTextureKey(dir?: string): string {
    const directions = ['south', 'south_west', 'west', 'north_west', 'north', 'north_east', 'east', 'south_east'];
    const chosenDir = dir || directions[Math.floor(Math.random() * directions.length)];
    const key = `spr_chest_${chosenDir}`;
    return this.scene.textures.exists(key) ? key : 'spr_chest';
  }

  /**
   * Bitmask autotiling helper for dungeon floor tiles.
   * Calculates 4-cardinal neighbor bitmask (0..15):
   * Bit 0 (1): North
   * Bit 1 (2): East
   * Bit 2 (4): South
   * Bit 3 (8): West
   */
  public calculateBitmask(gridX: number, gridY: number, isFloorFn?: (gx: number, gy: number) => boolean): number {
    const isFloor = isFloorFn || ((gx: number, gy: number) => gx >= 0 && gy >= 0);
    let mask = 0;
    if (isFloor(gridX, gridY - 1)) mask |= 1;  // North
    if (isFloor(gridX + 1, gridY)) mask |= 2;  // East
    if (isFloor(gridX, gridY + 1)) mask |= 4;  // South
    if (isFloor(gridX - 1, gridY)) mask |= 8;  // West
    return mask;
  }

  public getGroundTextureKey(
    gridX: number,
    gridY: number,
    isSafeHouse: boolean = false,
    isFloorFn?: (gx: number, gy: number) => boolean
  ): string {
    if (isSafeHouse) {
      // Deterministic pseudo-noise for wood floor variants and rare tapestry rug tile
      const noiseVal = Math.abs(Math.sin(gridX * 12.9898 + gridY * 78.233));
      const rugChance = Math.abs(Math.sin(gridX * 43.123 + gridY * 19.876));

      // 1 in 18 tiles (~5.5% probability) displays carpet rug overlay.
      // NOTA: o threshold real não é `probabilidade-alvo` direto porque
      // `|sin(x)|` não é uniformemente distribuído — segue distribuição
      // arcoseno (mais densidade perto de 0 e perto de 1), então valores
      // acima de 0.9 são muito mais comuns do que num sorteio uniforme.
      // Confirmado rodando o jogo: com threshold 0.945 o tapete cobria
      // ~21% dos tiles (quase todo tile alternado), não os ~5.5%
      // pretendidos — visualmente virava "carpete de parede a parede" em
      // vez de um acento ocasional. 0.9965 é o valor empírico (medido
      // amostrando a malha) que produz de fato ~5.3% de cobertura.
      if (rugChance > 0.9965) {
        return this.scene.textures?.exists('tile_wood_floor_rug') ? 'tile_wood_floor_rug' : 'tile_wood_floor';
      }

      const variantIdx = Math.floor(noiseVal * 5) % 5;
      const varKey = `tile_wood_floor_var_${variantIdx}`;
      return this.scene.textures?.exists(varKey) ? varKey : 'tile_wood_floor';
    }

    // Deterministic pseudo-noise variant for center tiles
    const variantIdx = Math.floor(Math.abs(Math.sin(gridX * 12.9898 + gridY * 78.233)) * 5) % 5;
    const centerKey = `tile_ground_var_${variantIdx}`;

    const mask = this.calculateBitmask(gridX, gridY, isFloorFn);
    // Mask 15 = all 4 cardinal neighbors exist (Center tile)
    if (mask === 15) {
      return this.scene.textures?.exists(centerKey) ? centerKey : 'tile_ground';
    }

    // Edge/corner map
    let maskKey = 'edge_n';
    if (mask === 14) maskKey = 'edge_n';
    else if (mask === 13) maskKey = 'edge_e';
    else if (mask === 11) maskKey = 'edge_s';
    else if (mask === 7) maskKey = 'edge_w';
    else if (mask === 12) maskKey = 'corner_ne';
    else if (mask === 9) maskKey = 'corner_se';
    else if (mask === 3) maskKey = 'corner_sw';
    else if (mask === 6) maskKey = 'corner_nw';

    const autotileKey = `tile_ground_${maskKey}`;
    if (this.scene.textures?.exists(autotileKey)) {
      return autotileKey;
    }
    return this.scene.textures?.exists(centerKey) ? centerKey : 'tile_ground';
  }

  /**
   * Calculates 4-cardinal wall neighbor bitmask (0..15):
   * Bit 0 (1): North
   * Bit 1 (2): East
   * Bit 2 (4): South
   * Bit 3 (8): West
   */
  public calculateWallBitmask(gx: number, gy: number, wallGrid: Set<string>): number {
    return this.calculateBitmask(gx, gy, (x, y) => wallGrid.has(`${x},${y}`));
  }

  public getWallTextureKey(
    gx: number,
    gy: number,
    wallGrid: Set<string>,
    baseTextureKey: string = 'tile_wall_brick'
  ): string {
    if (baseTextureKey === 'tile_wood_wall') {
      return 'tile_wood_wall';
    }

    const mask = this.calculateWallBitmask(gx, gy, wallGrid);

    // 0 or 1 neighbor -> endcap
    if (mask === 0 || mask === 1 || mask === 2 || mask === 4 || mask === 8) {
      const endcapKey = 'tile_wall_brick_endcap';
      return this.scene.textures?.exists(endcapKey) ? endcapKey : baseTextureKey;
    }

    // 2 opposite neighbors -> straight wall
    if (mask === 5 || mask === 10) { // N+S or E+W
      const variantIdx = Math.floor(Math.abs(Math.sin(gx * 12.9898 + gy * 78.233)) * 5) % 5;
      const vKey = `tile_wall_brick_var_${variantIdx}`;
      return this.scene.textures?.exists(vKey) ? vKey : baseTextureKey;
    }

    // 2 adjacent neighbors -> Corners (check diagonal for inner vs outer)
    let cornerType = '';
    if (mask === 3) { // N + E
      const hasDiagonal = wallGrid.has(`${gx + 1},${gy - 1}`);
      cornerType = hasDiagonal ? 'corner_inner_ne' : 'corner_outer_ne';
    } else if (mask === 6) { // E + S
      const hasDiagonal = wallGrid.has(`${gx + 1},${gy + 1}`);
      cornerType = hasDiagonal ? 'corner_inner_se' : 'corner_outer_se';
    } else if (mask === 12) { // S + W
      const hasDiagonal = wallGrid.has(`${gx - 1},${gy + 1}`);
      cornerType = hasDiagonal ? 'corner_inner_sw' : 'corner_outer_sw';
    } else if (mask === 9) { // W + N
      const hasDiagonal = wallGrid.has(`${gx - 1},${gy - 1}`);
      cornerType = hasDiagonal ? 'corner_inner_nw' : 'corner_outer_nw';
    }

    if (cornerType) {
      const cornerKey = `tile_wall_brick_${cornerType}`;
      if (this.scene.textures?.exists(cornerKey)) return cornerKey;
    }

    // 3 or 4 neighbors -> T-Junction or Cross
    if (mask === 7 || mask === 11 || mask === 13 || mask === 14 || mask === 15) {
      const tKey = 'tile_wall_brick_t_junction';
      if (this.scene.textures?.exists(tKey)) return tKey;
    }

    const variantIdx = Math.floor(Math.abs(Math.sin(gx * 12.9898 + gy * 78.233)) * 5) % 5;
    const vKey = `tile_wall_brick_var_${variantIdx}`;
    return this.scene.textures?.exists(vKey) ? vKey : baseTextureKey;
  }

  private buildWallLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    wallTint: number,
    textureKey: string = 'tile_wall_brick',
    disableTint: boolean = false,
    externalWallGrid?: Set<string>,
    renderedWallGrid?: Set<string>
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / 32);

    const neighborGrid = externalWallGrid || new Set<string>();
    const renderedGrid = renderedWallGrid || new Set<string>();
    const wallItems: Array<{ wx: number; wy: number; gx: number; gy: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const wx = x1 + dx * t;
      const wy = y1 + dy * t;
      const gx = Math.round(wx / 32);
      const gy = Math.round(wy / 32);

      const key = `${gx},${gy}`;
      neighborGrid.add(key);
      if (!renderedGrid.has(key)) {
        renderedGrid.add(key);
        wallItems.push({ wx, wy, gx, gy });
      }
    }

    for (const item of wallItems) {
      let finalWallKey = textureKey;
      if (textureKey === 'tile_wall_brick' || textureKey === 'spr_wall') {
        finalWallKey = this.getWallTextureKey(item.gx, item.gy, neighborGrid, textureKey);
      }

      const wall = this.wallsGroup.create(item.wx, item.wy, finalWallKey);
      if (!disableTint) {
        wall.setTint(wallTint);
      }
      wall.setSize(32, 32);
      wall.setDepth(item.wy + 16);
      wall.refreshBody();
      if ((this.scene as any).lightingSystem) {
        (this.scene as any).lightingSystem.applyLightPipeline(wall);
      }
    }
  }

  /**
   * Raycasting helper with AABB pruning and pre-allocated objects for high-performance line-of-sight checks.
   */
  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    this.cachedLine.setTo(x1, y1, x2, y2);
    const wallChildren = this.wallsGroup.getChildren();

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (let i = 0; i < wallChildren.length; i++) {
      const wall = wallChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (wall.active) {
        const wallX = wall.x;
        const wallY = wall.y;

        // Fast AABB pruning phase: if the wall's bounding box doesn't overlap the line's bounding box,
        // it cannot possibly block line of sight.
        if (wallX + 16 < minX || wallX - 16 > maxX || wallY + 16 < minY || wallY - 16 > maxY) {
          continue;
        }

        // Only do full geometric intersection calculation if bounds overlap
        this.cachedRect.setTo(wallX - 16, wallY - 16, 32, 32);
        if (Phaser.Geom.Intersects.LineToRectangle(this.cachedLine, this.cachedRect)) {
          return false; // Obstacle blocks line of sight!
        }
      }
    }
    return true; // Clear line of sight!
  }
}
