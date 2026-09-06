import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { RoomData } from './DungeonGenerator';
import type { BiomeType } from '../../types/game';
import { logger } from '../../utils/logger';

export interface DungeonDetailOptions {
  count?: number;
  seed?: number;
}

/**
 * DungeonDetailFactory — Pre-bakes and scatters biome-specific decorative props
 * (toxic slime, bone piles, blood pools, obsidian shards, etc.) inside dungeon rooms.
 *
 * Uses Phaser 4 dynamic texture baking pattern ("bake once, render millions").
 * All props use origin (0.5, 1.0) and are added to `GameScene.depthGroup` for Y-sorting
 * and Light2D lighting pipeline application.
 */
export class DungeonDetailFactory {
  private scene: Phaser.Scene;
  private noiseTable: number[] = [];

  private static readonly KEYS = [
    // Fosso Chagas (Toxic Sewers)
    'dungeon_detail_toxic_slime',
    'dungeon_detail_acid_crack',
    'dungeon_detail_glow_fungus',
    // Catacumbas dos Mártires (Cold Stone)
    'dungeon_detail_bone_pile',
    'dungeon_detail_cobweb_corner',
    'dungeon_detail_stone_rubble',
    // Santuário de Sangue (Blood Obsidian)
    'dungeon_detail_blood_pool_small',
    'dungeon_detail_obsidian_shard',
    'dungeon_detail_ritual_rune',
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
   * Bakes all biome detail textures into Phaser texture manager.
   */
  public bakeDetailTextures(): void {
    const keys = DungeonDetailFactory.KEYS;
    keys.forEach((key) => {
      if (typeof this.scene.textures?.remove === 'function' && this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }

      const size = 24;
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

    logger.info('DungeonDetailFactory.bakeDetailTextures', 'Baked dungeon detail textures', {
      totalKeys: keys.length,
    });
  }

  private drawDetailGraphics(g: Phaser.GameObjects.Graphics, key: string, size: number): void {
    const cx = size / 2;
    const cy = size / 2;

    switch (key) {
      case 'dungeon_detail_toxic_slime':
        // Viscous toxic slime puddle
        g.fillStyle(0x15803d, 0.85);
        g.fillEllipse(cx, cy + 2, 9, 5);
        g.fillStyle(0x22c55e, 0.95);
        g.fillEllipse(cx - 2, cy + 1, 6, 3.5);
        g.fillStyle(0x86efac, 0.9);
        g.fillCircle(cx - 3, cy, 1.5);
        g.fillCircle(cx + 2, cy + 2, 1);
        break;

      case 'dungeon_detail_acid_crack':
        // Corroded stone floor crack with glowing green ooze
        g.lineStyle(1.5, 0x14532d, 0.9);
        g.beginPath();
        g.moveTo(cx - 8, cy + 6);
        g.lineTo(cx - 2, cy);
        g.lineTo(cx + 3, cy + 4);
        g.lineTo(cx + 8, cy - 4);
        g.strokePath();

        g.fillStyle(0x4ade80, 0.8);
        g.fillCircle(cx - 2, cy, 2);
        g.fillCircle(cx + 3, cy + 4, 1.5);
        break;

      case 'dungeon_detail_glow_fungus':
        // Bioluminescent green fungus cluster
        g.fillStyle(0x064e3b, 0.8);
        g.fillEllipse(cx, cy + 6, 8, 3);

        g.fillStyle(0x10b981, 0.95);
        g.fillCircle(cx - 3, cy + 2, 3);
        g.fillCircle(cx + 2, cy, 3.5);
        g.fillCircle(cx + 4, cy + 3, 2);

        g.fillStyle(0xa7f3d0, 1);
        g.fillCircle(cx - 3, cy + 1, 1);
        g.fillCircle(cx + 2, cy - 1, 1);
        break;

      case 'dungeon_detail_bone_pile':
        // Skull and bone fragments
        g.fillStyle(0x1e293b, 0.5);
        g.fillEllipse(cx, cy + 5, 10, 4);

        g.fillStyle(0xd1d5db, 0.95);
        // Skull
        g.fillCircle(cx - 2, cy + 1, 3.5);
        g.fillStyle(0x111827, 0.9);
        g.fillRect(cx - 3, cy + 1, 1, 1);
        g.fillRect(cx - 1, cy + 1, 1, 1);

        // Bones
        g.fillStyle(0xe5e7eb, 0.9);
        g.fillRect(cx + 1, cy + 2, 6, 1.5);
        g.fillRect(cx - 6, cy + 3, 5, 1.5);
        break;

      case 'dungeon_detail_cobweb_corner':
        // Tattered spiderweb
        g.lineStyle(1, 0x94a3b8, 0.5);
        g.beginPath();
        g.moveTo(cx - 8, cy - 8);
        g.lineTo(cx + 8, cy + 8);
        g.moveTo(cx + 8, cy - 8);
        g.lineTo(cx - 8, cy + 8);
        g.strokePath();

        g.lineStyle(0.8, 0xcbd5e1, 0.4);
        g.strokeCircle(cx, cy, 4);
        g.strokeCircle(cx, cy, 7);
        break;

      case 'dungeon_detail_stone_rubble':
        // Chiseled dark stone fragments
        g.fillStyle(0x0f172a, 0.6);
        g.fillEllipse(cx, cy + 5, 10, 4);

        g.fillStyle(0x475569, 0.95);
        g.fillRect(cx - 5, cy + 1, 4, 3);
        g.fillRect(cx, cy - 1, 5, 4);
        g.fillRect(cx + 2, cy + 3, 3, 3);

        g.fillStyle(0x64748b, 0.9);
        g.fillRect(cx - 5, cy + 1, 4, 1);
        g.fillRect(cx, cy - 1, 5, 1);
        break;

      case 'dungeon_detail_blood_pool_small':
        // Small coagulated blood pool
        g.fillStyle(0x450a0a, 0.9);
        g.fillEllipse(cx, cy + 2, 8, 4.5);
        g.fillStyle(0x991b1b, 0.85);
        g.fillEllipse(cx - 1, cy + 1, 6, 3);
        g.fillStyle(0xfca5a5, 0.7);
        g.fillCircle(cx - 2, cy, 1);
        break;

      case 'dungeon_detail_obsidian_shard':
        // Jagged dark obsidian blood crystal shard
        g.fillStyle(0x18181b, 0.95);
        g.fillTriangle(cx - 4, cy + 6, cx + 4, cy + 6, cx, cy - 6);
        g.fillStyle(0xdc2626, 0.8);
        g.fillTriangle(cx - 2, cy + 5, cx + 2, cy + 5, cx, cy - 3);
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(cx - 1, cy - 1, 1, 3);
        break;

      case 'dungeon_detail_ritual_rune':
        // Faint crimson glowing rune sigil on floor
        g.lineStyle(1, 0xdc2626, 0.7);
        g.strokeCircle(cx, cy + 2, 6);
        g.lineStyle(0.8, 0xef4444, 0.8);
        g.beginPath();
        g.moveTo(cx - 4, cy + 2);
        g.lineTo(cx + 4, cy + 2);
        g.moveTo(cx, cy - 2);
        g.lineTo(cx, cy + 6);
        g.strokePath();
        break;
    }
  }

  /**
   * Scatters decorative props inside a room based on the biome type.
   */
  public scatterDetails(room: RoomData, biome: BiomeType, options: DungeonDetailOptions = {}): Phaser.GameObjects.Image[] {
    const gameScene = this.scene as GameScene;
    if (!gameScene.depthGroup) {
      return [];
    }

    const { seed = Math.floor(room.centerX + room.centerY) } = options;
    const props: Phaser.GameObjects.Image[] = [];

    let availableKeys: string[] = [];
    if (biome === 'fosso_chagas') {
      availableKeys = ['dungeon_detail_toxic_slime', 'dungeon_detail_acid_crack', 'dungeon_detail_glow_fungus'];
    } else if (biome === 'catacumbas_martires') {
      availableKeys = ['dungeon_detail_bone_pile', 'dungeon_detail_cobweb_corner', 'dungeon_detail_stone_rubble'];
    } else if (biome === 'santuario_sangue') {
      availableKeys = ['dungeon_detail_blood_pool_small', 'dungeon_detail_obsidian_shard', 'dungeon_detail_ritual_rune'];
    } else {
      availableKeys = ['dungeon_detail_stone_rubble', 'dungeon_detail_bone_pile'];
    }

    // 2 to 5 props per room
    const propCount = 2 + Math.floor(this.noise(room.x, seed) * 4);

    for (let i = 0; i < propCount; i++) {
      const nx = this.noise(i * 4.1 + seed, room.x);
      const ny = this.noise(i * 3.3 + seed, room.y);

      // Keep within inner 80% of the room
      const px = room.x + 30 + nx * (room.width - 60);
      const py = room.y + 30 + ny * (room.height - 60);

      const keyIndex = Math.floor(this.noise(i, seed + 99) * availableKeys.length) % availableKeys.length;
      const texKey = availableKeys[keyIndex];

      if (!this.scene.textures.exists(texKey)) {
        continue;
      }

      const prop = gameScene.add.image(px, py, texKey);
      prop.setOrigin(0.5, 1.0);

      const scale = 0.85 + this.noise(i, seed + 12) * 0.4;
      prop.setScale(scale);

      prop.setDepth(py);
      gameScene.depthGroup.add(prop);

      if ((gameScene as any).lightingSystem) {
        (gameScene as any).lightingSystem.applyLightPipeline(prop);
      }

      props.push(prop);
    }

    return props;
  }
}
