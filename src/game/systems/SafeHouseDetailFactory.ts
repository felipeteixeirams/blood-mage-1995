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

    // Clear background with transparency
    g.clear();

    switch (key) {
      case 'safehouse_detail_rug':
        // Woven Tapestry Rug com sombra e detalhes (Crimson, Gold fringe, Warm Ochre pattern)
        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(cx, cy + 8, 15, 4);

        // Rug base com gradiente simulado
        g.fillStyle(0x7f1d1d, 0.95); // Crimson escuro
        g.fillRect(cx - 12, cy - 6, 24, 12);

        // Padrão entretecido interno
        g.fillStyle(0x9f2e2e, 0.8); // Crimson mais claro
        g.fillRect(cx - 10, cy - 4, 3, 8);
        g.fillRect(cx + 7, cy - 4, 3, 8);

        // Gold fringed border (dupla linha para profundidade)
        g.lineStyle(1.5, 0xd97706, 0.95);
        g.strokeRect(cx - 12, cy - 6, 24, 12);
        g.lineStyle(0.5, 0x78350f, 0.7);
        g.strokeRect(cx - 11, cy - 5, 22, 10);

        // Fringes on ends (mais detalhado)
        g.fillStyle(0xf59e0b, 1);
        for (let i = -12; i <= 12; i += 3) {
          g.fillRect(cx + i, cy - 8, 1, 2);
          g.fillRect(cx + i, cy + 6, 1, 2);
        }

        // Diamond center motif (maior e mais ornado)
        g.fillStyle(0xb45309, 0.95);
        g.fillRect(cx - 3, cy - 3, 6, 6);
        g.fillStyle(0xfef08a, 1);
        g.fillCircle(cx, cy, 1.5);

        // Outros losangos menores nos cantos
        g.fillStyle(0xd97706, 0.6);
        g.fillRect(cx - 8, cy - 4, 2, 2);
        g.fillRect(cx + 6, cy + 2, 2, 2);
        break;

      case 'safehouse_detail_bookshelf':
        // Book & Potion Shelf com textura de madeira (Dark Oak Wood, Colored Book Spines, Glowing Alchemical Vials)
        // Shadow base
        g.fillStyle(0x180e0a, 0.6);
        g.fillEllipse(cx, cy + 12, 20, 6);

        // Wooden Shelf structure com textura
        g.fillStyle(0x3a2016, 0.95);
        g.fillRect(cx - 10, cy - 10, 20, 22);

        // Wood grain texture (linhas horizontais sutis)
        g.lineStyle(0.5, 0x22120b, 0.4);
        g.beginPath();
        g.moveTo(cx - 9, cy - 8);
        g.lineTo(cx + 9, cy - 8);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx - 9, cy);
        g.lineTo(cx + 9, cy);
        g.strokePath();

        // Shelf divides (maior e mais visível)
        g.fillStyle(0x1a0e08, 1);
        g.fillRect(cx - 10, cy - 2, 20, 2.5);
        g.fillRect(cx - 10, cy + 8, 20, 2.5);

        // Top Shelf Books (Crimson, Navy, Emerald, Ochre) com sombra
        g.fillStyle(0x4a0e0e, 0.6); // Shadow
        g.fillRect(cx - 8, cy - 7, 3, 7);
        g.fillStyle(0x991b1b, 1); // Crimson book
        g.fillRect(cx - 8, cy - 8, 3, 6);

        g.fillStyle(0x0f1f47, 0.6); // Shadow
        g.fillRect(cx - 4, cy - 8, 3, 8);
        g.fillStyle(0x1e3a8a, 1); // Navy book
        g.fillRect(cx - 4, cy - 9, 3, 7);

        g.fillStyle(0x032f1b, 0.6); // Shadow
        g.fillRect(cx, cy - 6, 2, 6);
        g.fillStyle(0x065f46, 1); // Emerald book
        g.fillRect(cx, cy - 7, 2, 5);

        g.fillStyle(0x4a2406, 0.6); // Shadow
        g.fillRect(cx + 3, cy - 7, 4, 7);
        g.fillStyle(0xb8860b, 1); // Amber book
        g.fillRect(cx + 3, cy - 8, 4, 6);

        // Middle Shelf Potions (Red Ruby & Azure Glass Vials) com mais brilho
        g.fillStyle(0x7a1a1a, 0.5); // Shadow
        g.fillCircle(cx - 5, cy + 5, 2.7);
        g.fillStyle(0xef4444, 1); // Red Potion
        g.fillCircle(cx - 5, cy + 4, 2.5);
        g.fillStyle(0xfca5a5, 0.8); // Highlight
        g.fillCircle(cx - 5.5, cy + 2.5, 0.8);

        g.fillStyle(0x1a3f6a, 0.5); // Shadow
        g.fillCircle(cx + 4, cy + 5, 2.7);
        g.fillStyle(0x3b82f6, 1); // Blue Potion
        g.fillCircle(cx + 4, cy + 4, 2.5);
        g.fillStyle(0x93c5fd, 0.8); // Highlight
        g.fillCircle(cx + 3.5, cy + 2.5, 0.8);

        // Glass vial shine
        g.fillStyle(0xfbfcfd, 0.6);
        g.fillRect(cx - 5.5, cy, 1, 2.5);
        g.fillRect(cx + 3.5, cy, 1, 2.5);
        break;

      case 'safehouse_detail_candle':
        // Lit Candle Stand with Warm Ambient Flame Glow (mais detalhado)
        // Shadow base
        g.fillStyle(0x000000, 0.25);
        g.fillEllipse(cx, cy + 10, 10, 3);

        // Brass Candle Stand Base com gradiente
        g.fillStyle(0x5a2a0a, 0.8); // Shadow bottom
        g.fillEllipse(cx, cy + 8.5, 8.5, 2);
        g.fillStyle(0x78350f, 1); // Main base
        g.fillEllipse(cx, cy + 8, 8, 2.5);
        g.fillStyle(0xa0522d, 0.6); // Highlight
        g.fillEllipse(cx, cy + 7, 6, 1);

        // Brass rod
        g.fillStyle(0x5a2a0a, 0.7); // Shadow
        g.fillRect(cx - 1.5, cy + 1, 3, 7.5);
        g.fillStyle(0x78350f, 1); // Main
        g.fillRect(cx - 1, cy + 1, 2, 7);
        g.fillStyle(0xa0522d, 0.5); // Highlight
        g.fillRect(cx - 0.5, cy + 2, 1, 5);

        // White Wax Candle com textura
        g.fillStyle(0xd4c9a0, 0.8); // Shadow
        g.fillRect(cx - 2.2, cy - 3.5, 4.4, 6.5);
        g.fillStyle(0xfef3c7, 1); // Main
        g.fillRect(cx - 2, cy - 4, 4, 6);
        g.fillStyle(0xfef9e7, 0.7); // Highlight (brilho)
        g.fillRect(cx - 1, cy - 3, 2, 4);

        // Wick com fumaça
        g.fillStyle(0x1c1917, 1);
        g.fillRect(cx - 0.5, cy - 6, 1, 2);
        // Fumaça fina (cinzento bem claro)
        g.fillStyle(0xd1d5db, 0.4);
        g.fillCircle(cx, cy - 7, 1);

        // Candle Flame (forma mais realista, amarela no centro, laranja/vermelho nas pontas)
        // Inner flame (mais quente/amarelo)
        g.fillStyle(0xfbbf24, 1);
        g.beginPath();
        g.moveTo(cx, cy - 11);
        g.lineTo(cx + 2, cy - 8);
        g.lineTo(cx - 2, cy - 8);
        g.closePath();
        g.fill();

        // Mid flame (laranja)
        g.fillStyle(0xf97316, 0.95);
        g.beginPath();
        g.moveTo(cx, cy - 8.5);
        g.lineTo(cx + 1.5, cy - 6);
        g.lineTo(cx - 1.5, cy - 6);
        g.closePath();
        g.fill();

        // Flame highlight (mais brilhante)
        g.fillStyle(0xfef08a, 0.8);
        g.fillCircle(cx, cy - 9, 0.8);

        // Soft Warm Glow Aura (múltiplas camadas para efeito suave)
        g.fillStyle(0xfef08a, 0.15);
        g.fillCircle(cx, cy - 8, 12);
        g.fillStyle(0xfbbf24, 0.08);
        g.fillCircle(cx, cy - 8, 16);
        break;

      case 'safehouse_detail_herbs':
        // Hanging Dried Herb Bundles com textura (Lavender, Sage Green, Thyme Brown)
        // Shadow base
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(cx, cy + 6, 20, 2);

        // Twine string hanging bar (corda mais realista)
        g.lineStyle(1.5, 0x5a2a0a, 0.9);
        g.beginPath();
        g.moveTo(cx - 10, cy - 10);
        g.lineTo(cx + 10, cy - 10);
        g.strokePath();
        g.lineStyle(0.5, 0xd4a574, 0.5);
        g.beginPath();
        g.moveTo(cx - 10, cy - 9.5);
        g.lineTo(cx + 10, cy - 9.5);
        g.strokePath();

        // Sage green herb bundle (mais detalhado)
        g.fillStyle(0x0d4620, 0.8); // Shadow
        g.fillTriangle(cx - 6.2, cy - 7.5, cx - 9.2, cy + 2.5, cx - 2.8, cy + 2.5);
        g.fillStyle(0x15803d, 1); // Main
        g.fillTriangle(cx - 6, cy - 8, cx - 9, cy + 2, cx - 3, cy + 2);
        // Herb detail lines
        g.lineStyle(0.5, 0x0d4620, 0.6);
        g.beginPath();
        g.moveTo(cx - 7.5, cy - 4);
        g.lineTo(cx - 6, cy + 1);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx - 4.5, cy - 4);
        g.lineTo(cx - 6, cy + 1);
        g.strokePath();

        // Lavender purple herb bundle
        g.fillStyle(0x3f0f5e, 0.8); // Shadow
        g.fillTriangle(cx - 0.2, cy - 7.5, cx - 3.2, cy + 4.5, cx + 3.2, cy + 4.5);
        g.fillStyle(0x6b21a8, 1); // Main
        g.fillTriangle(cx, cy - 8, cx - 3, cy + 4, cx + 3, cy + 4);
        // Herb detail lines
        g.lineStyle(0.5, 0x3f0f5e, 0.6);
        g.beginPath();
        g.moveTo(cx - 1, cy - 4);
        g.lineTo(cx, cy + 2);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx + 1, cy - 4);
        g.lineTo(cx, cy + 2);
        g.strokePath();

        // Thyme brown herb bundle
        g.fillStyle(0x4a2606, 0.8); // Shadow
        g.fillTriangle(cx + 6.2, cy - 7.5, cx + 3.2, cy + 1.5, cx + 9.2, cy + 1.5);
        g.fillStyle(0x92400e, 1); // Main
        g.fillTriangle(cx + 6, cy - 8, cx + 3, cy + 1, cx + 9, cy + 1);
        // Herb detail lines
        g.lineStyle(0.5, 0x4a2606, 0.6);
        g.beginPath();
        g.moveTo(cx + 4.5, cy - 4);
        g.lineTo(cx + 6, cy - 0.5);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx + 7.5, cy - 4);
        g.lineTo(cx + 6, cy - 0.5);
        g.strokePath();
        break;

      case 'safehouse_detail_barrel_crates':
        // Storage Barrel & Crates com textura (Oak Barrel, Iron Hoops, Stacked Wooden Crate)
        // Shadow base
        g.fillStyle(0x180e0a, 0.6);
        g.fillEllipse(cx, cy + 10, 20, 6);

        // Oak Barrel (Right) com textura de madeira
        g.fillStyle(0x2a0f01, 0.7); // Shadow
        g.fillEllipse(cx + 4, cy + 2.5, 7.5, 9.5);
        g.fillStyle(0x451a03, 1); // Main
        g.fillEllipse(cx + 4, cy + 2, 7, 9);

        // Barrel wood grain
        g.lineStyle(0.5, 0x22120b, 0.3);
        g.beginPath();
        g.moveTo(cx - 2, cy - 5);
        g.lineTo(cx + 10, cy + 5);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx + 2, cy - 5);
        g.lineTo(cx + 12, cy + 5);
        g.strokePath();

        // Barrel Iron Hoops (mais visível e realista)
        g.lineStyle(1.5, 0x374151, 1);
        g.strokeEllipse(cx + 4, cy - 2, 6.5, 2);
        g.lineStyle(1.5, 0x52525b, 0.8);
        g.strokeEllipse(cx + 4, cy - 1.5, 6, 1.8);
        g.lineStyle(1.5, 0x374151, 1);
        g.strokeEllipse(cx + 4, cy + 6, 6.5, 2);
        g.lineStyle(1.5, 0x52525b, 0.8);
        g.strokeEllipse(cx + 4, cy + 6.5, 6, 1.8);

        // Wooden Crate (Left) com mais detalhes
        g.fillStyle(0x2a1810, 0.8); // Shadow
        g.fillRect(cx - 10.5, cy - 2.5, 9.5, 9.5);
        g.fillStyle(0x3a2016, 1); // Main
        g.fillRect(cx - 10, cy - 2, 9, 9);

        // Crate wood planks (linhas verticais e horizontais)
        g.lineStyle(1, 0x22120b, 0.8);
        g.strokeRect(cx - 10, cy - 2, 9, 9);
        g.beginPath();
        g.moveTo(cx - 7, cy - 2);
        g.lineTo(cx - 7, cy + 7);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx - 4, cy - 2);
        g.lineTo(cx - 4, cy + 7);
        g.strokePath();

        // Crate cross brace (X pattern)
        g.beginPath();
        g.moveTo(cx - 10, cy - 2);
        g.lineTo(cx - 1, cy + 7);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx - 1, cy - 2);
        g.lineTo(cx - 10, cy + 7);
        g.strokePath();
        break;

      case 'safehouse_detail_wall_banner':
        // Gothic Wall Banner com textura (Deep Velvet Crimson with Golden Crest Seal)
        // Brass hanging bar with finials (mais realista)
        g.fillStyle(0x78350f, 0.8); // Shadow
        g.fillRect(cx - 9, cy - 11.5, 18, 2.5);
        g.fillStyle(0xd97706, 1); // Main
        g.fillRect(cx - 9, cy - 12, 18, 2);
        g.fillStyle(0xf59e0b, 0.6); // Highlight
        g.fillRect(cx - 9, cy - 12.5, 18, 0.8);

        // Brass finials (decorações nas pontas)
        g.fillStyle(0x78350f, 0.8);
        g.fillCircle(cx - 9, cy - 11, 2.2);
        g.fillCircle(cx + 9, cy - 11, 2.2);
        g.fillStyle(0xd97706, 1);
        g.fillCircle(cx - 9, cy - 11, 2);
        g.fillCircle(cx + 9, cy - 11, 2);
        g.fillStyle(0xf59e0b, 0.6);
        g.fillCircle(cx - 9, cy - 11.5, 0.8);
        g.fillCircle(cx + 9, cy - 11.5, 0.8);

        // Velvet Crimson Banner body with swallowtail bottom cutout
        g.fillStyle(0x581c1d, 0.8); // Shadow inner
        g.beginPath();
        g.moveTo(cx - 7.2, cy - 9.5);
        g.lineTo(cx + 7.2, cy - 9.5);
        g.lineTo(cx + 7.2, cy + 10.5);
        g.lineTo(cx, cy + 5.5);
        g.lineTo(cx - 7.2, cy + 10.5);
        g.closePath();
        g.fill();

        g.fillStyle(0x881337, 1); // Main banner
        g.beginPath();
        g.moveTo(cx - 7, cy - 10);
        g.lineTo(cx + 7, cy - 10);
        g.lineTo(cx + 7, cy + 10);
        g.lineTo(cx, cy + 5);
        g.lineTo(cx - 7, cy + 10);
        g.closePath();
        g.fill();

        // Banner texture/pattern (padrão em losango sutil)
        g.fillStyle(0xc0042f, 0.3);
        g.fillRect(cx - 2, cy - 5, 1, 6);
        g.fillRect(cx + 1, cy - 5, 1, 6);

        // Golden Crest Seal (maior e mais ornado)
        g.fillStyle(0x78350f, 0.8); // Shadow
        g.fillCircle(cx, cy - 1, 3.3);
        g.fillStyle(0xd97706, 0.9); // Base
        g.fillCircle(cx, cy - 2, 3.2);
        g.fillStyle(0xf59e0b, 1); // Main
        g.fillCircle(cx, cy - 2, 3);

        // Crest symbol (cruz simplificada)
        g.fillStyle(0x78350f, 1);
        g.fillRect(cx - 1, cy - 5, 2, 2);
        g.fillRect(cx - 1, cy + 1, 2, 2);
        g.fillRect(cx - 2, cy - 2, 4, 2);

        // Crest highlight
        g.fillStyle(0xfef3c7, 0.6);
        g.fillCircle(cx - 1, cy - 3.5, 0.6);
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

    // Safe House has high detail density (10 to 16 props scattered habitably for cozy atmosphere)
    const propCount = 10 + Math.floor(this.noise(room.x, seed) * 7);

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
