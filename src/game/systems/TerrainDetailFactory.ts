import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { logger } from '../../utils/logger';
import type { HeightmapGenerator } from './HeightmapGenerator';

/**
 * TerrainDetailFactory — Gera pequenos tufos de grama selvagem e flora variada
 * (props de detalhe de terreno, 16x16 a 28x14) usando o padrão de baking do
 * Phaser 4.2.1 (DynamicTexture: assar uma vez via Graphics efêmero,
 * instanciar como Sprite/Image leve — ver skill `phaser-4-development`).
 */
export interface TerrainDetailOptions {
  /** Quantidade de tufos a espalhar. */
  count?: number;
  /** Largura da área de espalhamento, em pixels de mundo. */
  areaWidth: number;
  /** Altura da área de espalhamento, em pixels de mundo. */
  areaHeight: number;
  /** Canto superior-esquerdo da área de espalhamento (mundo, pixels). */
  originX?: number;
  originY?: number;
  /** Seed do ruído determinístico (mesmo seed = mesmo layout). */
  seed?: number;
  /** Heightmap opcional para ajuste de elevação Z e falésias. */
  heightGenerator?: HeightmapGenerator;
}

export class TerrainDetailFactory {
  private scene: Phaser.Scene;
  private noiseTable: number[] = [];

  private static readonly TUFT_TEX_KEY = 'terrain_grass_tuft';
  private static readonly TUFT_VARIANTS = 5;

  private static readonly BUSH_VARIANTS = 3;
  private static readonly MUSHROOM_VARIANTS = 3;
  private static readonly ROCK_VARIANTS = 3;
  private static readonly LOG_VARIANTS = 2;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initNoise();
  }

  /** Tabela de ruído pseudoaleatório determinística (mesmo padrão do ProceduralForestGenerator). */
  private initNoise(): void {
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
   * Assa todas as texturas de flora e adereços de terreno (DynamicTexture + Graphics efêmero).
   */
  public bakeAllFloraTextures(): void {
    this.bakeTuftTextures();
    this.bakeBushTextures();
    this.bakeMushroomTextures();
    this.bakeRockTextures();
    this.bakeLogTextures();
  }

  /** Assa as texturas dos tufos de grama. */
  public bakeTuftTextures(): void {
    for (let variant = 0; variant < TerrainDetailFactory.TUFT_VARIANTS; variant++) {
      const key = `${TerrainDetailFactory.TUFT_TEX_KEY}_${variant}`;
      this.bakeSingleTexture(key, 16, 16, (g) => this.drawTuftGraphics(g, 16, 400 + variant * 137));
    }

    logger.info('TerrainDetailFactory.bakeTuftTextures', 'Tufos de grama assados', {
      variants: TerrainDetailFactory.TUFT_VARIANTS,
    });
  }

  /** Assa arbustos/samambaias. */
  public bakeBushTextures(): void {
    for (let variant = 0; variant < TerrainDetailFactory.BUSH_VARIANTS; variant++) {
      const key = `terrain_bush_${variant}`;
      this.bakeSingleTexture(key, 24, 20, (g) => this.drawBushGraphics(g, 24, 20, 500 + variant * 149, variant));
    }
  }

  /** Assa cogumelos. */
  public bakeMushroomTextures(): void {
    for (let variant = 0; variant < TerrainDetailFactory.MUSHROOM_VARIANTS; variant++) {
      const key = `terrain_mushroom_${variant}`;
      this.bakeSingleTexture(key, 16, 16, (g) => this.drawMushroomGraphics(g, 16, 16, 600 + variant * 163, variant));
    }
  }

  /** Assa rochas com musgo. */
  public bakeRockTextures(): void {
    for (let variant = 0; variant < TerrainDetailFactory.ROCK_VARIANTS; variant++) {
      const key = `terrain_rock_${variant}`;
      this.bakeSingleTexture(key, 20, 16, (g) => this.drawRockGraphics(g, 20, 16, 700 + variant * 181, variant));
    }
  }

  /** Assa troncos caídos. */
  public bakeLogTextures(): void {
    for (let variant = 0; variant < TerrainDetailFactory.LOG_VARIANTS; variant++) {
      const key = `terrain_log_${variant}`;
      this.bakeSingleTexture(key, 28, 14, (g) => this.drawLogGraphics(g, 28, 14, 800 + variant * 197, variant));
    }
  }

  private bakeSingleTexture(key: string, width: number, height: number, drawFn: (g: Phaser.GameObjects.Graphics) => void): void {
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }

    const g = this.scene.add.graphics();
    drawFn(g);

    const textureManager = this.scene.textures as any;
    if (typeof textureManager.addDynamicTexture === 'function') {
      const tex = textureManager.addDynamicTexture(key, width, height);
      if (tex?.draw && tex?.render) {
        tex.draw(g);
        tex.render();
      }
    } else {
      this.scene.textures.createCanvas(key, width, height);
    }
    g.destroy();
  }

  /** Desenha um tufo de grama selvagem. */
  private drawTuftGraphics(graphics: Phaser.GameObjects.Graphics, size: number, seed: number): void {
    let rngState = seed;
    const pseudoRandom = (): number => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    const oliveColors = [0x3d4a1f, 0x4a5a26, 0x2e3817, 0x556b2f];
    const baseX = size / 2;
    const baseY = size - 2;

    graphics.fillStyle(0x0a0f05, 0.4);
    graphics.fillEllipse(baseX, baseY, size * 0.32, size * 0.12);

    const bladeCount = 4 + Math.floor(pseudoRandom() * 3);
    for (let b = 0; b < bladeCount; b++) {
      const angleSpread = bladeCount > 1 ? -0.9 + (b / (bladeCount - 1)) * 1.8 : 0;
      const angle = -Math.PI / 2 + angleSpread * 0.55 + (pseudoRandom() - 0.5) * 0.25;
      const bladeHeight = size * (0.55 + pseudoRandom() * 0.4);
      const bladeBaseX = baseX + (pseudoRandom() - 0.5) * 3;
      const color = oliveColors[Math.floor(pseudoRandom() * oliveColors.length) % oliveColors.length];

      const segments = 4;
      let curX = bladeBaseX;
      let curY = baseY;

      for (let s = 0; s < segments; s++) {
        const t0 = s / segments;
        const t1 = (s + 1) / segments;
        const thickness = Math.max(0.5, 2.2 * (1 - t0));
        const segLength = bladeHeight / segments;
        const sway = Math.sin(t1 * Math.PI * 0.5) * 1.5 * (b % 2 === 0 ? 1 : -1);
        const nextX = bladeBaseX + Math.cos(angle) * segLength * (s + 1) + sway;
        const nextY = baseY + Math.sin(angle) * segLength * (s + 1);

        graphics.lineStyle(thickness, color, 0.85 + pseudoRandom() * 0.15);
        graphics.beginPath();
        graphics.moveTo(curX, curY);
        graphics.lineTo(nextX, nextY);
        graphics.strokePath();

        curX = nextX;
        curY = nextY;
      }
    }
  }

  /** Desenha um arbusto/samambaia rico com sombra de contato e folhagem multicamada. */
  private drawBushGraphics(graphics: Phaser.GameObjects.Graphics, width: number, height: number, seed: number, variant: number): void {
    let rngState = seed;
    const pseudoRandom = (): number => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    const baseX = width / 2;
    const baseY = height - 2;

    graphics.fillStyle(0x0a0c08, 0.45);
    graphics.fillEllipse(baseX, baseY, width * 0.65, 5);

    const bushPalettes = [
      { base: 0x1e3822, mid: 0x2e5433, highlight: 0x4f8256, dark: 0x112114 },
      { base: 0x2e3817, mid: 0x4a5a26, highlight: 0x728a3c, dark: 0x18210c },
      { base: 0x4a2e12, mid: 0x73481d, highlight: 0x9c692d, dark: 0x2a1808 },
    ];
    const pal = bushPalettes[variant % bushPalettes.length];

    const clusterCount = 5 + Math.floor(pseudoRandom() * 3);
    for (let c = 0; c < clusterCount; c++) {
      const cx = baseX + (pseudoRandom() - 0.5) * (width * 0.5);
      const cy = baseY - 4 - pseudoRandom() * (height * 0.55);
      const rx = 4 + pseudoRandom() * 5;
      const ry = 3 + pseudoRandom() * 4;

      graphics.fillStyle(pal.dark, 0.9);
      graphics.fillEllipse(cx + 1, cy + 1, rx, ry);

      graphics.fillStyle(pal.mid, 0.95);
      graphics.fillEllipse(cx, cy, rx * 0.85, ry * 0.85);

      graphics.fillStyle(pal.highlight, 0.85);
      graphics.fillEllipse(cx - 1, cy - 1, rx * 0.45, ry * 0.45);
    }
  }

  /** Desenha cogumelos góticos detalhados com sombra e chapéu pontilhado. */
  private drawMushroomGraphics(graphics: Phaser.GameObjects.Graphics, width: number, height: number, seed: number, variant: number): void {
    const baseX = width / 2;
    const baseY = height - 2;

    graphics.fillStyle(0x0a0c08, 0.4);
    graphics.fillEllipse(baseX, baseY, 12, 4);

    const shroomPalettes = [
      { cap: 0xa82222, capLit: 0xd94141, spots: 0xf5e8c8 },
      { cap: 0xb5781d, capLit: 0xd99b38, spots: 0xfff4d6 },
      { cap: 0x5a2d68, capLit: 0x824494, spots: 0xe3cbf2 },
    ];
    const pal = shroomPalettes[variant % shroomPalettes.length];

    const stemX = baseX;
    const stemY = baseY - 6;

    graphics.fillStyle(0xd9cdb4, 1);
    graphics.fillRect(stemX - 1.5, stemY, 3, 6);

    graphics.fillStyle(pal.cap, 1);
    graphics.fillEllipse(baseX, stemY, 10, 6);

    graphics.fillStyle(pal.capLit, 0.9);
    graphics.fillEllipse(baseX - 1.5, stemY - 1, 6, 3);

    graphics.fillStyle(pal.spots, 0.9);
    graphics.fillRect(baseX - 3, stemY - 1, 1.5, 1.5);
    graphics.fillRect(baseX + 1.5, stemY - 0.5, 1.5, 1.5);
  }

  /** Desenha rocha pequena musgosa com contorno irregular e sombra. */
  private drawRockGraphics(graphics: Phaser.GameObjects.Graphics, width: number, height: number, seed: number, variant: number): void {
    const baseX = width / 2;
    const baseY = height - 2;

    graphics.fillStyle(0x0a0c08, 0.5);
    graphics.fillEllipse(baseX, baseY, 16, 5);

    graphics.fillStyle(0x383e45, 1);
    graphics.beginPath();
    graphics.moveTo(baseX - 7, baseY);
    graphics.lineTo(baseX - 8, baseY - 4);
    graphics.lineTo(baseX - 4, baseY - 9);
    graphics.lineTo(baseX + 3, baseY - 10);
    graphics.lineTo(baseX + 7, baseY - 5);
    graphics.lineTo(baseX + 6, baseY);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x5a636e, 1);
    graphics.beginPath();
    graphics.moveTo(baseX - 4, baseY - 9);
    graphics.lineTo(baseX + 3, baseY - 10);
    graphics.lineTo(baseX + 1, baseY - 5);
    graphics.lineTo(baseX - 3, baseY - 5);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x4d662b, 0.85);
    graphics.fillRect(baseX - 3, baseY - 9, 4, 2);
    graphics.fillRect(baseX + 1, baseY - 8, 3, 2);
  }

  /** Desenha tronco caído com textura de casca, anéis de madeira e sombra. */
  private drawLogGraphics(graphics: Phaser.GameObjects.Graphics, width: number, height: number, seed: number, variant: number): void {
    const baseX = width / 2;
    const baseY = height - 2;

    graphics.fillStyle(0x0a0c08, 0.5);
    graphics.fillEllipse(baseX, baseY, 24, 5);

    graphics.fillStyle(0x3e2723, 1);
    graphics.fillRect(baseX - 11, baseY - 6, 20, 6);

    graphics.fillStyle(0x5d4037, 1);
    graphics.fillRect(baseX - 11, baseY - 6, 20, 2);

    graphics.fillStyle(0x8d6e63, 1);
    graphics.fillEllipse(baseX + 9, baseY - 3, 3, 5);

    graphics.fillStyle(0x4e342e, 1);
    graphics.fillEllipse(baseX + 9, baseY - 3, 1.5, 2.5);

    graphics.fillStyle(0x4a5d23, 0.85);
    graphics.fillRect(baseX - 6, baseY - 6, 6, 2);
  }

  public scatterTufts(options: TerrainDetailOptions): Phaser.GameObjects.Image[] {
    return this.scatterRichFlora(options);
  }

  /**
   * Espalha flora variada (tufos, arbustos, cogumelos, rochas e troncos)
   * com suporte a relevo real Z, Y-sorting e colisão física estática em wallsGroup para rochas e troncos.
   */
  public scatterRichFlora(options: TerrainDetailOptions): Phaser.GameObjects.Image[] {
    const gameScene = this.scene as GameScene;

    if (!gameScene.depthGroup) {
      logger.error('TerrainDetailFactory.scatterRichFlora', 'depthGroup indisponível — Y-sorting exige GameScene.depthGroup', {});
      throw new Error('GameScene.depthGroup is required for terrain detail Y-sorting');
    }

    const {
      count = 120,
      areaWidth,
      areaHeight,
      originX = 0,
      originY = 0,
      seed = 777,
      heightGenerator,
    } = options;

    this.bakeAllFloraTextures();

    const floraItems: Phaser.GameObjects.Image[] = [];

    for (let i = 0; i < count; i++) {
      const nx = this.noise(i * 3.7, seed);
      const ny = this.noise(i * 3.7 + 11, seed + 50);

      const worldX = originX + nx * areaWidth;
      const worldY = originY + ny * areaHeight;

      let zElevation = 0;
      if (heightGenerator) {
        const gridX = Math.floor((worldX - originX) / 32);
        const gridY = Math.floor((worldY - originY) / 16);
        zElevation = heightGenerator.getHeightAt(Math.max(0, gridX), Math.max(0, gridY));
      }

      const renderY = worldY - zElevation * 2;

      const typeRoll = this.noise(i, seed + 90);
      let texKey = `${TerrainDetailFactory.TUFT_TEX_KEY}_${i % TerrainDetailFactory.TUFT_VARIANTS}`;
      let hasCollision = false;
      let bodyWidth = 14;
      let bodyHeight = 8;

      if (typeRoll > 0.85) {
        const v = i % TerrainDetailFactory.LOG_VARIANTS;
        texKey = `terrain_log_${v}`;
        hasCollision = true;
        bodyWidth = 22;
        bodyHeight = 8;
      } else if (typeRoll > 0.70) {
        const v = i % TerrainDetailFactory.ROCK_VARIANTS;
        texKey = `terrain_rock_${v}`;
        hasCollision = true;
        bodyWidth = 16;
        bodyHeight = 8;
      } else if (typeRoll > 0.50) {
        const v = i % TerrainDetailFactory.BUSH_VARIANTS;
        texKey = `terrain_bush_${v}`;
      } else if (typeRoll > 0.35) {
        const v = i % TerrainDetailFactory.MUSHROOM_VARIANTS;
        texKey = `terrain_mushroom_${v}`;
      }

      const prop = gameScene.add.image(worldX, renderY, texKey);
      prop.setOrigin(0.5, 1.0);

      const scaleVariety = 0.85 + this.noise(i, seed + 200) * 0.4;
      prop.setScale(scaleVariety);

      gameScene.lightingSystem?.applyLightPipeline(prop);
      prop.setDepth(renderY);
      gameScene.depthGroup.add(prop);

      if (!hasCollision) {
        this.applyWindSway(prop, seed + i * 13);
      } else if (gameScene.wallsGroup) {
        const wallTextureKey = gameScene.textures?.exists('tile_wall_brick') ? 'tile_wall_brick' : undefined;
        const obstacleWall = gameScene.wallsGroup.create(worldX, renderY - 2, wallTextureKey);
        if (obstacleWall) {
          if (typeof obstacleWall.setVisible === 'function') {
            obstacleWall.setVisible(false);
          }
          if (typeof obstacleWall.setSize === 'function') {
            obstacleWall.setSize(bodyWidth, bodyHeight);
          }
          if (typeof obstacleWall.refreshBody === 'function') {
            obstacleWall.refreshBody();
          }
        }
      }

      floraItems.push(prop);
    }

    logger.info('TerrainDetailFactory.scatterRichFlora', 'Vegetação rica espalhada', { count: floraItems.length });
    return floraItems;
  }

  private applyWindSway(tuft: Phaser.GameObjects.Image, phaseSeed: number): void {
    const gameScene = this.scene as any;
    if (typeof gameScene.tweens?.add !== 'function') return;

    const swayAngle = 0.035 + this.noise(phaseSeed, 900) * 0.035;
    const duration = 1400 + this.noise(phaseSeed, 901) * 900;
    const delay = this.noise(phaseSeed, 902) * duration;

    gameScene.tweens.add({
      targets: tuft,
      rotation: { from: -swayAngle, to: swayAngle },
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
