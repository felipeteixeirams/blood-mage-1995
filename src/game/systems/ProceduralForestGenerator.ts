import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { RoomData } from './DungeonGenerator';
import { logger } from '../../utils/logger';

/**
 * ProceduralForestGenerator — Gera uma floresta procedural isométrica
 * com árvores multi-camada, grama textualizada, sombras dinâmicas
 * e iluminação Light2D para o bioma gloomy_woods.
 *
 * Mantém compatibilidade com RoomData (portal system) e integra com
 * os sistemas existentes de lighting/shadows do Bloodmage.
 */
export class ProceduralForestGenerator {
  private scene: Phaser.Scene;
  private TILE_WIDTH = 64;
  private TILE_HEIGHT = 32;
  private CAMERA_OFFSET_X = 1600;
  private CAMERA_OFFSET_Y = 400;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    logger.info('ProceduralForestGenerator', 'Constructor called', { sceneKey: scene.sys.settings.key });
  }

  /**
   * Gera a floresta procedural. Retorna RoomData[] compatível com
   * o portal system (apenas uma "sala" que é toda a floresta).
   *
   * IMPORTANTE: `mapW`/`mapH` chegam aqui em PIXELS de mundo (ex.: 1920x1440,
   * ver GameScene.ts:228-229) — o mesmo contrato usado por
   * `DungeonGenerator.generate()`. Um bug anterior tratava esses valores
   * diretamente como contagem de células de grid isométrico, fazendo
   * `renderForestFloor` rodar ~2.76 MILHÕES de iterações (1920 * 1440),
   * cada uma criando um GameObject — o que travava a aba do navegador ao
   * entrar no portal (sem exceção, sem log — só um loop síncrono gigante
   * bloqueando a main thread). Convertendo pixels → células de grid aqui
   * (dividindo pelo tamanho do tile, mesmo padrão de
   * `DungeonGenerator.generate()` linhas 80-84) resolve isso.
   */
  public generate(mapW: number, mapH: number): RoomData[] {
    const gridW = Math.max(1, Math.floor(mapW / this.TILE_WIDTH));
    const gridH = Math.max(1, Math.floor(mapH / this.TILE_HEIGHT));

    logger.info('ProceduralForestGenerator.generate', 'Starting forest generation', { mapW, mapH, gridW, gridH });
    try {
      // Gerar texturas procedurais
      logger.info('ProceduralForestGenerator.generate', 'Generating procedural textures');
      this.generateProceduralTextures();
      logger.info('ProceduralForestGenerator.generate', 'Textures generated successfully');

      // Renderizar piso de grama
      logger.info('ProceduralForestGenerator.generate', 'Rendering forest floor');
      this.renderForestFloor(gridW, gridH);
      logger.info('ProceduralForestGenerator.generate', 'Forest floor rendered successfully');

      // Gerar e renderizar árvores
      logger.info('ProceduralForestGenerator.generate', 'Rendering trees');
      this.generateAndRenderTrees(gridW, gridH);
      logger.info('ProceduralForestGenerator.generate', 'Trees rendered successfully');

      // Sala de spawn no CENTRO do grid isométrico renderizado (não no centro
      // do retângulo mapW x mapH em pixels — são espaços de coordenadas
      // diferentes; usar mapW/2,mapH/2 diretamente faria o jogador nascer
      // fora da área onde o piso/árvores foram desenhados).
      const centerGridX = gridW / 2;
      const centerGridY = gridH / 2;
      const centerIsoX = this.CAMERA_OFFSET_X + (centerGridX - centerGridY) * (this.TILE_WIDTH / 2);
      const centerIsoY = this.CAMERA_OFFSET_Y + (centerGridX + centerGridY) * (this.TILE_HEIGHT / 2);

      const rooms: RoomData[] = [
        {
          x: centerIsoX - 200,
          y: centerIsoY - 200,
          width: 400,
          height: 400,
          centerX: centerIsoX,
          centerY: centerIsoY,
          type: 'spawn'
        }
      ];

      logger.info('ProceduralForestGenerator.generate', 'Forest generation complete', { rooms: rooms.length, centerIsoX, centerIsoY });
      return rooms;
    } catch (error) {
      logger.error('ProceduralForestGenerator.generate', 'Forest generation failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Gera texturas procedurais usando Phaser Canvas Texture API
   * (evita dependências externas, integra com Light2D pipeline)
   */
  private generateProceduralTextures(): void {
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Starting texture generation');

    // Grama com Dithering
    if (!this.scene.textures.exists('forest_grass')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_grass texture');
      let grassCanvas = this.scene.textures.createCanvas('forest_grass', 64, 32)!;
      let ctx = grassCanvas.context;

      // Degradê base
      let grad = ctx.createLinearGradient(0, 0, 0, 32);
      grad.addColorStop(0, '#a8d954');
      grad.addColorStop(0.5, '#8bc34a');
      grad.addColorStop(1, '#7cb342');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 32);

      // Dithering procedural (simula textura)
      for (let i = 0; i < 250; i++) {
        let x = Math.random() * 64;
        let y = Math.random() * 32;
        let colors = ['#9ccc65', '#8bc34a', '#7cb342', '#6fa237'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
      grassCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture created');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture already exists, skipping');
    }

    // Tronco de Árvore com Textura
    if (!this.scene.textures.exists('forest_trunk')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_trunk texture');
      let trunkCanvas = this.scene.textures.createCanvas('forest_trunk', 48, 120)!;
      let ctx = trunkCanvas.context;

      let trunkGrad = ctx.createLinearGradient(0, 0, 48, 0);
      trunkGrad.addColorStop(0, '#6d4c41');
      trunkGrad.addColorStop(0.5, '#5d4037');
      trunkGrad.addColorStop(1, '#4e342e');
      ctx.fillStyle = trunkGrad;
      ctx.fillRect(0, 0, 48, 120);

      // Casca com textura
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = Math.random() > 0.65 ? '#795548' : '#4e342e';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(Math.random() * 48, Math.random() * 120, Math.random() * 2 + 1, Math.random() * 3 + 1);
      }
      ctx.globalAlpha = 1;
      trunkCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture created');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture already exists, skipping');
    }

    // Folhagem - Camada 1 (Principal)
    if (!this.scene.textures.exists('forest_foliage_1')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_1 texture');
      let foliage1Canvas = this.scene.textures.createCanvas('forest_foliage_1', 140, 160)!;
      let ctx = foliage1Canvas.context;

      let foliageGrad1 = ctx.createRadialGradient(70, 70, 20, 70, 70, 80);
      foliageGrad1.addColorStop(0, '#9ccc65');
      foliageGrad1.addColorStop(0.6, '#7cb342');
      foliageGrad1.addColorStop(1, '#558b2f');
      ctx.fillStyle = foliageGrad1;
      ctx.beginPath();
      ctx.ellipse(70, 70, 65, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Detalhe de folhas
      for (let i = 0; i < 150; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#8bc34a' : '#558b2f';
        ctx.globalAlpha = 0.5;
        let x = 30 + Math.random() * 80;
        let y = 10 + Math.random() * 100;
        ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
      }
      ctx.globalAlpha = 1;
      foliage1Canvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture created');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture already exists, skipping');
    }

    // Folhagem - Camada 2 (Overlay para profundidade)
    if (!this.scene.textures.exists('forest_foliage_2')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_2 texture');
      let foliage2Canvas = this.scene.textures.createCanvas('forest_foliage_2', 100, 120)!;
      let ctx = foliage2Canvas.context;

      let foliageGrad2 = ctx.createRadialGradient(50, 50, 10, 50, 50, 60);
      foliageGrad2.addColorStop(0, '#a8d954');
      foliageGrad2.addColorStop(0.7, '#8bc34a');
      foliageGrad2.addColorStop(1, '#6fa237');
      ctx.fillStyle = foliageGrad2;
      ctx.beginPath();
      ctx.ellipse(50, 45, 50, 60, -0.3, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = '#9ccc65';
        ctx.globalAlpha = 0.4;
        let x = 15 + Math.random() * 70;
        let y = 10 + Math.random() * 80;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
      foliage2Canvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture created');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture already exists, skipping');
    }

    // Sombra (elipse)
    if (!this.scene.textures.exists('forest_shadow')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_shadow texture');
      let shadowCanvas = this.scene.textures.createCanvas('forest_shadow', 80, 24)!;
      let ctx = shadowCanvas.context;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(40, 12, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      shadowCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_shadow texture created');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_shadow texture already exists, skipping');
    }

    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'All procedural textures generated');
  }

  /**
   * Renderiza o piso de grama em projeção isométrica.
   * `gridW`/`gridH` são células de grid (já convertidas de pixels em
   * `generate()`), NÃO dimensões de mundo em pixels.
   */
  private renderForestFloor(gridW: number, gridH: number): void {
    const gameScene = this.scene as GameScene;
    logger.info('ProceduralForestGenerator.renderForestFloor', 'Starting floor rendering', { gridW, gridH, totalTiles: gridW * gridH });

    if (!gameScene.depthGroup) {
      logger.error('ProceduralForestGenerator.renderForestFloor', 'depthGroup is not available', {});
      throw new Error('GameScene.depthGroup is required for forest rendering');
    }

    let tilesAdded = 0;
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        try {
          const isoX = this.CAMERA_OFFSET_X + (x - y) * (this.TILE_WIDTH / 2);
          const isoY = this.CAMERA_OFFSET_Y + (x + y) * (this.TILE_HEIGHT / 2);

          let grass = gameScene.add.image(isoX, isoY, 'forest_grass');
          gameScene.lightingSystem?.applyLightPipeline(grass);
          grass.setDepth(isoY);
          gameScene.depthGroup.add(grass);
          tilesAdded++;
        } catch (e) {
          logger.error('ProceduralForestGenerator.renderForestFloor', 'Failed to add grass tile', { x, y, error: String(e) });
          throw e;
        }
      }
    }

    logger.info('ProceduralForestGenerator.renderForestFloor', 'Floor rendering complete', { tilesAdded });
  }

  /**
   * Gera árvores proceduralmente e as renderiza com multi-layer foliage
   * e sombras dinâmicas.
   * `gridW`/`gridH` são células de grid (já convertidas de pixels em
   * `generate()`), NÃO dimensões de mundo em pixels.
   */
  private generateAndRenderTrees(gridW: number, gridH: number): void {
    const gameScene = this.scene as GameScene;
    logger.info('ProceduralForestGenerator.generateAndRenderTrees', 'Starting tree generation');

    if (!gameScene.depthGroup) {
      logger.error('ProceduralForestGenerator.generateAndRenderTrees', 'depthGroup is not available', {});
      throw new Error('GameScene.depthGroup is required for tree rendering');
    }

    const trees: Array<{ x: number; y: number; variant: number }> = [];

    // Distribuição procedural de árvores (pseudo-aleatória mas determinística)
    // Clamp defensivo: com grids muito pequenos (gridW<=4 ou gridH<=2) o
    // módulo abaixo ficaria <=0 e travaria em erro de "Division by zero"/NaN.
    const xSpan = Math.max(1, gridW - 4);
    const ySpan = Math.max(1, gridH - 2);
    for (let i = 0; i < 24; i++) {
      trees.push({
        x: 2 + Math.floor(i * 1.3) % xSpan,
        y: 1 + Math.floor(i / 2.8) % ySpan,
        variant: Math.floor(Math.random() * 3)
      });
    }

    logger.info('ProceduralForestGenerator.generateAndRenderTrees', 'Tree positions generated', { treeCount: trees.length });

    // Renderizar cada árvore
    let treeIndex = 0;
    trees.forEach(tree => {
      try {
        treeIndex++;
      const isoX = this.CAMERA_OFFSET_X + (tree.x - tree.y) * (this.TILE_WIDTH / 2);
      const isoY = this.CAMERA_OFFSET_Y + (tree.x + tree.y) * (this.TILE_HEIGHT / 2);

      // Sombra dinâmica
      let shadow = gameScene.add.image(isoX + 10, isoY + 45, 'forest_shadow');
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(0.8 + tree.variant * 0.2);
      gameScene.lightingSystem?.applyLightPipeline(shadow);
      shadow.setDepth(isoY + 40);
      gameScene.depthGroup.add(shadow);

      // Tronco
      let trunk = gameScene.add.image(isoX, isoY + 35, 'forest_trunk');
      trunk.setOrigin(0.5, 1);
      trunk.setScale(0.7 + tree.variant * 0.15);
      gameScene.lightingSystem?.applyLightPipeline(trunk);
      trunk.setDepth(isoY + 35);
      gameScene.depthGroup.add(trunk);

      // Folhagem principal (camada 1)
      let foliage1 = gameScene.add.image(isoX, isoY - 25, 'forest_foliage_1');
      foliage1.setOrigin(0.5, 0.6);
      foliage1.setScale(0.8 + tree.variant * 0.2);
      gameScene.lightingSystem?.applyLightPipeline(foliage1);
      foliage1.setDepth(isoY - 20);
      gameScene.depthGroup.add(foliage1);

      // Folhagem overlay (camada 2, adiciona profundidade)
      let foliage2 = gameScene.add.image(isoX - 8, isoY - 35, 'forest_foliage_2');
      foliage2.setOrigin(0.5, 0.6);
      foliage2.setScale(0.7 + tree.variant * 0.15);
      foliage2.setAlpha(0.85);
      gameScene.lightingSystem?.applyLightPipeline(foliage2);
      foliage2.setDepth(isoY - 30);
      gameScene.depthGroup.add(foliage2);

        logger.info('ProceduralForestGenerator.generateAndRenderTrees', `Tree ${treeIndex} rendered`, { x: tree.x, y: tree.y, variant: tree.variant });
      } catch (e) {
        logger.error('ProceduralForestGenerator.generateAndRenderTrees', `Failed to render tree ${treeIndex}`, { tree, error: String(e) });
        throw e;
      }
    });

    logger.info('ProceduralForestGenerator.generateAndRenderTrees', 'All trees rendered successfully', { totalTrees: treeIndex });
  }
}
