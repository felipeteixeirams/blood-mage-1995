import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { RoomData } from './DungeonGenerator';
import { logger } from '../../utils/logger';
import { createAtmosphericTree } from '../shaders/AtmosphericTreeShader';
import { TerrainDetailFactory } from './TerrainDetailFactory';

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

  // Depth fixo para o piso (grama + manchas de luz) — deliberadamente FORA
  // do `depthGroup`/Y-sort: são planos, sem altura real, então nunca devem
  // competir de profundidade com objetos verticais (personagem, árvores,
  // tufos). Bem abaixo de qualquer depth Y-sorted (que começa em
  // CAMERA_OFFSET_Y = 400+), garante que o piso fica sempre atrás.
  private static readonly GROUND_DEPTH = -1000;

  // Perlin noise (simplified)
  private noiseTable: number[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPerlinNoise();
    logger.info('ProceduralForestGenerator', 'Constructor called', { sceneKey: scene.sys.settings.key });
  }

  /**
   * Inicializa tabela simples de ruído pseudoaleatório (Perlin-like)
   * para gerar textura natural nas superfícies procedurais
   */
  private initPerlinNoise(): void {
    this.noiseTable = [];
    for (let i = 0; i < 256; i++) {
      this.noiseTable[i] = Math.sin(i * 0.1) * 0.5 + 0.5; // Value entre 0-1
    }
  }

  /**
   * Lookup simples de ruído
   */
  private noise(x: number, y: number): number {
    const idx = (Math.floor(x) + Math.floor(y) * 73) & 255;
    return this.noiseTable[idx];
  }

  /**
   * Perturbar uma cor via ruído
   */
  private perturbColor(hex: string, noiseFactor: number): string {
    const rgb = this.hexToRgb(hex);
    const noise = (Math.random() - 0.5) * noiseFactor;
    const r = Math.max(0, Math.min(255, Math.floor(rgb.r + noise)));
    const g = Math.max(0, Math.min(255, Math.floor(rgb.g + noise)));
    const b = Math.max(0, Math.min(255, Math.floor(rgb.b + noise)));
    return `rgb(${r}, ${g}, ${b})`;
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

      // Renderizar piso de grama (com luz solar filtrada pela copa)
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

    // Remover texturas antigas (pode haver versão anterior em cache)
    // para evitar conflitos de tamanho durante recreation
    const textureNames = ['forest_grass', 'forest_trunk', 'forest_foliage_1', 'forest_foliage_2', 'forest_shadow'];
    textureNames.forEach(name => {
      if (this.scene.textures.exists(name)) {
        this.scene.textures.remove(name);
        logger.info('ProceduralForestGenerator.generateProceduralTextures', `Removed old texture: ${name}`);
      }
    });

    // ========== GRAMA com Profundidade e Múltiplos Padrões ==========
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_grass texture (profissional)');
    let grassCanvas = this.scene.textures.createCanvas('forest_grass', 64, 32)!;
    let grassCtx = grassCanvas.context;

    // Cores profissionais de grama
    const grassLight = '#a4d65e';    // Luz (frente)
    const grassMain = '#9ccc65';     // Principal
    const grassMid = '#8bc34a';      // Médio
    const grassDark = '#7cb342';     // Escuro
    const grassShadow = '#5a8c38';   // Sombra (profundidade)

    // Gradiente horizontal para profundidade (frente mais clara, trás mais escura)
    const grassGrad = grassCtx.createLinearGradient(0, 0, 0, 32);
    grassGrad.addColorStop(0, grassLight);    // Topo mais claro
    grassGrad.addColorStop(0.4, grassMain);
    grassGrad.addColorStop(0.8, grassMid);
    grassGrad.addColorStop(1, grassShadow);   // Base mais escura
    grassCtx.fillStyle = grassGrad;
    grassCtx.fillRect(0, 0, 64, 32);

    // PADRÃO 1: Bayer dithering com variação via noise
    const grassBayer = [[0, 2], [3, 1]];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        const bayerVal = grassBayer[y % 2][x % 2];
        const noiseVal = this.noise(x * 0.3, y * 0.2);
        const threshold = (bayerVal / 4) * 255;

        if ((threshold < 85 || (threshold < 170 && noiseVal > 0.6)) && noiseVal > 0.3) {
          grassCtx.fillStyle = `rgba(${100 + Math.floor(noiseVal * 30)}, ${130 + Math.floor(noiseVal * 20)}, ${40}, ${0.3 + noiseVal * 0.2})`;
          grassCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    // PADRÃO 2: Fios de grama individual (profissionalismo)
    grassCtx.strokeStyle = 'rgba(90, 110, 30, 0.4)';
    grassCtx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
      const x = this.noise(i, 50) * 64;
      const startY = 5 + this.noise(i, 51) * 10;
      const endY = startY + 8 + this.noise(i, 52) * 8;
      grassCtx.beginPath();
      grassCtx.moveTo(x, startY);
      grassCtx.lineTo(x + (this.noise(i, 53) - 0.5) * 4, endY);
      grassCtx.stroke();
    }

    // PADRÃO 3: Sombras pequenas para textura (sujeira, depressões)
    grassCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let i = 0; i < 12; i++) {
      const x = this.noise(i * 3, 100) * 64;
      const y = this.noise(i * 3, 101) * 32;
      const size = 1 + this.noise(i, 102) * 2;
      grassCtx.beginPath();
      grassCtx.ellipse(x, y, size, size * 0.5, 0, 0, Math.PI * 2);
      grassCtx.fill();
    }

    grassCanvas.refresh();
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture created (64x32 - profissional com gradiente e fios)');

    // ========== TRONCO com Silhueta Forte e Textura Profissional ==========
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_trunk texture (PROFISSIONAL)');
    let trunkCanvas = this.scene.textures.createCanvas('forest_trunk', 64, 140)!;
    let trunkCtx = trunkCanvas.context;

    // Base: cor principal de tronco (marrom médio)
    trunkCtx.fillStyle = '#6d4c41';
    trunkCtx.fillRect(0, 0, 64, 140);

    // Sombreamento lateral com gradiente suave (profundidade 3D)
    const leftGrad = trunkCtx.createLinearGradient(0, 0, 30, 0);
    leftGrad.addColorStop(0, 'rgba(50, 30, 20, 0.4)'); // Muito escuro na borda
    leftGrad.addColorStop(0.5, 'rgba(90, 65, 55, 0.2)');
    leftGrad.addColorStop(1, 'transparent');
    trunkCtx.fillStyle = leftGrad;
    trunkCtx.fillRect(0, 0, 30, 140);

    const rightGrad = trunkCtx.createLinearGradient(34, 0, 64, 0);
    rightGrad.addColorStop(0, 'transparent');
    rightGrad.addColorStop(0.5, 'rgba(100, 70, 60, 0.15)');
    rightGrad.addColorStop(1, 'rgba(130, 85, 70, 0.25)'); // Borda clara com profundidade
    trunkCtx.fillStyle = rightGrad;
    trunkCtx.fillRect(34, 0, 30, 140);

    // Textura de casca PROFISSIONAL com múltiplos padrões
    const barkBayer = [[0, 2], [3, 1]];

    // Padrão 1: Linhas verticais de casca (rachaduras naturais)
    for (let y = 0; y < 140; y++) {
      for (let x = 0; x < 64; x++) {
        const noise = this.noise(x * 0.3, y * 0.1) * 0.3;
        if (x % 8 < 2 + noise * 4) {
          trunkCtx.fillStyle = `rgba(50, 30, 20, ${0.15 + noise * 0.2})`; // Sombra em linhas
          trunkCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Padrão 2: Dithering Bayer para textura natural
    for (let y = 0; y < 140; y++) {
      for (let x = 0; x < 64; x++) {
        const bayerVal = barkBayer[y % 2][x % 2];
        const noiseVal = this.noise(x * 0.5, y * 0.5);

        if (bayerVal === 3 || (bayerVal === 2 && noiseVal > 0.7)) {
          trunkCtx.fillStyle = `rgba(${100 + Math.floor(noiseVal * 30)}, ${60 + Math.floor(noiseVal * 20)}, ${50 + Math.floor(noiseVal * 20)}, 0.4)`;
          trunkCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Padrão 3: Highlights sugestivos (musgo ou luz)
    trunkCtx.fillStyle = 'rgba(200, 200, 150, 0.08)';
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(this.noise(i, 0) * 64);
      const y = Math.floor(this.noise(i, 1) * 140);
      trunkCtx.beginPath();
      trunkCtx.arc(x, y, 2 + this.noise(i, 2) * 2, 0, Math.PI * 2);
      trunkCtx.fill();
    }

    // Contorno escuro nas bordas (silhueta forte - AUMENTADO)
    trunkCtx.strokeStyle = 'rgba(40, 25, 15, 0.8)';
    trunkCtx.lineWidth = 2;
    trunkCtx.strokeRect(0, 0, 64, 140);

    trunkCanvas.refresh();
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture created with strong silhouette');

    // ========== FOLHAGEM - Camada 1 (Principal) PROFISSIONAL ==========
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_1 texture (PROFISSIONAL)');
    let foliage1Canvas = this.scene.textures.createCanvas('forest_foliage_1', 160, 180)!;
    let foliage1Ctx = foliage1Canvas.context;

    // Cores de folhagem profissional (5 tons para melhor gradação)
    const foliageLight = '#b8dd6b';   // Luz (topo) - mais brilhante
    const foliageMid = '#8bc34a';     // Médio
    const foliageDark = '#7cb342';    // Escuro
    const foliageShadow = '#558b2f';  // Sombra (base)
    const foliageMossGreen = '#6b9d3b'; // Musgo/tom mais frio

    // Base com gradiente radial duplo (mais profissional)
    let foliageGrad = foliage1Ctx.createRadialGradient(80, 60, 20, 80, 90, 90);
    foliageGrad.addColorStop(0, foliageLight);    // Centro iluminado (20% mais claro)
    foliageGrad.addColorStop(0.3, foliageMid);
    foliageGrad.addColorStop(0.65, foliageDark);
    foliageGrad.addColorStop(1, foliageShadow);   // Borda na sombra
    foliage1Ctx.fillStyle = foliageGrad;
    foliage1Ctx.beginPath();
    foliage1Ctx.ellipse(80, 70, 70, 85, -0.2, 0, Math.PI * 2);
    foliage1Ctx.fill();

    // Camada de sombra secundária (profundidade)
    let shadowGrad = foliage1Ctx.createRadialGradient(85, 100, 10, 80, 100, 95);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    foliage1Ctx.fillStyle = shadowGrad;
    foliage1Ctx.beginPath();
    foliage1Ctx.ellipse(80, 100, 75, 50, 0, 0, Math.PI * 2);
    foliage1Ctx.fill();

    // Contorno escuro (silhueta forte - AUMENTADO)
    foliage1Ctx.strokeStyle = 'rgba(60, 100, 40, 0.7)';
    foliage1Ctx.lineWidth = 2;
    foliage1Ctx.beginPath();
    foliage1Ctx.ellipse(80, 70, 70, 85, -0.2, 0, Math.PI * 2);
    foliage1Ctx.stroke();

    // PADRÃO 1: Detalhe de folhas com Bayer dithering
    const foliage1Bayer = [[0, 2], [3, 1]];
    for (let y = 10; y < 170; y++) {
      for (let x = 30; x < 130; x++) {
        const bayerVal = foliage1Bayer[y % 2][x % 2];
        const inEllipse = this.isInEllipse(x, y, 80, 70, 70, 85, -0.2);
        const noiseVal = this.noise(x * 0.2, y * 0.2);

        if (inEllipse) {
          if (bayerVal === 3 || noiseVal > 0.8) {
            foliage1Ctx.fillStyle = foliageShadow;
            foliage1Ctx.globalAlpha = 0.6 + noiseVal * 0.2;
            foliage1Ctx.fillRect(x, y, 1, 1);
            foliage1Ctx.globalAlpha = 1;
          } else if (bayerVal === 2 && noiseVal > 0.6) {
            foliage1Ctx.fillStyle = foliageDark;
            foliage1Ctx.globalAlpha = 0.4;
            foliage1Ctx.fillRect(x, y, 1, 1);
            foliage1Ctx.globalAlpha = 1;
          }
        }
      }
    }

    // PADRÃO 2: Pontos de folhas individuais (mais detalhamento)
    foliage1Ctx.fillStyle = 'rgba(100, 130, 50, 0.35)';
    for (let i = 0; i < 30; i++) {
      const x = 30 + this.noise(i * 7, 0) * 100;
      const y = 10 + this.noise(i * 7, 1) * 160;
      const size = 1 + this.noise(i, 2) * 1.5;
      foliage1Ctx.beginPath();
      foliage1Ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
      foliage1Ctx.fill();
    }

    // PADRÃO 3: Highlights sugestivos (luz penetrando folhas)
    foliage1Ctx.fillStyle = 'rgba(255, 255, 180, 0.12)';
    for (let i = 0; i < 12; i++) {
      const x = 40 + this.noise(i, 100) * 80;
      const y = 20 + this.noise(i, 101) * 120;
      const radius = 3 + this.noise(i, 102) * 5;
      foliage1Ctx.beginPath();
      foliage1Ctx.arc(x, y, radius, 0, Math.PI * 2);
      foliage1Ctx.fill();
    }

    foliage1Canvas.refresh();
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture created (160x180 - profissional)');

    // ========== FOLHAGEM - Camada 2 (Overlay profissional) ==========
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_2 texture (overlay)');
    let foliage2Canvas = this.scene.textures.createCanvas('forest_foliage_2', 120, 140)!;
    let foliage2Ctx = foliage2Canvas.context;

    const foliageLight2 = '#b8dd6b';
    const foliageMid2 = '#8bc34a';
    const foliageDark2 = '#7cb342';

    // Gradiente radial profissional (camada frontal overlay)
    let foliageGrad2 = foliage2Ctx.createRadialGradient(60, 50, 12, 60, 70, 65);
    foliageGrad2.addColorStop(0, foliageLight2);
    foliageGrad2.addColorStop(0.4, foliageMid2);
    foliageGrad2.addColorStop(0.8, foliageDark2);
    foliageGrad2.addColorStop(1, 'rgba(60, 100, 40, 0.9)');
    foliage2Ctx.fillStyle = foliageGrad2;
    foliage2Ctx.beginPath();
    foliage2Ctx.ellipse(60, 60, 55, 70, -0.3, 0, Math.PI * 2);
    foliage2Ctx.fill();

    // Contorno forte (silhueta mais visível)
    foliage2Ctx.strokeStyle = 'rgba(60, 100, 40, 0.8)';
    foliage2Ctx.lineWidth = 2;
    foliage2Ctx.beginPath();
    foliage2Ctx.ellipse(60, 60, 55, 70, -0.3, 0, Math.PI * 2);
    foliage2Ctx.stroke();

    // PADRÃO 1: Dithering para textura
    const foliage2Bayer = [[0, 2], [3, 1]];
    for (let y = 10; y < 130; y++) {
      for (let x = 20; x < 100; x++) {
        const bayerVal = foliage2Bayer[y % 2][x % 2];
        const inEllipse = this.isInEllipse(x, y, 60, 60, 55, 70, -0.3);
        const noiseVal = this.noise(x * 0.3, y * 0.3);

        if (inEllipse && bayerVal === 3 && noiseVal > 0.6) {
          foliage2Ctx.fillStyle = `rgba(${60 + Math.floor(noiseVal * 40)}, ${100 + Math.floor(noiseVal * 30)}, ${40 + Math.floor(noiseVal * 10)}, 0.5)`;
          foliage2Ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // PADRÃO 2: Pontos de folhas (mais denso que Layer 1)
    foliage2Ctx.fillStyle = 'rgba(100, 130, 50, 0.4)';
    for (let i = 0; i < 40; i++) {
      const x = 25 + this.noise(i * 5, 200) * 70;
      const y = 15 + this.noise(i * 5, 201) * 110;
      const size = 1.5 + this.noise(i, 202) * 1;
      foliage2Ctx.beginPath();
      foliage2Ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
      foliage2Ctx.fill();
    }

    // PADRÃO 3: Highlights principais (luz forte)
    foliage2Ctx.fillStyle = 'rgba(255, 255, 200, 0.18)';
    for (let i = 0; i < 15; i++) {
      const x = 35 + this.noise(i, 300) * 50;
      const y = 20 + this.noise(i, 301) * 80;
      const radius = 4 + this.noise(i, 302) * 6;
      foliage2Ctx.beginPath();
      foliage2Ctx.arc(x, y, radius, 0, Math.PI * 2);
      foliage2Ctx.fill();
    }

    foliage2Canvas.refresh();
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture created (120x140 - overlay profissional)');

    // ========== SOMBRA Profissional com Gradientes Múltiplos ==========
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_shadow texture (profissional)');
    let shadowCanvas = this.scene.textures.createCanvas('forest_shadow', 100, 32)!;
    let shadowCtx = shadowCanvas.context;

    // Fundo transparente
    shadowCtx.clearRect(0, 0, 100, 32);

    // Camada 1: Sombra radial principal (mais escura no centro)
    const shadowGradPrimary = shadowCtx.createRadialGradient(50, 16, 8, 50, 16, 45);
    shadowGradPrimary.addColorStop(0, 'rgba(0, 0, 0, 0.6)');     // Centro (muito escuro)
    shadowGradPrimary.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)');   // Meio
    shadowGradPrimary.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
    shadowGradPrimary.addColorStop(1, 'rgba(0, 0, 0, 0)');       // Borda desvance
    shadowCtx.fillStyle = shadowGradPrimary;
    shadowCtx.beginPath();
    shadowCtx.ellipse(50, 16, 45, 13, -0.1, 0, Math.PI * 2); // Elipse alongada (realista)
    shadowCtx.fill();

    // Camada 2: Sombreado secundário mais sutil (profundidade)
    const shadowGradSecondary = shadowCtx.createRadialGradient(50, 14, 5, 50, 18, 40);
    shadowGradSecondary.addColorStop(0, 'rgba(60, 40, 20, 0.15)'); // Tom castanho sutil (terra)
    shadowGradSecondary.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
    shadowGradSecondary.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = shadowGradSecondary;
    shadowCtx.beginPath();
    shadowCtx.ellipse(50, 16, 48, 15, -0.15, 0, Math.PI * 2);
    shadowCtx.fill();

    // PADRÃO: Variação de textura dentro da sombra (não uniformemente sólida)
    for (let y = 4; y < 28; y++) {
      for (let x = 10; x < 90; x++) {
        const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) / Math.pow(45, 2) + Math.pow(y - 16, 2) / Math.pow(13, 2));
        if (distFromCenter < 1) {
          const noiseVal = this.noise(x * 0.2, y * 0.3);
          const opacity = (1 - distFromCenter) * (0.2 + noiseVal * 0.15);
          shadowCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
          shadowCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    shadowCanvas.refresh();
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_shadow texture created (100x32 - profissional com gradientes múltiplos)');

    // ========== LUZ SOLAR FILTRADA PELA COPA (Dungeon Siege reference) ==========
    // Manchas quentes de luz (amarelo-esverdeado) espalhadas no chão, simulando
    // raios de sol atravessando as folhas — assinatura visual do cenário de
    // referência (floresta densa e ensolarada, não puramente gótica/escura).
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_light_patch texture (dappled sunlight)');
    if (this.scene.textures.exists('forest_light_patch')) {
      this.scene.textures.remove('forest_light_patch');
    }
    let lightCanvas = this.scene.textures.createCanvas('forest_light_patch', 96, 64)!;
    let lightCtx = lightCanvas.context;
    const lightGrad = lightCtx.createRadialGradient(48, 32, 4, 48, 32, 46);
    lightGrad.addColorStop(0, 'rgba(255, 246, 190, 0.55)');
    lightGrad.addColorStop(0.45, 'rgba(224, 232, 150, 0.3)');
    lightGrad.addColorStop(1, 'rgba(224, 232, 150, 0)');
    lightCtx.fillStyle = lightGrad;
    lightCtx.beginPath();
    lightCtx.ellipse(48, 32, 46, 28, 0, 0, Math.PI * 2);
    lightCtx.fill();
    lightCanvas.refresh();
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_light_patch texture created (96x64 - manchas de luz solar)');

    // ========== ÁRVORES FRACTAIS ASSADAS (WebGL2 Dynamic Texture - Phaser 4 Best Practice) ==========
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Baking procedural fractal tree textures (WebGL2 Dynamic Texture)');
    const treeVariants = [0, 1, 2];
    treeVariants.forEach(variant => {
      const texKey = `procedural_tree_${variant}`;
      if (this.scene.textures.exists(texKey)) {
        this.scene.textures.remove(texKey);
      }

      const treeWidth = 160;
      const treeHeight = 220;
      const textureManager = this.scene.textures as any;

      if (typeof textureManager.addDynamicTexture === 'function') {
        const treeTexture = textureManager.addDynamicTexture(texKey, treeWidth, treeHeight);
        const g = this.scene.add.graphics();
        this.drawFractalTreeGraphics(g, 80, 175, 1000 + variant * 333);
        if (treeTexture.draw && treeTexture.render) {
          treeTexture.draw(g);
          treeTexture.render();
        }
        g.destroy();
      } else {
        let canvasTex = this.scene.textures.createCanvas(texKey, treeWidth, treeHeight)!;
        const g = this.scene.add.graphics();
        this.drawFractalTreeGraphics(g, 80, 175, 1000 + variant * 333);
        g.destroy();
        canvasTex.refresh();
      }
    });
    logger.info('ProceduralForestGenerator.generateProceduralTextures', 'All procedural tree textures baked successfully');

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

    // IMPORTANTE: o piso (grama + manchas de luz) NÃO entra no `depthGroup`.
    // `depthGroup` alimenta o ISO Y-SORTING DEPTH SYSTEM (GameScene.update(),
    // `gameObject.setDepth(gameObject.y)` a cada frame) — correto para
    // objetos VERTICAIS (personagem, inimigos, árvores) que devem se
    // ocluir mutuamente conforme a posição. `forest_grass` é um retângulo
    // 64x32 OPACO sem recorte de silhueta isométrica (losango); colocá-lo
    // no Y-sort fazia sua metade superior invadir visualmente o espaço do
    // personagem (reportado: "grama cobrindo até a cabeça do personagem").
    // O piso é plano — deve ficar sempre atrás de tudo, com depth FIXO,
    // fora do Y-sort. Detalhe vertical real (tufos de grama) é
    // responsabilidade do TerrainDetailFactory, que sim participa do
    // Y-sort corretamente (silhueta fina, origem na base).
    let tilesAdded = 0;
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        try {
          const isoX = this.CAMERA_OFFSET_X + (x - y) * (this.TILE_WIDTH / 2);
          const isoY = this.CAMERA_OFFSET_Y + (x + y) * (this.TILE_HEIGHT / 2);

          let grass = gameScene.add.image(isoX, isoY, 'forest_grass');
          gameScene.lightingSystem?.applyLightPipeline(grass);
          grass.setDepth(ProceduralForestGenerator.GROUND_DEPTH); // fixo, fora do depthGroup
          tilesAdded++;
        } catch (e) {
          logger.error('ProceduralForestGenerator.renderForestFloor', 'Failed to add grass tile', { x, y, error: String(e) });
          throw e;
        }
      }
    }

    logger.info('ProceduralForestGenerator.renderForestFloor', 'Floor rendering complete', { tilesAdded });

    // Manchas de luz solar filtrada pela copa (dappled light) — também piso
    // plano, mesmo raciocínio acima: depth fixo, fora do depthGroup.
    let patchesAdded = 0;
    const patchCount = Math.max(6, Math.floor((gridW * gridH) / 35));
    for (let i = 0; i < patchCount; i++) {
      try {
        const px = this.noise(i * 7, 500) * gridW;
        const py = this.noise(i * 7, 501) * gridH;
        const isoX = this.CAMERA_OFFSET_X + (px - py) * (this.TILE_WIDTH / 2);
        const isoY = this.CAMERA_OFFSET_Y + (px + py) * (this.TILE_HEIGHT / 2);

        const patch = gameScene.add.image(isoX, isoY, 'forest_light_patch');
        patch.setBlendMode(Phaser.BlendModes.ADD);
        patch.setAlpha(0.35 + this.noise(i, 502) * 0.3);
        patch.setScale(0.8 + this.noise(i, 503) * 0.9);
        patch.setDepth(ProceduralForestGenerator.GROUND_DEPTH + 1); // acima da grama, ainda fixo/fora do Y-sort
        patchesAdded++;
      } catch (e) {
        logger.error('ProceduralForestGenerator.renderForestFloor', 'Failed to add light patch', { i, error: String(e) });
        throw e;
      }
    }

    logger.info('ProceduralForestGenerator.renderForestFloor', 'Dappled light patches rendered', { patchesAdded });

    // Tufos de grama selvagem (detalhe vertical real, Y-sorted de verdade)
    const terrainDetailFactory = new TerrainDetailFactory(this.scene);
    terrainDetailFactory.bakeTuftTextures();

    const minIsoX = this.CAMERA_OFFSET_X - gridH * (this.TILE_WIDTH / 2);
    const maxIsoX = this.CAMERA_OFFSET_X + gridW * (this.TILE_WIDTH / 2);
    const maxIsoY = this.CAMERA_OFFSET_Y + (gridW + gridH) * (this.TILE_HEIGHT / 2);

    const tufts = terrainDetailFactory.scatterTufts({
      count: Math.min(220, Math.max(20, Math.floor((gridW * gridH) / 6))),
      originX: minIsoX,
      originY: this.CAMERA_OFFSET_Y,
      areaWidth: maxIsoX - minIsoX,
      areaHeight: maxIsoY - this.CAMERA_OFFSET_Y,
      seed: 4242,
    });

    logger.info('ProceduralForestGenerator.renderForestFloor', 'Tufos de grama (Y-sorted) espalhados', { tufts: tufts.length });
  }

  /**
   * Desenha uma conífera em camadas (tiers triangulares sobrepostos) no Graphics
   * para assar na textura dinâmica (WebGL2). Substitui a antiga árvore fractal
   * de copa única por uma silhueta de pinheiro clássica — referência visual:
   * floresta densa e ensolarada de Dungeon Siege (2002), não um blob gótico.
   */
  private drawFractalTreeGraphics(graphics: Phaser.GameObjects.Graphics, originX: number, originY: number, seed: number): void {
    let rngState = seed;
    const pseudoRandom = (): number => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    // 1. Sombra da árvore no chão
    graphics.fillStyle(0x0a0c08, 0.5);
    graphics.fillEllipse(originX, originY + 6, 40, 14);

    // 2. Paleta de pinheiro (verdes vibrantes com sombra fria — luz filtrando
    // pela copa, como no cenário de referência, mantendo o clima sombrio nas
    // sombras profundas)
    const trunkColors = [0x2c1d11, 0x3d2817, 0x4e3522];
    const foliageShadow = [0x18321f, 0x1c3a24]; // sombra fria e profunda
    const foliageBase = [0x2d5a3f, 0x347049];   // verde-pinheiro médio
    const foliageLit = [0x5a9c5e, 0x6bb066];    // verde iluminado pelo sol

    const paletteIdx = Math.floor(seed) % 2;
    const heightScale = 0.85 + pseudoRandom() * 0.35;
    const trunkHeight = 95 * heightScale;
    const trunkBaseY = originY;
    const trunkTopY = originY - trunkHeight;
    const trunkBaseWidth = 8 + pseudoRandom() * 3;
    const trunkTopWidth = 3;

    // 3. Tronco afunilado, segmentado para textura de casca
    const trunkSegments = 14;
    for (let i = 0; i < trunkSegments; i++) {
      const t0 = i / trunkSegments;
      const t1 = (i + 1) / trunkSegments;
      const y0 = trunkBaseY - trunkHeight * t0;
      const y1 = trunkBaseY - trunkHeight * t1;
      const w0 = trunkBaseWidth + (trunkTopWidth - trunkBaseWidth) * t0;
      const w1 = trunkBaseWidth + (trunkTopWidth - trunkBaseWidth) * t1;
      const noiseVal = this.noise(i * 3, seed % 50);
      const colorIdx = Math.floor(noiseVal * trunkColors.length);

      graphics.fillStyle(trunkColors[Math.min(trunkColors.length - 1, colorIdx)], 1);
      graphics.beginPath();
      graphics.moveTo(originX - w0 / 2, y0);
      graphics.lineTo(originX + w0 / 2, y0);
      graphics.lineTo(originX + w1 / 2, y1);
      graphics.lineTo(originX - w1 / 2, y1);
      graphics.closePath();
      graphics.fillPath();
    }

    // 4. Copa em camadas: tiers triangulares sobrepostos, mais largos embaixo
    // e afunilando no topo — silhueta de conífera reconhecível à primeira vista
    const tierCount = 6 + Math.floor(pseudoRandom() * 2); // 6-7 andares
    const canopyBottom = trunkBaseY - 18; // andar inferior próximo ao solo
    const canopyTop = trunkTopY - 6;      // ponta da árvore
    const canopySpan = canopyBottom - canopyTop;

    for (let tier = 0; tier < tierCount; tier++) {
      const tFrac = tier / (tierCount - 1);
      const tierWidth = (76 - tFrac * 54) * (0.88 + pseudoRandom() * 0.24);
      const tierY = canopyBottom - tFrac * canopySpan * 0.9;
      const tierRise = (canopySpan / tierCount) * 1.9; // altura do triângulo (overlap entre andares)
      const tipY = tierY - tierRise;
      const leftX = originX - tierWidth / 2;
      const rightX = originX + tierWidth / 2;

      // Metade esquerda: sombra fria (lado oposto à luz)
      graphics.fillStyle(foliageShadow[paletteIdx], 0.92);
      graphics.fillTriangle(originX, tipY, leftX, tierY, originX, tierY);

      // Metade direita: base iluminada
      graphics.fillStyle(foliageBase[paletteIdx], 0.95);
      graphics.fillTriangle(originX, tipY, originX, tierY, rightX, tierY);

      // Faixa de luz solar filtrando pela copa (canto superior direito)
      graphics.fillStyle(foliageLit[paletteIdx], 0.55);
      graphics.fillTriangle(
        originX + tierWidth * 0.08, tipY + tierRise * 0.15,
        originX + tierWidth * 0.1, tierY,
        originX + tierWidth * 0.35, tierY
      );

      // Textura orgânica: agulhas/pontos nas bordas do tier
      const dabCount = 8 + Math.floor(pseudoRandom() * 8);
      for (let d = 0; d < dabCount; d++) {
        const along = pseudoRandom();
        const edgeX = leftX + (rightX - leftX) * along;
        const edgeDepth = 1 - Math.abs(along - 0.5) * 2; // 1 no centro, 0 nas bordas
        const edgeY = tipY + (tierY - tipY) * (0.35 + edgeDepth * 0.5);
        const noiseVal = this.noise(edgeX, edgeY + seed);
        const dotSet = noiseVal > 0.65 ? foliageLit : (noiseVal > 0.35 ? foliageBase : foliageShadow);

        graphics.fillStyle(dotSet[paletteIdx], 0.5 + noiseVal * 0.35);
        const size = 2 + noiseVal * 3;
        graphics.fillRect(edgeX - size / 2, edgeY - size / 2, size, size);
      }
    }
  }

  /**
   * Instancia árvores procedurais como Sprites de alta performance usando as texturas dinâmicas assadas (Phaser 4 WebGL2).
   */
  private generateAndRenderTrees(gridW: number, gridH: number): void {
    const gameScene = this.scene as GameScene;
    logger.info('ProceduralForestGenerator.generateAndRenderTrees', 'Starting procedural fractal tree sprite instantiation');

    if (!gameScene.depthGroup) {
      logger.error('ProceduralForestGenerator.generateAndRenderTrees', 'depthGroup is not available', {});
      throw new Error('GameScene.depthGroup is required for tree rendering');
    }

    const trees: Array<{ x: number; y: number; variant: number }> = [];

    const centerGridX = Math.floor(gridW / 2);
    const centerGridY = Math.floor(gridH / 2);
    trees.push({
      x: centerGridX + 1,
      y: centerGridY + 1,
      variant: 0
    });
    trees.push({
      x: centerGridX - 1,
      y: centerGridY + 1,
      variant: 1
    });

    // Densidade alta o suficiente para criar copa fechada acima do jogador
    // (referência: floresta densa de Dungeon Siege, não árvores esparsas)
    const xSpan = Math.max(1, gridW - 4);
    const ySpan = Math.max(1, gridH - 2);
    const backgroundTreeCount = 42;
    for (let i = 0; i < backgroundTreeCount; i++) {
      trees.push({
        x: 2 + Math.floor(i * 1.3) % xSpan,
        y: 1 + Math.floor(i / 2.8) % ySpan,
        variant: Math.floor(this.noise(i * 5, 600) * 3) % 3
      });
    }

    logger.info('ProceduralForestGenerator.generateAndRenderTrees', 'Tree positions generated', { treeCount: trees.length });

    let treeIndex = 0;
    trees.forEach(tree => {
      try {
        treeIndex++;
        const isoX = this.CAMERA_OFFSET_X + (tree.x - tree.y) * (this.TILE_WIDTH / 2);
        const isoY = this.CAMERA_OFFSET_Y + (tree.x + tree.y) * (this.TILE_HEIGHT / 2);

        const variant = tree.variant % 3;
        const texKey = `procedural_tree_${variant}`;
        const finalTexKey = gameScene.textures.exists(texKey) ? texKey : 'forest_trunk';

        const treeObject = createAtmosphericTree(gameScene, isoX, isoY, finalTexKey, {
          windSpeed: 1.6 + (variant * 0.3),
          windStrength: 4.5 + (variant * 0.8),
          lightDirection: [0.6, -0.8],
          ambientOcclusion: 0.45,
          lightIntensity: 0.95,
          atmosphereColor: [0.08, 0.12, 0.11],
          atmosphereFogDensity: 0.1,
        });

        // Variação de escala por árvore (0.75–1.35) para dar profundidade e
        // quebrar a repetição visual das mesmas 3 texturas base
        const scaleVariety = 0.75 + this.noise(tree.x, tree.y) * 0.6;
        (treeObject as unknown as { setScale?: (s: number) => void }).setScale?.(scaleVariety);

        gameScene.depthGroup.add(treeObject);

        logger.info('ProceduralForestGenerator.generateAndRenderTrees', `Atmospheric Fractal Tree ${treeIndex} rendered`, { x: tree.x, y: tree.y, variant });
      } catch (e) {
        logger.error('ProceduralForestGenerator.generateAndRenderTrees', `Failed to render tree ${treeIndex}`, { tree, error: String(e) });
        throw e;
      }
    });

    logger.info('ProceduralForestGenerator.generateAndRenderTrees', 'All procedural fractal tree sprites rendered successfully', { totalTrees: treeIndex });
  }
}
