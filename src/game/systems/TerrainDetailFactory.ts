import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { logger } from '../../utils/logger';

/**
 * TerrainDetailFactory — Gera pequenos tufos de grama selvagem isolados
 * (props de detalhe de terreno, 16x16) usando o padrão de baking do
 * Phaser 4.2.1 (DynamicTexture: assar uma vez via Graphics efêmero,
 * instanciar como Sprite/Image leve — ver skill `phaser-4-development`).
 *
 * Diferente do piso de grama (`forest_grass`, uma textura plana 64x32 sem
 * recorte de silhueta — cobre toda a área do tile), os tufos aqui são
 * pequenos props VERTICAIS com origem na base (0.5, 1.0) e silhueta fina
 * o suficiente para participar corretamente do Y-Sorting sem "engolir" o
 * personagem: eles são adicionados a `GameScene.depthGroup`, cujo loop de
 * update (`ISO Y-SORTING DEPTH SYSTEM`, `GameScene.ts` ~L1303) recalcula
 * `depth = y` a cada frame para todo membro do grupo — o mesmo mecanismo
 * que ordena o personagem, os inimigos e as árvores.
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
}

export class TerrainDetailFactory {
  private scene: Phaser.Scene;
  private noiseTable: number[] = [];

  private static readonly TUFT_TEX_KEY = 'terrain_grass_tuft';
  private static readonly TUFT_VARIANTS = 3;
  private static readonly TILE_SIZE = 16;

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
   * Assa as texturas dos tufos de grama (Phaser 4 baking pattern:
   * `DynamicTexture` + `Graphics` efêmero — "bake once, render millions",
   * ver skill `phaser-4-development` §2). Gera `TUFT_VARIANTS` variações
   * para quebrar a repetição visual ao espalhar em massa.
   */
  public bakeTuftTextures(): void {
    for (let variant = 0; variant < TerrainDetailFactory.TUFT_VARIANTS; variant++) {
      const key = `${TerrainDetailFactory.TUFT_TEX_KEY}_${variant}`;
      if (this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }

      const size = TerrainDetailFactory.TILE_SIZE;
      const g = this.scene.add.graphics();
      this.drawTuftGraphics(g, size, 400 + variant * 137);

      const textureManager = this.scene.textures as any;
      if (typeof textureManager.addDynamicTexture === 'function') {
        const tex = textureManager.addDynamicTexture(key, size, size);
        if (tex?.draw && tex?.render) {
          tex.draw(g);
          tex.render();
        }
      } else {
        // Fallback defensivo (headless/Canvas sem WebGL2 real, ex.: testes):
        // garante que o slot de textura existe para não quebrar `add.image`.
        this.scene.textures.createCanvas(key, size, size);
      }
      g.destroy();
    }

    logger.info('TerrainDetailFactory.bakeTuftTextures', 'Tufos de grama assados (DynamicTexture)', {
      variants: TerrainDetailFactory.TUFT_VARIANTS,
    });
  }

  /**
   * Desenha um tufo de grama selvagem: lâminas pontiagudas isoladas,
   * puramente vetoriais (`Graphics.lineStyle`, sem preenchimento), com
   * espessura afunilando da base (mais grossa) até a ponta (fina) e
   * paleta verde-oliva escuro.
   */
  private drawTuftGraphics(graphics: Phaser.GameObjects.Graphics, size: number, seed: number): void {
    let rngState = seed;
    const pseudoRandom = (): number => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    const oliveColors = [0x3d4a1f, 0x4a5a26, 0x2e3817, 0x556b2f];
    const baseX = size / 2;
    const baseY = size - 2;

    const bladeCount = 4 + Math.floor(pseudoRandom() * 3); // 4-6 lâminas isoladas
    for (let b = 0; b < bladeCount; b++) {
      const angleSpread = bladeCount > 1 ? -0.9 + (b / (bladeCount - 1)) * 1.8 : 0; // leque em torno da base
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
        const thickness = Math.max(0.5, 2.2 * (1 - t0)); // afunila em direção à ponta
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

  /**
   * Espalha tufos de grama pela área usando um filtro matemático
   * semi-aleatório (ruído determinístico por posição/seed — não
   * `Math.random()` puro, para que o mesmo seed sempre reproduza o
   * mesmo layout).
   *
   * Y-Sorting real: cada tufo é adicionado a `GameScene.depthGroup`, cujo
   * `ISO Y-SORTING DEPTH SYSTEM` (loop de `update()`) recalcula
   * `depth = y` a cada frame — o personagem passa corretamente por trás
   * ou na frente de cada tufo conforme a posição vertical relativa.
   */
  public scatterTufts(options: TerrainDetailOptions): Phaser.GameObjects.Image[] {
    const gameScene = this.scene as GameScene;

    if (!gameScene.depthGroup) {
      logger.error('TerrainDetailFactory.scatterTufts', 'depthGroup indisponível — Y-sorting exige GameScene.depthGroup', {});
      throw new Error('GameScene.depthGroup is required for terrain detail Y-sorting');
    }

    const {
      count = 60,
      areaWidth,
      areaHeight,
      originX = 0,
      originY = 0,
      seed = 777,
    } = options;

    const tufts: Phaser.GameObjects.Image[] = [];

    for (let i = 0; i < count; i++) {
      const nx = this.noise(i * 3.7, seed);
      const ny = this.noise(i * 3.7 + 11, seed + 50);

      const x = originX + nx * areaWidth;
      const y = originY + ny * areaHeight;

      const variant = Math.floor(this.noise(i, seed + 100) * TerrainDetailFactory.TUFT_VARIANTS) % TerrainDetailFactory.TUFT_VARIANTS;
      const texKey = `${TerrainDetailFactory.TUFT_TEX_KEY}_${variant}`;

      const tuft = gameScene.add.image(x, y, texKey);
      // Origem na base (0.5, 1.0): o tufo "nasce" do solo em vez de ficar
      // centralizado no tile — mantém a silhueta vertical mínima acima do
      // próprio ponto de plantio, essencial pro Y-sort não invadir o
      // personagem (ver bug do piso de grama plano, sem este cuidado).
      tuft.setOrigin(0.5, 1);

      const scaleVariety = 0.85 + this.noise(i, seed + 200) * 0.5;
      tuft.setScale(scaleVariety);

      gameScene.lightingSystem?.applyLightPipeline(tuft);

      tuft.setDepth(y); // recalculado por frame pelo ISO Y-SORTING DEPTH SYSTEM
      gameScene.depthGroup.add(tuft);

      tufts.push(tuft);
    }

    logger.info('TerrainDetailFactory.scatterTufts', 'Tufos de grama espalhados', { count: tufts.length });
    return tufts;
  }
}
