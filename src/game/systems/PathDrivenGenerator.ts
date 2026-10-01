import Phaser from 'phaser';
import type { RoomData } from './DungeonGenerator';
import { logger } from '../../utils/logger';
import { TerrainDetailFactory } from './TerrainDetailFactory';

export interface PathZone {
  x: number;
  y: number;
  radius: number;
  type: 'forest_trail' | 'lake' | 'ruins' | 'cave_entrance';
}

export interface PathDrivenResult {
  rooms: RoomData[];
  zones: PathZone[];
  waterTiles: Set<string>; // 'gridX,gridY' key for friction checks
}

export class PathDrivenGenerator {
  private scene: Phaser.Scene;
  private TILE_WIDTH = 64;
  private TILE_HEIGHT = 32;
  private CAMERA_OFFSET_X = 1600;
  private CAMERA_OFFSET_Y = 400;

  private static readonly GROUND_DEPTH = -1000;
  private noiseTable: number[] = [];

  public lastZones: PathZone[] = [];
  public waterTiles: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPerlinNoise();
    logger.info('PathDrivenGenerator', 'Constructor initialized', { sceneKey: scene?.sys?.settings?.key || 'unknown' });
  }

  private initPerlinNoise(): void {
    this.noiseTable = [];
    for (let i = 0; i < 256; i++) {
      this.noiseTable[i] = Math.sin(i * 0.1) * 0.5 + 0.5;
    }
  }

  private noise(x: number, y: number): number {
    const idx = (Math.floor(x) + Math.floor(y) * 73) & 255;
    return this.noiseTable[idx];
  }

  /**
   * Generates a continuous path-driven topology map.
   */
  public generate(mapW: number, mapH: number): PathDrivenResult {
    const gridW = Math.max(12, Math.floor(mapW / this.TILE_WIDTH));
    const gridH = Math.max(12, Math.floor(mapH / this.TILE_HEIGHT));

    logger.info('PathDrivenGenerator.generate', 'Starting path-driven generation', { mapW, mapH, gridW, gridH });

    this.waterTiles.clear();
    this.lastZones = [];

    // 1. Ensure procedural textures exist
    this.ensureTextures();

    // 2. Drunkard's Walk spine path generation
    const gridMap: boolean[][] = Array.from({ length: gridH }, () => Array(gridW).fill(false)); // true = walkable trail
    const zones: PathZone[] = [];
    const clearings: { gridX: number; gridY: number; radius: number; type: 'spawn' | 'chamber' | 'boss' | 'setpiece' }[] = [];

    // Start at South, walk North
    let currentX = Math.floor(gridW / 2);
    let currentY = gridH - 3;
    const endY = 2;

    // Spawn clearing
    clearings.push({ gridX: currentX, gridY: currentY, radius: 4, type: 'spawn' });

    let step = 0;
    while (currentY > endY) {
      step++;
      // Carve current trail position
      const width = (step % 5 === 0) ? 4 : (step % 3 === 0 ? 3 : 2);
      for (let dy = -width; dy <= width; dy++) {
        for (let dx = -width; dx <= width; dx++) {
          const gx = currentX + dx;
          const gy = currentY + dy;
          if (gx >= 1 && gx < gridW - 1 && gy >= 1 && gy < gridH - 1) {
            gridMap[gy][gx] = true;
          }
        }
      }

      // Record trail zone periodically
      if (step % 4 === 0) {
        const isoX = this.CAMERA_OFFSET_X + (currentX - currentY) * (this.TILE_WIDTH / 2);
        const isoY = this.CAMERA_OFFSET_Y + (currentX + currentY) * (this.TILE_HEIGHT / 2);
        zones.push({ x: isoX, y: isoY, radius: 120, type: 'forest_trail' });
      }

      // Add intermediate clearings
      if (step % 7 === 0 && currentY > endY + 4) {
        const radius = 5 + Math.floor(this.noise(step, 10) * 3);
        const isSetpiece = step === 14 || step === 21;
        clearings.push({
          gridX: currentX,
          gridY: currentY,
          radius,
          type: isSetpiece ? 'setpiece' : 'chamber',
        });
      }

      // Random Walk drift towards North
      const rand = this.noise(currentX, currentY);
      if (rand < 0.35 && currentX > 3) {
        currentX--;
      } else if (rand > 0.65 && currentX < gridW - 4) {
        currentX++;
      }
      currentY--;
    }

    // Boss clearing at the end of the trail
    clearings.push({ gridX: currentX, gridY: currentY, radius: 6, type: 'boss' });

    // Carve clearings into gridMap
    clearings.forEach((cl) => {
      for (let dy = -cl.radius; dy <= cl.radius; dy++) {
        for (let dx = -cl.radius; dx <= cl.radius; dx++) {
          if (dx * dx + dy * dy <= cl.radius * cl.radius) {
            const gx = cl.gridX + dx;
            const gy = cl.gridY + dy;
            if (gx >= 1 && gx < gridW - 1 && gy >= 1 && gy < gridH - 1) {
              gridMap[gy][gx] = true;
            }
          }
        }
      }
    });

    // 3. Render Floor (Walkable trail + Setpieces)
    this.renderFloor(gridW, gridH, gridMap);

    // 4. Inject Setpieces into setpiece clearings
    const rooms: RoomData[] = [];

    clearings.forEach((cl, idx) => {
      const isoX = this.CAMERA_OFFSET_X + (cl.gridX - cl.gridY) * (this.TILE_WIDTH / 2);
      const isoY = this.CAMERA_OFFSET_Y + (cl.gridX + cl.gridY) * (this.TILE_HEIGHT / 2);
      const roomW = cl.radius * this.TILE_WIDTH;
      const roomH = cl.radius * this.TILE_HEIGHT;

      let roomType: 'spawn' | 'chamber' | 'secret_treasure' | 'boss' = 'chamber';
      if (cl.type === 'spawn') roomType = 'spawn';
      else if (cl.type === 'boss') roomType = 'boss';
      else if (cl.type === 'setpiece' && idx === 2) roomType = 'secret_treasure';

      rooms.push({
        x: isoX - roomW / 2,
        y: isoY - roomH / 2,
        width: roomW,
        height: roomH,
        centerX: isoX,
        centerY: isoY,
        type: roomType,
      });

      if (cl.type === 'setpiece') {
        if (idx % 2 === 0) {
          this.injectCabin(cl.gridX, cl.gridY, zones);
        } else {
          this.injectLake(cl.gridX, cl.gridY, cl.radius - 1, zones);
        }
      } else if (cl.type === 'boss') {
        this.injectCaveEntrance(cl.gridX, cl.gridY, zones);
      }
    });

    // 5. Fill negative space (unwalkable tiles) with dense boundary obstacles & trees
    this.fillNegativeSpace(gridW, gridH, gridMap);

    this.lastZones = zones;

    logger.info('PathDrivenGenerator.generate', 'Path driven generation complete', {
      rooms: rooms.length,
      zones: zones.length,
      waterTiles: this.waterTiles.size,
    });

    return { rooms, zones, waterTiles: this.waterTiles };
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists('forest_grass')) {
      const grassCanvas = this.scene.textures.createCanvas('forest_grass', 64, 32)!;
      const ctx = grassCanvas.context;
      ctx.fillStyle = '#7cb342';
      ctx.fillRect(0, 0, 64, 32);
      grassCanvas.refresh();
    }

    if (!this.scene.textures.exists('tile_water')) {
      const waterCanvas = this.scene.textures.createCanvas('tile_water', 64, 32)!;
      const ctx = waterCanvas.context;
      const grad = ctx.createLinearGradient(0, 0, 64, 32);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(0.5, '#2563eb');
      grad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(10, 8, 20, 2);
      ctx.fillRect(35, 20, 16, 2);
      waterCanvas.refresh();
    }
  }

  private renderFloor(gridW: number, gridH: number, gridMap: boolean[][]): void {
    const gameScene = this.scene as any;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (gridMap[y][x]) {
          const isoX = this.CAMERA_OFFSET_X + (x - y) * (this.TILE_WIDTH / 2);
          const isoY = this.CAMERA_OFFSET_Y + (x + y) * (this.TILE_HEIGHT / 2);

          const grass = gameScene.add.image(isoX, isoY, 'forest_grass');
          grass.setDepth(PathDrivenGenerator.GROUND_DEPTH);
          if (gameScene.lightingSystem) {
            gameScene.lightingSystem.applyLightPipeline(grass);
          }
        }
      }
    }
  }

  /**
   * Setpiece 1: Cabana Isolada (4 walls, 1 door, 1 supply chest)
   */
  public injectCabin(gridX: number, gridY: number, zones: PathZone[]): void {
    const isoX = this.CAMERA_OFFSET_X + (gridX - gridY) * (this.TILE_WIDTH / 2);
    const isoY = this.CAMERA_OFFSET_Y + (gridX + gridY) * (this.TILE_HEIGHT / 2);

    zones.push({ x: isoX, y: isoY, radius: 100, type: 'ruins' });

    const gameScene = this.scene as any;
    const wallKey = gameScene.textures?.exists('tile_wood_wall') ? 'tile_wood_wall' : 'tile_wall_brick';
    const halfSize = 60;

    // Walls around cabin
    if (gameScene.wallsGroup) {
      // Top wall
      const w1 = gameScene.wallsGroup.create(isoX - halfSize, isoY - halfSize, wallKey);
      const w2 = gameScene.wallsGroup.create(isoX, isoY - halfSize, wallKey);
      const w3 = gameScene.wallsGroup.create(isoX + halfSize, isoY - halfSize, wallKey);

      // Bottom wall (with door gap)
      const w4 = gameScene.wallsGroup.create(isoX - halfSize, isoY + halfSize, wallKey);
      const w5 = gameScene.wallsGroup.create(isoX + halfSize, isoY + halfSize, wallKey);

      // Side walls
      const w6 = gameScene.wallsGroup.create(isoX - halfSize, isoY, wallKey);
      const w7 = gameScene.wallsGroup.create(isoX + halfSize, isoY, wallKey);

      [w1, w2, w3, w4, w5, w6, w7].forEach((w) => {
        if (w) {
          w.setSize(32, 32);
          w.setDepth(w.y + 16);
          w.refreshBody();
          if (gameScene.lightingSystem) gameScene.lightingSystem.applyLightPipeline(w);
        }
      });
    }

    // Door indicator
    const door = gameScene.add.image(isoX, isoY + halfSize, 'tile_door');
    door.setDepth(isoY + halfSize);

    // Chest inside cabin
    if (gameScene.chestsGroup) {
      const chestKey = gameScene.dungeonGenerator?.getChestTextureKey('south') || 'spr_chest';
      const chest = gameScene.chestsGroup.create(isoX, isoY - 15, chestKey);
      chest.setDepth(isoY - 15);
      if (gameScene.lightingSystem) gameScene.lightingSystem.applyLightPipeline(chest);
    }
  }

  /**
   * Setpiece 2: Lago Raso (Shallow water pool with speed reduction)
   */
  public injectLake(gridX: number, gridY: number, radius: number, zones: PathZone[]): void {
    const isoX = this.CAMERA_OFFSET_X + (gridX - gridY) * (this.TILE_WIDTH / 2);
    const isoY = this.CAMERA_OFFSET_Y + (gridX + gridY) * (this.TILE_HEIGHT / 2);

    zones.push({ x: isoX, y: isoY, radius: radius * 50, type: 'lake' });

    const gameScene = this.scene as any;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const gx = gridX + dx;
          const gy = gridY + dy;
          this.waterTiles.add(`${gx},${gy}`);

          const tileX = this.CAMERA_OFFSET_X + (gx - gy) * (this.TILE_WIDTH / 2);
          const tileY = this.CAMERA_OFFSET_Y + (gx + gy) * (this.TILE_HEIGHT / 2);

          const water = gameScene.add.image(tileX, tileY, 'tile_water');
          water.setAlpha(0.85);
          water.setDepth(PathDrivenGenerator.GROUND_DEPTH + 1);
          if (gameScene.lightingSystem) {
            gameScene.lightingSystem.applyLightPipeline(water);
          }
        }
      }
    }
  }

  /**
   * Setpiece 3: Entrada do Covil (Transition to stone/cave area)
   */
  public injectCaveEntrance(gridX: number, gridY: number, zones: PathZone[]): void {
    const isoX = this.CAMERA_OFFSET_X + (gridX - gridY) * (this.TILE_WIDTH / 2);
    const isoY = this.CAMERA_OFFSET_Y + (gridX + gridY) * (this.TILE_HEIGHT / 2);

    zones.push({ x: isoX, y: isoY, radius: 140, type: 'cave_entrance' });

    const gameScene = this.scene as any;
    const wallKey = gameScene.textures?.exists('tile_wall_brick') ? 'tile_wall_brick' : 'spr_wall';

    // Stone arc around cave entrance
    if (gameScene.wallsGroup) {
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue; // Gap for entrance
        const wx = isoX + i * 28;
        const wy = isoY - 60;
        const wall = gameScene.wallsGroup.create(wx, wy, wallKey);
        if (wall) {
          wall.setTint(0x475569);
          wall.setSize(32, 32);
          wall.setDepth(wy + 16);
          wall.refreshBody();
          if (gameScene.lightingSystem) gameScene.lightingSystem.applyLightPipeline(wall);
        }
      }
    }
  }

  /**
   * Fills negative space (uncarved grid tiles) with dense impassable obstacles & trees
   */
  private fillNegativeSpace(gridW: number, gridH: number, gridMap: boolean[][]): void {
    const gameScene = this.scene as any;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (!gridMap[y][x]) {
          const isoX = this.CAMERA_OFFSET_X + (x - y) * (this.TILE_WIDTH / 2);
          const isoY = this.CAMERA_OFFSET_Y + (x + y) * (this.TILE_HEIGHT / 2);

          // Create dense wall collider in negative space so player cannot walk outside
          if (gameScene.wallsGroup) {
            const wallKey = gameScene.textures?.exists('tile_wall_brick') ? 'tile_wall_brick' : 'spr_wall';
            const wall = gameScene.wallsGroup.create(isoX, isoY, wallKey);
            if (wall) {
              wall.setVisible(false); // Invisible barrier or dense forest wall
              wall.setSize(48, 24);
              wall.setDepth(isoY);
              wall.refreshBody();
            }
          }
        }
      }
    }
  }

  /**
   * Checks if world coordinates (x, y) fall on a water tile (Lago Raso friction)
   */
  public isWaterTileAt(worldX: number, worldY: number): boolean {
    const gx = Math.floor((worldX - this.CAMERA_OFFSET_X) / this.TILE_WIDTH + (worldY - this.CAMERA_OFFSET_Y) / this.TILE_HEIGHT);
    const gy = Math.floor((worldY - this.CAMERA_OFFSET_Y) / this.TILE_HEIGHT - (worldX - this.CAMERA_OFFSET_X) / this.TILE_WIDTH);
    return this.waterTiles.has(`${gx},${gy}`);
  }
}
