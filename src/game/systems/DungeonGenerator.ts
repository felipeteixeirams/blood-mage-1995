import Phaser from 'phaser';
import { BiomeType } from '../../types/game';

export interface RoomData {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  type: 'spawn' | 'chamber' | 'secret_treasure' | 'boss';
}

const BIOME_TINTS: Record<BiomeType, { ground: number; wall: number }> = {
  fosso_chagas: { ground: 0x86efac, wall: 0x15803d }, // Toxic Green tint
  catacumbas_martires: { ground: 0xcccccc, wall: 0x475569 }, // Cold Stone Brick
  santuario_sangue: { ground: 0xfca5a5, wall: 0x991b1b }, // Blood Obsidian Tint
};

export class DungeonGenerator {
  private scene: Phaser.Scene;
  private wallsGroup: Phaser.Physics.Arcade.StaticGroup;
  private chestsGroup: Phaser.Physics.Arcade.StaticGroup;
  private cachedLine = new Phaser.Geom.Line();
  private cachedRect = new Phaser.Geom.Rectangle();

  constructor(
    scene: Phaser.Scene,
    wallsGroup: Phaser.Physics.Arcade.StaticGroup,
    chestsGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene;
    this.wallsGroup = wallsGroup;
    this.chestsGroup = chestsGroup;
  }

  public generate(mapW: number, mapH: number, biome: BiomeType = 'fosso_chagas'): RoomData[] {
    const tints = BIOME_TINTS[biome] || BIOME_TINTS.fosso_chagas;

    // Fill Isometric Floor Tiles with Biome Tinting
    for (let x = 0; x < mapW; x += 48) {
      for (let y = 0; y < mapH; y += 24) {
        const tile = this.scene.add.image(x + (y % 48 === 0 ? 0 : 24), y, 'tile_ground');
        tile.setTint(tints.ground);
        tile.setDepth(1);
        (tile as any).setLighting?.(true);
      }
    }

    // Define 3x3 Room Grid Layout
    const rooms: RoomData[] = [];
    const cols = 3;
    const rows = 3;
    const roomW = 440;
    const roomH = 320;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rx = 100 + c * 580;
        const ry = 80 + r * 440;
        let type: 'spawn' | 'chamber' | 'secret_treasure' | 'boss' = 'chamber';

        if (r === 0 && c === 0) type = 'spawn';
        else if (r === 2 && c === 2) type = 'boss';
        else if (r === 0 && c === 2) type = 'secret_treasure';

        rooms.push({
          x: rx,
          y: ry,
          width: roomW,
          height: roomH,
          centerX: rx + roomW / 2,
          centerY: ry + roomH / 2,
          type,
        });
      }
    }

    // Outer Perimeter Walls
    this.buildWallLine(0, 0, mapW, 0, tints.wall); // Top
    this.buildWallLine(0, mapH - 32, mapW, mapH - 32, tints.wall); // Bottom
    this.buildWallLine(0, 0, 0, mapH, tints.wall); // Left
    this.buildWallLine(mapW - 32, 0, mapW - 32, mapH, tints.wall); // Right

    // Build Partition Walls around rooms with door openings
    rooms.forEach((room) => {
      const doorWidth = 80;

      // Top Wall
      if (room.y > 100) {
        const midX = room.centerX;
        this.buildWallLine(room.x, room.y, midX - doorWidth / 2, room.y, tints.wall);
        this.buildWallLine(midX + doorWidth / 2, room.y, room.x + room.width, room.y, tints.wall);
        this.scene.add.image(midX, room.y, 'tile_door').setDepth(2);
      }

      // Left Wall
      if (room.x > 120) {
        const midY = room.centerY;
        this.buildWallLine(room.x, room.y, room.x, midY - doorWidth / 2, tints.wall);
        this.buildWallLine(room.x, midY + doorWidth / 2, room.x, room.y + room.height, tints.wall);
        this.scene.add.image(room.x, midY, 'tile_door').setDepth(2);
      }

      // Special Room Features
      if (room.type === 'boss') {
        // Pentagram Ritual Decal on Floor
        this.scene.add.star(room.centerX, room.centerY, 5, 25, 55, 0xdc2626, 0.35).setDepth(2);
        this.scene.add.circle(room.centerX, room.centerY, 60).setStrokeStyle(3, 0xf43f5e, 0.8).setDepth(2);
      } else if (room.type === 'secret_treasure') {
        // Guarantee 2 chests in secret treasure room
        const chest1 = this.chestsGroup.create(room.centerX - 50, room.centerY, 'spr_chest');
        const chest2 = this.chestsGroup.create(room.centerX + 50, room.centerY, 'spr_chest');
        chest1.setDepth(room.centerY);
        chest2.setDepth(room.centerY);
      } else if (room.type !== 'spawn' && Math.random() < 0.65) {
        const chestX = room.x + 40 + Math.random() * (room.width - 80);
        const chestY = room.y + 40 + Math.random() * (room.height - 80);
        const chest = this.chestsGroup.create(chestX, chestY, 'spr_chest');
        chest.setDepth(chestY);
      }
    });

    return rooms;
  }

  private buildWallLine(x1: number, y1: number, x2: number, y2: number, wallTint: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / 32);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const wx = x1 + dx * t;
      const wy = y1 + dy * t;

      const wall = this.wallsGroup.create(wx, wy, 'tile_wall_brick');
      wall.setTint(wallTint);
      wall.setSize(32, 32);
      wall.setDepth(wy + 16);
      wall.refreshBody();
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
