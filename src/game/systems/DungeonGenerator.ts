import Phaser from 'phaser';

export interface RoomData {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  type: 'spawn' | 'chamber' | 'boss';
}

export class DungeonGenerator {
  private scene: Phaser.Scene;
  private wallsGroup: Phaser.Physics.Arcade.StaticGroup;
  private chestsGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    scene: Phaser.Scene,
    wallsGroup: Phaser.Physics.Arcade.StaticGroup,
    chestsGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene;
    this.wallsGroup = wallsGroup;
    this.chestsGroup = chestsGroup;
  }

  public generate(mapW: number, mapH: number): RoomData[] {
    // Fill Isometric Floor Tiles
    for (let x = 0; x < mapW; x += 48) {
      for (let y = 0; y < mapH; y += 24) {
        const tile = this.scene.add.image(x + (y % 48 === 0 ? 0 : 24), y, 'tile_ground');
        tile.setDepth(1);
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
        const type: 'spawn' | 'chamber' | 'boss' = r === 0 && c === 0 ? 'spawn' : r === 2 && c === 2 ? 'boss' : 'chamber';

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
    this.buildWallLine(0, 0, mapW, 0); // Top
    this.buildWallLine(0, mapH - 32, mapW, mapH - 32); // Bottom
    this.buildWallLine(0, 0, 0, mapH); // Left
    this.buildWallLine(mapW - 32, 0, mapW - 32, mapH); // Right

    // Build Partition Walls around rooms with door openings (passages)
    rooms.forEach((room) => {
      // Room perimeter walls with 80px door openings
      const doorWidth = 80;

      // Top Wall (with central doorway if connected)
      if (room.y > 100) {
        const midX = room.centerX;
        this.buildWallLine(room.x, room.y, midX - doorWidth / 2, room.y);
        this.buildWallLine(midX + doorWidth / 2, room.y, room.x + room.width, room.y);
        // Door visual arch
        this.scene.add.image(midX, room.y, 'tile_door').setDepth(2);
      }

      // Left Wall (with central doorway if connected)
      if (room.x > 120) {
        const midY = room.centerY;
        this.buildWallLine(room.x, room.y, room.x, midY - doorWidth / 2);
        this.buildWallLine(room.x, midY + doorWidth / 2, room.x, room.y + room.height);
        // Door visual arch
        this.scene.add.image(room.x, midY, 'tile_door').setDepth(2);
      }

      // Populate Chests in non-spawn rooms
      if (room.type !== 'spawn' && Math.random() < 0.65) {
        const chestX = room.x + 40 + Math.random() * (room.width - 80);
        const chestY = room.y + 40 + Math.random() * (room.height - 80);
        const chest = this.chestsGroup.create(chestX, chestY, 'spr_chest');
        chest.setDepth(chestY);
      }
    });

    return rooms;
  }

  private buildWallLine(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.ceil(dist / 32);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const wx = x1 + dx * t;
      const wy = y1 + dy * t;

      const wall = this.wallsGroup.create(wx, wy, 'tile_wall_brick');
      wall.setSize(32, 32);
      wall.setDepth(wy + 16);
      wall.refreshBody();
    }
  }

  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const line = new Phaser.Geom.Line(x1, y1, x2, y2);
    const wallChildren = this.wallsGroup.getChildren();

    for (let i = 0; i < wallChildren.length; i++) {
      const wall = wallChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (wall.active) {
        const rect = new Phaser.Geom.Rectangle(wall.x - 16, wall.y - 16, 32, 32);
        if (Phaser.Geom.Intersects.LineToRectangle(line, rect)) {
          return false; // Obstacle blocks line of sight!
        }
      }
    }
    return true; // Clear line of sight!
  }
}
