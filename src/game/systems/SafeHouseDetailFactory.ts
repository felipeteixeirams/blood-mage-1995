import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { RoomData } from './DungeonGenerator';
import { logger } from '../../utils/logger';

export interface SafeHouseDetailOptions {
  count?: number;
  seed?: number;
}

/**
 * SafeHouseDetailFactory — Pre-bakes and scatters warm, cozy decorative ambient props
 * (woven tapestry rug, books & potion shelf, lit candle stand with warm glow,
 * dried herb bundles, storage barrels & crates, gothic wall banner) inside the Safe House hub.
 *
 * Uses Phaser dynamic texture baking pattern ("bake once, render millions").
 * All props use origin (0.5, 1.0) and are registered in `GameScene.depthGroup` for Y-sorting
 * and Light2D lighting pipeline application.
 */
export class SafeHouseDetailFactory {
  private scene: Phaser.Scene;
  private noiseTable: number[] = [];

  private static readonly KEYS = [
    'safehouse_detail_rug',
    'safehouse_detail_bookshelf',
    'safehouse_detail_candle',
    'safehouse_detail_herbs',
    'safehouse_detail_barrel_crates',
    'safehouse_detail_wall_banner',
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initNoise();
  }

  private initNoise(): void {
    this.noiseTable = [];
    for (let i = 0; i < 256; i++) {
      this.noiseTable[i] = Math.sin(i * 0.1337) * 0.5 + 0.5;
    }
  }

  private noise(x: number, y: number): number {
    const idx = (Math.floor(x) + Math.floor(y) * 57) & 255;
    return this.noiseTable[idx];
  }

  /**
   * Bakes all Safe House ambient detail textures into Phaser texture manager.
   */
  public bakeDetailTextures(): void {
    const keys = SafeHouseDetailFactory.KEYS;
    keys.forEach((key) => {
      if (typeof this.scene.textures?.remove === 'function' && this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }

      const size = 32;
      if (typeof this.scene.add?.graphics === 'function') {
        const g = this.scene.add.graphics();
        this.drawDetailGraphics(g, key, size);

        const textureManager = this.scene.textures as any;
        if (typeof textureManager.addDynamicTexture === 'function') {
          const tex = textureManager.addDynamicTexture(key, size, size);
          if (tex?.draw && tex?.render) {
            tex.draw(g);
            tex.render();
          }
        } else if (typeof this.scene.textures?.createCanvas === 'function') {
          // Fallback for headless/canvas environment
          this.scene.textures.createCanvas(key, size, size);
        }
        g.destroy();
      } else if (typeof this.scene.textures?.createCanvas === 'function') {
        this.scene.textures.createCanvas(key, size, size);
      }
    });

    logger.info('SafeHouseDetailFactory.bakeDetailTextures', 'Baked safe house detail textures', {
      totalKeys: keys.length,
    });
  }

  private drawDetailGraphics(g: Phaser.GameObjects.Graphics, key: string, size: number): void {
    const cx = size / 2;
    const cy = size / 2;

    switch (key) {
      case 'safehouse_detail_rug':
        // Woven Tapestry Rug (Crimson, Gold fringe, Warm Ochre pattern)
        g.fillStyle(0x7f1d1d, 0.9); // Crimson rug base
        g.fillRect(cx - 12, cy - 6, 24, 12);

        // Gold fringed border
        g.lineStyle(1, 0xd97706, 0.95);
        g.strokeRect(cx - 12, cy - 6, 24, 12);

        // Fringes on ends
        g.fillStyle(0xf59e0b, 1);
        for (let i = -12; i <= 12; i += 3) {
          g.fillRect(cx + i, cy - 8, 1, 2);
          g.fillRect(cx + i, cy + 6, 1, 2);
        }

        // Diamond center motif
        g.fillStyle(0xb45309, 0.9);
        g.fillRect(cx - 3, cy - 3, 6, 6);
        g.fillStyle(0xfef08a, 0.95);
        g.fillRect(cx - 1, cy - 1, 2, 2);
        break;

      case 'safehouse_detail_bookshelf':
        // Book & Potion Shelf (Dark Oak Wood, Colored Book Spines, Glowing Alchemical Vials)
        // Shadow base
        g.fillStyle(0x180e0a, 0.5);
        g.fillEllipse(cx, cy + 12, 20, 6);

        // Wooden Shelf structure
        g.fillStyle(0x3a2016, 0.95);
        g.fillRect(cx - 10, cy - 10, 20, 22);

        // Shelf divides
        g.fillStyle(0x22120b, 1);
        g.fillRect(cx - 10, cy - 2, 20, 2);
        g.fillRect(cx - 10, cy + 8, 20, 2);

        // Top Shelf Books (Crimson, Navy, Emerald, Ochre)
        g.fillStyle(0x991b1b, 0.95); // Crimson book
        g.fillRect(cx - 8, cy - 8, 3, 6);
        g.fillStyle(0x1e3a8a, 0.95); // Navy book
        g.fillRect(cx - 4, cy - 9, 3, 7);
        g.fillStyle(0x065f46, 0.95); // Emerald book
        g.fillRect(cx, cy - 7, 2, 5);
        g.fillStyle(0x92400e, 0.95); // Amber book
        g.fillRect(cx + 3, cy - 8, 4, 6);

        // Middle Shelf Potions (Red Ruby & Azure Glass Vials)
        g.fillStyle(0xef4444, 0.95); // Red Potion
        g.fillCircle(cx - 5, cy + 4, 2.5);
        g.fillStyle(0x3b82f6, 0.95); // Blue Potion
        g.fillCircle(cx + 4, cy + 4, 2.5);
        g.fillStyle(0xe0f2fe, 0.8);
        g.fillRect(cx - 5.5, cy + 1, 1, 2);
        g.fillRect(cx + 3.5, cy + 1, 1, 2);
        break;

      case 'safehouse_detail_candle':
        // Lit Candle Stand with Warm Ambient Flame Glow
        // Brass Candle Stand Base
        g.fillStyle(0x78350f, 0.9);
        g.fillEllipse(cx, cy + 8, 8, 3);
        g.fillRect(cx - 1, cy + 1, 2, 7);

        // White Wax Candle
        g.fillStyle(0xfef3c7, 0.95);
        g.fillRect(cx - 2, cy - 4, 4, 6);

        // Wick
        g.fillStyle(0x1c1917, 1);
        g.fillRect(cx - 0.5, cy - 6, 1, 2);

        // Candle Flame (Golden Yellow center, Orange outer, Warm Glow aura)
        g.fillStyle(0xfbbf24, 0.9);
        g.fillCircle(cx, cy - 8, 3);
        g.fillStyle(0xf97316, 0.95);
        g.fillCircle(cx, cy - 8, 1.5);

        // Soft Warm Glow Aura
        g.fillStyle(0xfef08a, 0.25);
        g.fillCircle(cx, cy - 8, 8);
        break;

      case 'safehouse_detail_herbs':
        // Hanging Dried Herb Bundles (Lavender, Sage Green, Thyme Brown)
        // Twine string hanging bar
        g.lineStyle(1, 0x78350f, 0.8);
        g.beginPath();
        g.moveTo(cx - 10, cy - 10);
        g.lineTo(cx + 10, cy - 10);
        g.strokePath();

        // Sage green herb bundle
        g.fillStyle(0x15803d, 0.9);
        g.fillTriangle(cx - 6, cy - 8, cx - 9, cy + 2, cx - 3, cy + 2);

        // Lavender purple herb bundle
        g.fillStyle(0x6b21a8, 0.9);
        g.fillTriangle(cx, cy - 8, cx - 3, cy + 4, cx + 3, cy + 4);

        // Thyme brown herb bundle
        g.fillStyle(0x854d0e, 0.9);
        g.fillTriangle(cx + 6, cy - 8, cx + 3, cy + 1, cx + 9, cy + 1);
        break;

      case 'safehouse_detail_barrel_crates':
        // Storage Barrel & Crates (Oak Barrel, Iron Hoops, Stacked Wooden Crate)
        // Shadow base
        g.fillStyle(0x180e0a, 0.5);
        g.fillEllipse(cx, cy + 10, 18, 5);

        // Oak Barrel (Right)
        g.fillStyle(0x451a03, 0.95);
        g.fillEllipse(cx + 4, cy + 2, 7, 9);

        // Barrel Iron Hoops
        g.lineStyle(1, 0x52525b, 0.9);
        g.strokeEllipse(cx + 4, cy - 2, 6.5, 2);
        g.strokeEllipse(cx + 4, cy + 6, 6.5, 2);

        // Wooden Crate (Left)
        g.fillStyle(0x3a2016, 0.95);
        g.fillRect(cx - 10, cy - 2, 9, 9);
        g.lineStyle(1, 0x22120b, 1);
        g.strokeRect(cx - 10, cy - 2, 9, 9);
        // Crate cross brace
        g.beginPath();
        g.moveTo(cx - 10, cy - 2);
        g.lineTo(cx - 1, cy + 7);
        g.strokePath();
        break;

      case 'safehouse_detail_wall_banner':
        // Gothic Wall Banner (Deep Velvet Crimson with Golden Crest Seal)
        // Brass hanging bar with finials
        g.fillStyle(0xd97706, 1);
        g.fillRect(cx - 9, cy - 12, 18, 2);
        g.fillCircle(cx - 9, cy - 11, 2);
        g.fillCircle(cx + 9, cy - 11, 2);

        // Velvet Crimson Banner body with swallowtail bottom cutout
        g.fillStyle(0x881337, 0.95);
        g.beginPath();
        g.moveTo(cx - 7, cy - 10);
        g.lineTo(cx + 7, cy - 10);
        g.lineTo(cx + 7, cy + 10);
        g.lineTo(cx, cy + 5); // Swallowtail V-cutout
        g.lineTo(cx - 7, cy + 10);
        g.closePath();
        g.fill();

        // Golden Crest Seal
        g.fillStyle(0xf59e0b, 0.9);
        g.fillCircle(cx, cy - 2, 3);
        g.fillStyle(0x78350f, 0.9);
        g.fillRect(cx - 1, cy - 3, 2, 2);
        break;
    }
  }

  /**
   * Scatters cozy ambient props inside the Safe House space.
   */
  public scatterDetails(room: RoomData, options: SafeHouseDetailOptions = {}): Phaser.GameObjects.Image[] {
    const gameScene = this.scene as GameScene;
    if (!gameScene.depthGroup) {
      return [];
    }

    const { seed = Math.floor(room.centerX + room.centerY) } = options;
    const props: Phaser.GameObjects.Image[] = [];

    const availableKeys = [
      'safehouse_detail_rug',
      'safehouse_detail_bookshelf',
      'safehouse_detail_candle',
      'safehouse_detail_herbs',
      'safehouse_detail_barrel_crates',
      'safehouse_detail_wall_banner',
    ];

    // Safe House has higher detail density (6 to 10 props scattered habitably)
    const propCount = 6 + Math.floor(this.noise(room.x, seed) * 5);

    for (let i = 0; i < propCount; i++) {
      const nx = this.noise(i * 4.1 + seed, room.x);
      const ny = this.noise(i * 3.3 + seed, room.y);

      // Keep within inner 85% of the room
      const px = room.x + 24 + nx * (room.width - 48);
      const py = room.y + 24 + ny * (room.height - 48);

      const keyIndex = Math.floor(this.noise(i, seed + 99) * availableKeys.length) % availableKeys.length;
      const texKey = availableKeys[keyIndex];

      if (!this.scene.textures.exists(texKey)) {
        continue;
      }

      const prop = this.scene.add.image(px, py, texKey);
      prop.setOrigin(0.5, 1.0);
      prop.setDepth(py);

      // Register in GameScene.depthGroup for Y-sorting
      gameScene.depthGroup.add(prop);

      // Apply Light2D pipeline if available
      if ((gameScene as any).lightingSystem) {
        (gameScene as any).lightingSystem.applyLightPipeline(prop);
      }

      props.push(prop);
    }

    logger.info('SafeHouseDetailFactory.scatterDetails', 'Scattered safe house ambient props', {
      count: props.length,
      roomId: `${room.x}_${room.y}`,
    });

    return props;
  }
}
