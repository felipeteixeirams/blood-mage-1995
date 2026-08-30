import Phaser from 'phaser';
import { BiomeType } from '../../types/game';
import { SpikeTrap, ExplosiveBarrel } from '../objects/Traps';
import { HeightmapGenerator, calculateIsometricDepth } from './HeightmapGenerator';
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

  constructor(
    scene: Phaser.Scene,
    wallsGroup: Phaser.Physics.Arcade.StaticGroup,
    chestsGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene;
    this.wallsGroup = wallsGroup;
    this.chestsGroup = chestsGroup;
    this.heightGenerator = new HeightmapGenerator(1995);
  }

  public isTraversable(fromX: number, fromY: number, toX: number, toY: number, isWorldCoords: boolean = true): boolean {
    return this.heightGenerator.isTraversable(fromX, fromY, toX, toY, isWorldCoords);
  }

  public generate(mapW: number, mapH: number, biome: BiomeType = 'fosso_chagas'): RoomData[] {
    const isSafeHouse = biome === 'safe_house';
    const groundTexture = isSafeHouse ? 'tile_wood_floor' : 'tile_ground';
    const tints = BIOME_TINTS[biome] || BIOME_TINTS.fosso_chagas;
    this.heightGenerator = new HeightmapGenerator(biome === 'gloomy_woods' ? 2026 : 1995);
    const heightGen = this.heightGenerator;

    // Fill Isometric Floor Tiles with Biome Tinting & 2.5D Elevation (Spec 16)
    for (let x = 0; x < mapW; x += 48) {
      for (let y = 0; y < mapH; y += 24) {
        const gridX = Math.floor(x / 48);
        const gridY = Math.floor(y / 24);
        const zElevation = isSafeHouse ? 0 : heightGen.getHeightAt(gridX, gridY);
        // Deslocamento sutil em Y conforme a elevação Z (Spec 16 - heightStep 2px nos tiles 2D)
        const renderY = y - (zElevation * 2);

        const tile = this.scene.add.image(x + (y % 48 === 0 ? 0 : 24), renderY, groundTexture);
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
      }
    }

    // Poisson Disk Sampling para vegetação / props em relevo Z > 0 (Spec 16 - Cap. 3.3)
    if (!isSafeHouse) {
      const cols = Math.floor(mapW / 48);
      const rows = Math.floor(mapH / 24);
      const points = heightGen.samplePoissonDisk(cols, rows, 4.5);
      points.forEach((pt) => {
        if (pt.height > 0 && Math.random() < 0.35) {
          const propX = pt.gridX * 48;
          const propY = pt.gridY * 24 - pt.height * 2;
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
      const rooms: RoomData[] = [];
      const roomW = 800;
      const roomH = 600;
      const rx = (mapW - roomW) / 2;
      const ry = (mapH - roomH) / 2;

      rooms.push({
        x: rx,
        y: ry,
        width: roomW,
        height: roomH,
        centerX: rx + roomW / 2,
        centerY: ry + roomH / 2,
        type: 'spawn',
      });

      // Build safe house specific walls
      this.buildWallLine(rx, ry, rx + roomW, ry, 0xffffff, 'tile_wood_wall', true); // Top
      this.buildWallLine(rx, ry + roomH, rx + roomW, ry + roomH, 0xffffff, 'tile_wood_wall', true); // Bottom
      this.buildWallLine(rx, ry, rx, ry + roomH, 0xffffff, 'tile_wood_wall', true); // Left
      this.buildWallLine(rx + roomW, ry, rx + roomW, ry + roomH, 0xffffff, 'tile_wood_wall', true); // Right

      return rooms;
    }

    // Frente 1 (spec 11, 27/08) — layout orgânico via BSP + Cellular Automata,
    // substitui o grid fixo 3x3 que existia antes (auditoria de 27/08 apontou
    // que o dungeon sempre gerava a MESMA malha, só o conteúdo das salas
    // variava). Ver `bspSplit`/`computeCorridorZoneGrid` mais abaixo e o
    // changelog da spec pra rationale completo.
    const originX = 90;
    const originY = 70;
    const usableW = mapW - originX - 90;
    const usableH = mapH - originY - 70;
    const minLeafW = 380;
    const minLeafH = 320;
    // Math.random()-based, não Phaser.Math.Between: acessar o namespace
    // Phaser.Math em runtime (em vez de só como tipo) cascateia o carregamento
    // de um chunk interno do bundle do Phaser 4 que espera um
    // `canvas.getContext('2d')' de verdade — quebra em jsdom sem o pacote
    // opcional `canvas` instalado (achado rodando `pnpm test` de verdade,
    // 27/08). Resultado idêntico, sem tocar o runtime do Phaser.
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

    // Sala de spawn: a mais próxima do canto superior-esquerdo utilizável —
    // igual ao antigo (0,0) do grid, mantém `rooms[0]` como sala de spawn
    // (contrato usado por DungeonFlowController).
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

    // rooms[0] precisa ser sempre a sala de spawn (DungeonFlowController lê
    // `rooms[0]` direto pra posicionar o jogador).
    const orderedCells = [spawnCell, ...cells.filter((c) => c !== spawnCell)];
    const rooms: RoomData[] = orderedCells.map((c) => c.room);

    // Outer Perimeter Walls
    this.buildWallLine(0, 0, mapW, 0, tints.wall); // Top
    this.buildWallLine(0, mapH - 32, mapW, mapH - 32, tints.wall); // Bottom
    this.buildWallLine(0, 0, 0, mapH, tints.wall); // Left
    this.buildWallLine(mapW - 32, 0, mapW - 32, mapH, tints.wall); // Right

    // Build Partition Walls around rooms with door openings
    orderedCells.forEach(({ room, leaf }) => {
      const doorWidth = DOOR_WIDTH;

      // Top Wall — só se a folha BSP desta sala não encostar na borda superior
      // utilizável (senão a parede/porta duplicaria a Outer Perimeter Wall).
      if (leaf.y > originY + 1) {
        const midX = room.centerX;
        this.buildWallLine(room.x, room.y, midX - doorWidth / 2, room.y, tints.wall);
        this.buildWallLine(midX + doorWidth / 2, room.y, room.x + room.width, room.y, tints.wall);
        this.scene.add.image(midX, room.y, 'tile_door').setDepth(2);
      }

      // Left Wall — mesma lógica, pra borda esquerda utilizável.
      if (leaf.x > originX + 1) {
        const midY = room.centerY;
        this.buildWallLine(room.x, room.y, room.x, midY - doorWidth / 2, tints.wall);
        this.buildWallLine(room.x, midY + doorWidth / 2, room.x, room.y + room.height, tints.wall);
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
      if (room.type === 'chamber' && biome !== 'gloomy_woods') {
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

  private buildWallLine(x1: number, y1: number, x2: number, y2: number, wallTint: number, textureKey: string = 'tile_wall_brick', disableTint: boolean = false) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / 32);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const wx = x1 + dx * t;
      const wy = y1 + dy * t;

      const wall = this.wallsGroup.create(wx, wy, textureKey);
      if (!disableTint) {
        wall.setTint(wallTint);
      }
      wall.setSize(32, 32);
      wall.setDepth(wy + 16);
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
