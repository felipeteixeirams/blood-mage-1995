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
   * Gera texturas procedurais usando Phaser Canvas Texture API com padrões de game art profissional.
   *
   * Baseado em análise de Stardew Valley + Grounded:
   * - Paleta limitada (3-5 cores por elemento) com propósito
   * - Dithering Bayer 2x2 (não aleatório) para textura suave
   * - Silhueta forte (reconhecível à primeira vista)
   * - Profundidade via sombreamento e escala estratégica
   */
  private generateProceduralTextures(): void {
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Starting texture generation (professional game art)');

    // ========== GRAMA com Bayer Dithering ==========
    if (!this.scene.textures.exists('forest_grass')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_grass texture');
      let grassCanvas = this.scene.textures.createCanvas('forest_grass', 64, 32)!;
      let ctx = grassCanvas.context;

      // Base: cor principal de grama
      const grassMain = this.hexToRgb('#9ccc65');
      const grassDark = this.hexToRgb('#7cb342');
      const grassDarker = this.hexToRgb('#5a8c38');

      // Preenchimento base (lighter)
      ctx.fillStyle = '#9ccc65';
      ctx.fillRect(0, 0, 64, 32);

      // Bayer dithering matrix 2x2 para textura natural
      // Padrão: [[0,2],[3,1]] * (255/4) ≈ [[0,128],[192,64]]
      const bayerMatrix = [[0, 2], [3, 1]];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
          const bayerVal = bayerMatrix[y % 2][x % 2];
          const threshold = (bayerVal / 4) * 255; // 0-255

          // Usar threshold para decidir cor (Stardew-style dithering)
          if (threshold < 85) {
            ctx.fillStyle = '#8bc34a'; // tom médio
            ctx.fillRect(x, y, 1, 1);
          } else if (threshold < 170) {
            ctx.fillStyle = '#7cb342'; // tom escuro
            ctx.fillRect(x, y, 1, 1);
          }
          // Resto deixa a cor base (#9ccc65)
        }
      }

      grassCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture created with Bayer dithering');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture already exists, skipping');
    }

    // ========== TRONCO com Silhueta Forte e Textura Sutil ==========
    if (!this.scene.textures.exists('forest_trunk')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_trunk texture');
      let trunkCanvas = this.scene.textures.createCanvas('forest_trunk', 32, 80)!;
      let ctx = trunkCanvas.context;

      // Base: cor principal de tronco (marrom médio) - REDUZIDO
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, 0, 32, 80);

      // Sombreamento lateral (mais escuro nos lados para profundidade)
      const leftGrad = ctx.createLinearGradient(0, 0, 16, 0);
      leftGrad.addColorStop(0, 'rgba(78, 52, 46, 0.3)'); // Mais escuro na esquerda
      leftGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, 16, 80);

      const rightGrad = ctx.createLinearGradient(16, 0, 32, 0);
      rightGrad.addColorStop(0, 'transparent');
      rightGrad.addColorStop(1, 'rgba(93, 64, 55, 0.2)'); // Levemente escuro na direita
      ctx.fillStyle = rightGrad;
      ctx.fillRect(16, 0, 16, 80);

      // Textura de casca com Bayer dithering (não aleatório)
      const barkBayer = [[0, 2], [3, 1]];
      for (let y = 0; y < 80; y++) {
        for (let x = 0; x < 32; x++) {
          const bayerVal = barkBayer[y % 2][x % 2];
          if (bayerVal === 3) {
            ctx.fillStyle = 'rgba(93, 64, 55, 0.5)'; // Mais escuro
            ctx.fillRect(x, y, 1, 1);
          } else if (bayerVal === 2) {
            ctx.fillStyle = 'rgba(121, 85, 72, 0.3)'; // Mais claro
            ctx.fillRect(x, y, 1, 1);
          }
          // Valores 0 e 1 deixam a cor base
        }
      }

      // Contorno escuro nas bordas (silhueta forte)
      ctx.strokeStyle = 'rgba(62, 39, 35, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 32, 80);

      trunkCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture created with strong silhouette');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture already exists, skipping');
    }

    // ========== FOLHAGEM - Camada 1 (Principal) com Profundidade ==========
    if (!this.scene.textures.exists('forest_foliage_1')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_1 texture');
      let foliage1Canvas = this.scene.textures.createCanvas('forest_foliage_1', 70, 80)!;
      let ctx = foliage1Canvas.context;

      // Cores de folhagem profissional (4 tons)
      const foliageLight = '#a8d954';   // Luz (topo)
      const foliageMid = '#8bc34a';     // Médio
      const foliageDark = '#7cb342';    // Escuro
      const foliageShadow = '#558b2f';  // Sombra (base)

      // Elipse radial: centro claro, borda escura (mais realista) - REDUZIDO pela metade
      let foliageGrad = ctx.createRadialGradient(35, 30, 8, 35, 40, 42);
      foliageGrad.addColorStop(0, foliageLight);   // Centro iluminado
      foliageGrad.addColorStop(0.4, foliageMid);
      foliageGrad.addColorStop(0.8, foliageDark);
      foliageGrad.addColorStop(1, foliageShadow);  // Borda na sombra
      ctx.fillStyle = foliageGrad;
      ctx.beginPath();
      ctx.ellipse(35, 35, 32, 40, -0.2, 0, Math.PI * 2); // Ângulo leve
      ctx.fill();

      // Contorno escuro (silhueta forte)
      ctx.strokeStyle = 'rgba(85, 139, 47, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(35, 35, 32, 40, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Detalhe de folhas com Bayer dithering (não aleatório)
      const leafBayer = [[0, 2], [3, 1]];
      for (let y = 5; y < 75; y++) {
        for (let x = 15; x < 55; x++) {
          const bayerVal = leafBayer[y % 2][x % 2];
          const inEllipse = this.isInEllipse(x, y, 35, 35, 32, 40, -0.2);

          if (inEllipse) {
            if (bayerVal === 3) {
              ctx.fillStyle = foliageShadow;
              ctx.fillRect(x, y, 1, 1);
            } else if (bayerVal === 2) {
              ctx.fillStyle = foliageDark;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }

      foliage1Canvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture created (70x80 - reduzido)');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture already exists, skipping');
    }

    // ========== FOLHAGEM - Camada 2 (Overlay para profundidade) ==========
    if (!this.scene.textures.exists('forest_foliage_2')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_2 texture');
      let foliage2Canvas = this.scene.textures.createCanvas('forest_foliage_2', 50, 60)!;
      let ctx = foliage2Canvas.context;

      const foliageLight2 = '#a8d954';
      const foliageMid2 = '#8bc34a';
      const foliageDark2 = '#7cb342';

      // Gradiente radial mais compacto (camada frontal) - REDUZIDO pela metade
      let foliageGrad2 = ctx.createRadialGradient(25, 22, 4, 25, 25, 29);
      foliageGrad2.addColorStop(0, foliageLight2);
      foliageGrad2.addColorStop(0.5, foliageMid2);
      foliageGrad2.addColorStop(1, foliageDark2);
      ctx.fillStyle = foliageGrad2;
      ctx.beginPath();
      ctx.ellipse(25, 22, 25, 30, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Contorno (silhueta)
      ctx.strokeStyle = 'rgba(122, 179, 66, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(25, 22, 25, 30, -0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Pontos de luz sugestivos (highlight para volume)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(18, 15, 4, 0, Math.PI * 2); // Topo esquerdo
      ctx.fill();

      foliage2Canvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture created (50x60 - reduzido)');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture already exists, skipping');
    }

    // ========== SOMBRA (consistente e profissional) ==========
    if (!this.scene.textures.exists('forest_shadow')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_shadow texture');
      let shadowCanvas = this.scene.textures.createCanvas('forest_shadow', 80, 24)!;
      let ctx = shadowCanvas.context;

      // Sombra com gradiente suave (mais escura no centro, desvance nas bordas)
      const shadowGrad = ctx.createRadialGradient(40, 12, 5, 40, 12, 40);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');   // Centro mais escuro
      shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');     // Borda desvance

      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(40, 12, 38, 10, 0, 0, Math.PI * 2); // Elipse alongada (realista)
      ctx.fill();

      shadowCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_shadow texture created with gradient');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_shadow texture already exists, skipping');
    }

    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'All procedural textures generated (professional quality)');
  }

  /**
   * Verifica se um ponto (x, y) está dentro de uma elipse rotacionada.
   * Usado para aplicar dithering apenas dentro da silhueta da folhagem.
   */
  private isInEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number, angle: number): boolean {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    const dx_rot = dx * cos + dy * sin;
    const dy_rot = -dx * sin + dy * cos;
    return (dx_rot * dx_rot) / (rx * rx) + (dy_rot * dy_rot) / (ry * ry) <= 1;
  }

  /**
   * Converte hex color string para RGB object.
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
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

      // Proporções realistas: escala controlada para coesão visual
      // Reduzido: texturas são metade do tamanho, então usamos 0.5-0.7 (não 0.75-1.05)
      const scaleBase = 0.50 + tree.variant * 0.1; // 0.50, 0.60, 0.70 max

      // Sombra dinâmica (consistente com tamanho da árvore)
      let shadow = gameScene.add.image(isoX + 10, isoY + 25, 'forest_shadow');
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(scaleBase * 0.9); // Sombra levemente menor
      gameScene.lightingSystem?.applyLightPipeline(shadow);
      shadow.setDepth(isoY - 5); // Depth menor que tronco
      gameScene.depthGroup.add(shadow);

      // Tronco (silhueta deve ser reconhecível)
      let trunk = gameScene.add.image(isoX, isoY + 20, 'forest_trunk');
      trunk.setOrigin(0.5, 1);
      trunk.setScale(scaleBase * 1.2); // Tronco um pouco maior
      gameScene.lightingSystem?.applyLightPipeline(trunk);
      trunk.setDepth(isoY); // Depth ajustado
      gameScene.depthGroup.add(trunk);

      // Folhagem principal (camada 1) - o mais importante visualmente
      let foliage1 = gameScene.add.image(isoX, isoY - 15, 'forest_foliage_1');
      foliage1.setOrigin(0.5, 0.6);
      foliage1.setScale(scaleBase * 1.3); // Folhagem um pouco maior que tronco
      gameScene.lightingSystem?.applyLightPipeline(foliage1);
      foliage1.setDepth(isoY + 5); // Depth maior que tronco (na frente)
      gameScene.depthGroup.add(foliage1);

      // Folhagem overlay (camada 2, adiciona profundidade profissional)
      let foliage2 = gameScene.add.image(isoX - 5, isoY - 25, 'forest_foliage_2');
      foliage2.setOrigin(0.5, 0.6);
      foliage2.setScale(scaleBase * 1.1); // Overlay com escala boa
      foliage2.setAlpha(0.85); // Levemente transparente
      gameScene.lightingSystem?.applyLightPipeline(foliage2);
      foliage2.setDepth(isoY + 10); // Depth máximo (muito na frente)
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
