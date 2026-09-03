import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type { RoomData } from './DungeonGenerator';

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
  }

  /**
   * Gera a floresta procedural. Retorna RoomData[] compatível com
   * o portal system (apenas uma "sala" que é toda a floresta).
   */
  public generate(mapW: number, mapH: number): RoomData[] {
    // Gerar texturas procedurais
    this.generateProceduralTextures();

    // Renderizar piso de grama
    this.renderForestFloor(mapW, mapH);

    // Gerar e renderizar árvores
    this.generateAndRenderTrees(mapW, mapH);

    // Gerar apenas uma "sala" compatível com o sistema (a floresta inteira)
    // O portal aparecerá no centro após wave clara
    const rooms: RoomData[] = [
      {
        x: mapW / 2 - 200,
        y: mapH / 2 - 200,
        width: 400,
        height: 400,
        centerX: mapW / 2,
        centerY: mapH / 2,
        type: 'spawn'
      }
    ];

    return rooms;
  }

  /**
   * Gera texturas procedurais usando Phaser Canvas Texture API
   * (evita dependências externas, integra com Light2D pipeline)
   */
  private generateProceduralTextures(): void {
    // Grama com Dithering
    if (!this.scene.textures.exists('forest_grass')) {
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
    }

    // Tronco de Árvore com Textura
    if (!this.scene.textures.exists('forest_trunk')) {
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
    }

    // Folhagem - Camada 1 (Principal)
    if (!this.scene.textures.exists('forest_foliage_1')) {
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
    }

    // Folhagem - Camada 2 (Overlay para profundidade)
    if (!this.scene.textures.exists('forest_foliage_2')) {
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
    }

    // Sombra (elipse)
    if (!this.scene.textures.exists('forest_shadow')) {
      let shadowCanvas = this.scene.textures.createCanvas('forest_shadow', 80, 24)!;
      let ctx = shadowCanvas.context;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(40, 12, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      shadowCanvas.refresh();
    }
  }

  /**
   * Renderiza o piso de grama em projeção isométrica
   */
  private renderForestFloor(mapW: number, mapH: number): void {
    const gameScene = this.scene as GameScene;

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const isoX = this.CAMERA_OFFSET_X + (x - y) * (this.TILE_WIDTH / 2);
        const isoY = this.CAMERA_OFFSET_Y + (x + y) * (this.TILE_HEIGHT / 2);

        let grass = gameScene.depthGroup.create(isoX, isoY, 'forest_grass');
        grass.setPipeline('Light2D');
        grass.depth = isoY;
      }
    }
  }

  /**
   * Gera árvores proceduralmente e as renderiza com multi-layer foliage
   * e sombras dinâmicas.
   */
  private generateAndRenderTrees(mapW: number, mapH: number): void {
    const gameScene = this.scene as GameScene;
    const trees: Array<{ x: number; y: number; variant: number }> = [];

    // Distribuição procedural de árvores (pseudo-aleatória mas determinística)
    for (let i = 0; i < 24; i++) {
      trees.push({
        x: 2 + Math.floor(i * 1.3) % (mapW - 4),
        y: 1 + Math.floor(i / 2.8) % (mapH - 2),
        variant: Math.floor(Math.random() * 3)
      });
    }

    // Renderizar cada árvore
    trees.forEach(tree => {
      const isoX = this.CAMERA_OFFSET_X + (tree.x - tree.y) * (this.TILE_WIDTH / 2);
      const isoY = this.CAMERA_OFFSET_Y + (tree.x + tree.y) * (this.TILE_HEIGHT / 2);

      // Sombra dinâmica
      let shadow = gameScene.depthGroup.create(isoX + 10, isoY + 45, 'forest_shadow');
      shadow.setOrigin(0.5, 0.5);
      shadow.setScale(0.8 + tree.variant * 0.2);
      shadow.setPipeline('Light2D');
      shadow.depth = isoY + 40;

      // Tronco
      let trunk = gameScene.depthGroup.create(isoX, isoY + 35, 'forest_trunk');
      trunk.setOrigin(0.5, 1);
      trunk.setScale(0.7 + tree.variant * 0.15);
      trunk.setPipeline('Light2D');
      trunk.depth = isoY + 35;

      // Folhagem principal (camada 1)
      let foliage1 = gameScene.depthGroup.create(isoX, isoY - 25, 'forest_foliage_1');
      foliage1.setOrigin(0.5, 0.6);
      foliage1.setScale(0.8 + tree.variant * 0.2);
      foliage1.setPipeline('Light2D');
      foliage1.depth = isoY - 20;

      // Folhagem overlay (camada 2, adiciona profundidade)
      let foliage2 = gameScene.depthGroup.create(isoX - 8, isoY - 35, 'forest_foliage_2');
      foliage2.setOrigin(0.5, 0.6);
      foliage2.setScale(0.7 + tree.variant * 0.15);
      foliage2.setAlpha(0.85);
      foliage2.setPipeline('Light2D');
      foliage2.depth = isoY - 30;
    });
  }
}
