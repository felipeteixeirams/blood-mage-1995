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

    // ========== GRAMA com Profundidade e Múltiplos Padrões ==========
    if (!this.scene.textures.exists('forest_grass')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_grass texture (profissional)');
      let grassCanvas = this.scene.textures.createCanvas('forest_grass', 64, 32)!;
      let ctx = grassCanvas.context;

      // Cores profissionais de grama
      const grassLight = '#a4d65e';    // Luz (frente)
      const grassMain = '#9ccc65';     // Principal
      const grassMid = '#8bc34a';      // Médio
      const grassDark = '#7cb342';     // Escuro
      const grassShadow = '#5a8c38';   // Sombra (profundidade)

      // Gradiente horizontal para profundidade (frente mais clara, trás mais escura)
      const grassGrad = ctx.createLinearGradient(0, 0, 0, 32);
      grassGrad.addColorStop(0, grassLight);    // Topo mais claro
      grassGrad.addColorStop(0.4, grassMain);
      grassGrad.addColorStop(0.8, grassMid);
      grassGrad.addColorStop(1, grassShadow);   // Base mais escura
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 0, 64, 32);

      // PADRÃO 1: Bayer dithering com variação via noise
      const grassBayer = [[0, 2], [3, 1]];
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
          const bayerVal = grassBayer[y % 2][x % 2];
          const noiseVal = this.noise(x * 0.3, y * 0.2);
          const threshold = (bayerVal / 4) * 255;

          if ((threshold < 85 || (threshold < 170 && noiseVal > 0.6)) && noiseVal > 0.3) {
            ctx.fillStyle = `rgba(${100 + Math.floor(noiseVal * 30)}, ${130 + Math.floor(noiseVal * 20)}, ${40}, ${0.3 + noiseVal * 0.2})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // PADRÃO 2: Fios de grama individual (profissionalismo)
      ctx.strokeStyle = 'rgba(90, 110, 30, 0.4)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 20; i++) {
        const x = this.noise(i, 50) * 64;
        const startY = 5 + this.noise(i, 51) * 10;
        const endY = startY + 8 + this.noise(i, 52) * 8;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x + (this.noise(i, 53) - 0.5) * 4, endY);
        ctx.stroke();
      }

      // PADRÃO 3: Sombras pequenas para textura (sujeira, depressões)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let i = 0; i < 12; i++) {
        const x = this.noise(i * 3, 100) * 64;
        const y = this.noise(i * 3, 101) * 32;
        const size = 1 + this.noise(i, 102) * 2;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      grassCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture created (64x32 - profissional com gradiente e fios)');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_grass texture already exists, skipping');
    }

    // ========== TRONCO com Silhueta Forte e Textura Profissional ==========
    if (!this.scene.textures.exists('forest_trunk')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_trunk texture (PROFISSIONAL)');
      let trunkCanvas = this.scene.textures.createCanvas('forest_trunk', 64, 140)!;
      let ctx = trunkCanvas.context;

      // Base: cor principal de tronco (marrom médio)
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, 0, 64, 140);

      // Sombreamento lateral com gradiente suave (profundidade 3D)
      const leftGrad = ctx.createLinearGradient(0, 0, 30, 0);
      leftGrad.addColorStop(0, 'rgba(50, 30, 20, 0.4)'); // Muito escuro na borda
      leftGrad.addColorStop(0.5, 'rgba(90, 65, 55, 0.2)');
      leftGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, 30, 140);

      const rightGrad = ctx.createLinearGradient(34, 0, 64, 0);
      rightGrad.addColorStop(0, 'transparent');
      rightGrad.addColorStop(0.5, 'rgba(100, 70, 60, 0.15)');
      rightGrad.addColorStop(1, 'rgba(130, 85, 70, 0.25)'); // Borda clara com profundidade
      ctx.fillStyle = rightGrad;
      ctx.fillRect(34, 0, 30, 140);

      // Textura de casca PROFISSIONAL com múltiplos padrões
      const barkBayer = [[0, 2], [3, 1]];

      // Padrão 1: Linhas verticais de casca (rachaduras naturais)
      for (let y = 0; y < 140; y++) {
        for (let x = 0; x < 64; x++) {
          const noise = this.noise(x * 0.3, y * 0.1) * 0.3;
          if (x % 8 < 2 + noise * 4) {
            ctx.fillStyle = `rgba(50, 30, 20, ${0.15 + noise * 0.2})`; // Sombra em linhas
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Padrão 2: Dithering Bayer para textura natural
      for (let y = 0; y < 140; y++) {
        for (let x = 0; x < 64; x++) {
          const bayerVal = barkBayer[y % 2][x % 2];
          const noiseVal = this.noise(x * 0.5, y * 0.5);

          if (bayerVal === 3 || (bayerVal === 2 && noiseVal > 0.7)) {
            ctx.fillStyle = `rgba(${100 + Math.floor(noiseVal * 30)}, ${60 + Math.floor(noiseVal * 20)}, ${50 + Math.floor(noiseVal * 20)}, 0.4)`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Padrão 3: Highlights sugestivos (musgo ou luz)
      ctx.fillStyle = 'rgba(200, 200, 150, 0.08)';
      for (let i = 0; i < 15; i++) {
        const x = Math.floor(this.noise(i, 0) * 64);
        const y = Math.floor(this.noise(i, 1) * 140);
        ctx.beginPath();
        ctx.arc(x, y, 2 + this.noise(i, 2) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Contorno escuro nas bordas (silhueta forte - AUMENTADO)
      ctx.strokeStyle = 'rgba(40, 25, 15, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 64, 140);

      trunkCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture created with strong silhouette');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_trunk texture already exists, skipping');
    }

    // ========== FOLHAGEM - Camada 1 (Principal) PROFISSIONAL ==========
    if (!this.scene.textures.exists('forest_foliage_1')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_1 texture (PROFISSIONAL)');
      let foliage1Canvas = this.scene.textures.createCanvas('forest_foliage_1', 160, 180)!;
      let ctx = foliage1Canvas.context;

      // Cores de folhagem profissional (5 tons para melhor gradação)
      const foliageLight = '#b8dd6b';   // Luz (topo) - mais brilhante
      const foliageMid = '#8bc34a';     // Médio
      const foliageDark = '#7cb342';    // Escuro
      const foliageShadow = '#558b2f';  // Sombra (base)
      const foliageMossGreen = '#6b9d3b'; // Musgo/tom mais frio

      // Base com gradiente radial duplo (mais profissional)
      let foliageGrad = ctx.createRadialGradient(80, 60, 20, 80, 90, 90);
      foliageGrad.addColorStop(0, foliageLight);    // Centro iluminado (20% mais claro)
      foliageGrad.addColorStop(0.3, foliageMid);
      foliageGrad.addColorStop(0.65, foliageDark);
      foliageGrad.addColorStop(1, foliageShadow);   // Borda na sombra
      ctx.fillStyle = foliageGrad;
      ctx.beginPath();
      ctx.ellipse(80, 70, 70, 85, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Camada de sombra secundária (profundidade)
      let shadowGrad = ctx.createRadialGradient(85, 100, 10, 80, 100, 95);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(80, 100, 75, 50, 0, 0, Math.PI * 2);
      ctx.fill();

      // Contorno escuro (silhueta forte - AUMENTADO)
      ctx.strokeStyle = 'rgba(60, 100, 40, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(80, 70, 70, 85, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // PADRÃO 1: Detalhe de folhas com Bayer dithering
      const leafBayer = [[0, 2], [3, 1]];
      for (let y = 10; y < 170; y++) {
        for (let x = 30; x < 130; x++) {
          const bayerVal = leafBayer[y % 2][x % 2];
          const inEllipse = this.isInEllipse(x, y, 80, 70, 70, 85, -0.2);
          const noiseVal = this.noise(x * 0.2, y * 0.2);

          if (inEllipse) {
            if (bayerVal === 3 || noiseVal > 0.8) {
              ctx.fillStyle = foliageShadow;
              ctx.globalAlpha = 0.6 + noiseVal * 0.2;
              ctx.fillRect(x, y, 1, 1);
              ctx.globalAlpha = 1;
            } else if (bayerVal === 2 && noiseVal > 0.6) {
              ctx.fillStyle = foliageDark;
              ctx.globalAlpha = 0.4;
              ctx.fillRect(x, y, 1, 1);
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      // PADRÃO 2: Pontos de folhas individuais (mais detalhamento)
      ctx.fillStyle = 'rgba(100, 130, 50, 0.35)';
      for (let i = 0; i < 30; i++) {
        const x = 30 + this.noise(i * 7, 0) * 100;
        const y = 10 + this.noise(i * 7, 1) * 160;
        const size = 1 + this.noise(i, 2) * 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // PADRÃO 3: Highlights sugestivos (luz penetrando folhas)
      ctx.fillStyle = 'rgba(255, 255, 180, 0.12)';
      for (let i = 0; i < 12; i++) {
        const x = 40 + this.noise(i, 100) * 80;
        const y = 20 + this.noise(i, 101) * 120;
        const radius = 3 + this.noise(i, 102) * 5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      foliage1Canvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture created (160x180 - profissional)');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_1 texture already exists, skipping');
    }

    // ========== FOLHAGEM - Camada 2 (Overlay profissional) ==========
    if (!this.scene.textures.exists('forest_foliage_2')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_foliage_2 texture (overlay)');
      let foliage2Canvas = this.scene.textures.createCanvas('forest_foliage_2', 120, 140)!;
      let ctx = foliage2Canvas.context;

      const foliageLight2 = '#b8dd6b';
      const foliageMid2 = '#8bc34a';
      const foliageDark2 = '#7cb342';

      // Gradiente radial profissional (camada frontal overlay)
      let foliageGrad2 = ctx.createRadialGradient(60, 50, 12, 60, 70, 65);
      foliageGrad2.addColorStop(0, foliageLight2);
      foliageGrad2.addColorStop(0.4, foliageMid2);
      foliageGrad2.addColorStop(0.8, foliageDark2);
      foliageGrad2.addColorStop(1, 'rgba(60, 100, 40, 0.9)');
      ctx.fillStyle = foliageGrad2;
      ctx.beginPath();
      ctx.ellipse(60, 60, 55, 70, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Contorno forte (silhueta mais visível)
      ctx.strokeStyle = 'rgba(60, 100, 40, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(60, 60, 55, 70, -0.3, 0, Math.PI * 2);
      ctx.stroke();

      // PADRÃO 1: Dithering para textura
      const leafBayer = [[0, 2], [3, 1]];
      for (let y = 10; y < 130; y++) {
        for (let x = 20; x < 100; x++) {
          const bayerVal = leafBayer[y % 2][x % 2];
          const inEllipse = this.isInEllipse(x, y, 60, 60, 55, 70, -0.3);
          const noiseVal = this.noise(x * 0.3, y * 0.3);

          if (inEllipse && bayerVal === 3 && noiseVal > 0.6) {
            ctx.fillStyle = `rgba(${60 + Math.floor(noiseVal * 40)}, ${100 + Math.floor(noiseVal * 30)}, ${40 + Math.floor(noiseVal * 10)}, 0.5)`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // PADRÃO 2: Pontos de folhas (mais denso que Layer 1)
      ctx.fillStyle = 'rgba(100, 130, 50, 0.4)';
      for (let i = 0; i < 40; i++) {
        const x = 25 + this.noise(i * 5, 200) * 70;
        const y = 15 + this.noise(i * 5, 201) * 110;
        const size = 1.5 + this.noise(i, 202) * 1;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // PADRÃO 3: Highlights principais (luz forte)
      ctx.fillStyle = 'rgba(255, 255, 200, 0.18)';
      for (let i = 0; i < 15; i++) {
        const x = 35 + this.noise(i, 300) * 50;
        const y = 20 + this.noise(i, 301) * 80;
        const radius = 4 + this.noise(i, 302) * 6;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      foliage2Canvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture created (120x140 - overlay profissional)');
    } else {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_foliage_2 texture already exists, skipping');
    }

    // ========== SOMBRA Profissional com Gradientes Múltiplos ==========
    if (!this.scene.textures.exists('forest_shadow')) {
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'Creating forest_shadow texture (profissional)');
      let shadowCanvas = this.scene.textures.createCanvas('forest_shadow', 100, 32)!;
      let ctx = shadowCanvas.context;

      // Fundo transparente
      ctx.clearRect(0, 0, 100, 32);

      // Camada 1: Sombra radial principal (mais escura no centro)
      const shadowGradPrimary = ctx.createRadialGradient(50, 16, 8, 50, 16, 45);
      shadowGradPrimary.addColorStop(0, 'rgba(0, 0, 0, 0.6)');     // Centro (muito escuro)
      shadowGradPrimary.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)');   // Meio
      shadowGradPrimary.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
      shadowGradPrimary.addColorStop(1, 'rgba(0, 0, 0, 0)');       // Borda desvance
      ctx.fillStyle = shadowGradPrimary;
      ctx.beginPath();
      ctx.ellipse(50, 16, 45, 13, -0.1, 0, Math.PI * 2); // Elipse alongada (realista)
      ctx.fill();

      // Camada 2: Sombreado secundário mais sutil (profundidade)
      const shadowGradSecondary = ctx.createRadialGradient(50, 14, 5, 50, 18, 40);
      shadowGradSecondary.addColorStop(0, 'rgba(60, 40, 20, 0.15)'); // Tom castanho sutil (terra)
      shadowGradSecondary.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
      shadowGradSecondary.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGradSecondary;
      ctx.beginPath();
      ctx.ellipse(50, 16, 48, 15, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // PADRÃO: Variação de textura dentro da sombra (não uniformemente sólida)
      for (let y = 4; y < 28; y++) {
        for (let x = 10; x < 90; x++) {
          const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) / Math.pow(45, 2) + Math.pow(y - 16, 2) / Math.pow(13, 2));
          if (distFromCenter < 1) {
            const noiseVal = this.noise(x * 0.2, y * 0.3);
            const opacity = (1 - distFromCenter) * (0.2 + noiseVal * 0.15);
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      shadowCanvas.refresh();
      logger.info('ProceduralForestGenerator.generateProceduralTextures', 'forest_shadow texture created (100x32 - profissional com gradientes múltiplos)');
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
