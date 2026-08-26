import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

export interface TelegraphRenderData {
  phase: 'windup' | 'strike';
  progress: number;
  shape: 'cone' | 'line' | 'circle' | 'boss_slam';
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  range: number;
  angle: number;
  spreadAngle: number;
  lineWidth?: number;
  color: number;
}

/**
 * EnemyTelegraphSystem (Frente 3: Telégrafos Visuais de Ataque dos Inimigos)
 *
 * Renderiza indicadores no chão (Cones de corte, Corredores de investida,
 * Círculos de feitiço e Slams de chefe) durante a fase de Windup dos inimigos.
 *
 * Características principais:
 * - Renderização em world space (depth 740: acima do piso, sob névoa e entidades).
 * - Preenchimento progressivo animado em tempo real (0% -> 100%) indicando timing de esquiva.
 * - Flash de impacto nítido durante o Strike.
 * - Respeito estrito à visibilidade: transparências balanceadas (fill alpha 0.12 - 0.32).
 */
export class EnemyTelegraphSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Inicializa o objeto de gráficos no world space
   */
  public initialize(): void {
    this.cleanup();

    const postProcessing = useGameStore.getState().settings.postProcessingEnabled;
    this.enabled = postProcessing !== false;

    try {
      this.graphics = this.scene.add.graphics().setDepth(740);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Renderiza todos os telégrafos ativos dos inimigos visíveis na tela
   */
  public update(
    time: number,
    enemiesGroup?: Phaser.Physics.Arcade.Group | Phaser.GameObjects.Group | null,
    camera?: Phaser.Cameras.Scene2D.Camera | null
  ): void {
    if (!this.enabled || !this.graphics || !this.graphics.active || !enemiesGroup) {
      if (this.graphics && this.graphics.active) {
        this.graphics.clear();
      }
      return;
    }

    this.graphics.clear();

    const cam = camera || this.scene.cameras?.main;
    const viewBounds = cam ? cam.worldView : null;
    const pad = 120;

    const children = enemiesGroup.getChildren();
    for (let i = 0; i < children.length; i++) {
      const enemy = children[i] as any;
      if (!enemy || !enemy.active || typeof enemy.getTelegraphInfo !== 'function') {
        continue;
      }

      // Culling espacial rápido: se o inimigo e o alvo estiverem muito longe da câmera, pula
      if (viewBounds) {
        const inViewOrigin =
          enemy.x >= viewBounds.x - pad &&
          enemy.x <= viewBounds.x + viewBounds.width + pad &&
          enemy.y >= viewBounds.y - pad &&
          enemy.y <= viewBounds.y + viewBounds.height + pad;

        const targetX = enemy.attackTargetPos?.x ?? enemy.x;
        const targetY = enemy.attackTargetPos?.y ?? enemy.y;

        const inViewTarget =
          targetX >= viewBounds.x - pad &&
          targetX <= viewBounds.x + viewBounds.width + pad &&
          targetY >= viewBounds.y - pad &&
          targetY <= viewBounds.y + viewBounds.height + pad;

        if (!inViewOrigin && !inViewTarget) {
          continue;
        }
      }

      const info: TelegraphRenderData | null = enemy.getTelegraphInfo(time);
      if (!info) continue;

      this.renderTelegraph(info, time);
    }
  }

  /**
   * Desenha a forma geométrica correspondente ao ataque do inimigo
   */
  private renderTelegraph(info: TelegraphRenderData, time: number): void {
    if (!this.graphics) return;

    const { phase, progress, shape, originX, originY, targetX, targetY, range, angle, spreadAngle, lineWidth, color } = info;

    const isStrike = phase === 'strike';
    const pulse = 0.8 + 0.2 * Math.sin(time * 0.015);
    const strokeAlpha = isStrike ? 0.95 : (0.65 + 0.3 * progress) * pulse;
    const fillAlpha = isStrike ? 0.5 : (0.10 + 0.22 * progress);

    switch (shape) {
      case 'cone': {
        this.renderConeTelegraph(originX, originY, range, angle, spreadAngle, progress, color, strokeAlpha, fillAlpha, isStrike);
        break;
      }

      case 'line': {
        const width = lineWidth || 32;
        this.renderLineTelegraph(originX, originY, targetX, targetY, width, range, progress, color, strokeAlpha, fillAlpha, isStrike);
        break;
      }

      case 'circle': {
        this.renderCircleTelegraph(targetX, targetY, range, progress, color, strokeAlpha, fillAlpha, isStrike, time);
        break;
      }

      case 'boss_slam': {
        this.renderBossSlamTelegraph(originX, originY, range, progress, color, strokeAlpha, fillAlpha, isStrike, time);
        break;
      }
    }
  }

  /**
   * Telégrafo em formato de Cone / Arco de Corte (Cleave)
   */
  private renderConeTelegraph(
    x: number,
    y: number,
    range: number,
    angle: number,
    spread: number,
    progress: number,
    color: number,
    strokeAlpha: number,
    fillAlpha: number,
    isStrike: boolean
  ): void {
    if (!this.graphics) return;

    const halfSpread = spread * 0.5;
    const startAngle = angle - halfSpread;
    const endAngle = angle + halfSpread;

    // 1. Contorno externo do setor
    this.graphics.lineStyle(isStrike ? 2.5 : 1.5, isStrike ? 0xffffff : color, strokeAlpha);
    this.graphics.beginPath();
    this.graphics.moveTo(x, y);
    this.graphics.arc(x, y, range, startAngle, endAngle, false);
    this.graphics.closePath();
    this.graphics.strokePath();

    // 2. Preenchimento de aviso (cresce com o progresso radial)
    const currentRadius = isStrike ? range : Math.max(8, range * Math.min(1.0, progress * 1.05));
    this.graphics.fillStyle(color, fillAlpha);
    this.graphics.beginPath();
    this.graphics.moveTo(x, y);
    this.graphics.arc(x, y, currentRadius, startAngle, endAngle, false);
    this.graphics.closePath();
    this.graphics.fillPath();

    // 3. Linha central guia de ataque
    this.graphics.lineStyle(1, color, strokeAlpha * 0.6);
    this.graphics.beginPath();
    this.graphics.moveTo(x, y);
    this.graphics.lineTo(x + Math.cos(angle) * currentRadius, y + Math.sin(angle) * currentRadius);
    this.graphics.strokePath();
  }

  /**
   * Telégrafo em formato de Linha / Corredor de Investida (Charge)
   */
  private renderLineTelegraph(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    width: number,
    maxRange: number,
    progress: number,
    color: number,
    strokeAlpha: number,
    fillAlpha: number,
    isStrike: boolean
  ): void {
    if (!this.graphics) return;

    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const dist = Math.min(maxRange, Phaser.Math.Distance.Between(x, y, targetX, targetY) + 20);
    const halfWidth = width * 0.5;

    const perpX = -Math.sin(angle) * halfWidth;
    const perpY = Math.cos(angle) * halfWidth;

    const endX = x + Math.cos(angle) * dist;
    const endY = y + Math.sin(angle) * dist;

    // 1. Contorno do corredor
    this.graphics.lineStyle(isStrike ? 2.5 : 1.5, isStrike ? 0xffffff : color, strokeAlpha);
    this.graphics.beginPath();
    this.graphics.moveTo(x + perpX, y + perpY);
    this.graphics.lineTo(endX + perpX, endY + perpY);
    this.graphics.lineTo(endX - perpX, endY - perpY);
    this.graphics.lineTo(x - perpX, y - perpY);
    this.graphics.closePath();
    this.graphics.strokePath();

    // 2. Preenchimento de avanço ao longo do comprimento
    const fillDist = isStrike ? dist : Math.max(10, dist * progress);
    const fillEndX = x + Math.cos(angle) * fillDist;
    const fillEndY = y + Math.sin(angle) * fillDist;

    this.graphics.fillStyle(color, fillAlpha);
    this.graphics.beginPath();
    this.graphics.moveTo(x + perpX, y + perpY);
    this.graphics.lineTo(fillEndX + perpX, fillEndY + perpY);
    this.graphics.lineTo(fillEndX - perpX, fillEndY - perpY);
    this.graphics.lineTo(x - perpX, y - perpY);
    this.graphics.closePath();
    this.graphics.fillPath();

    // 3. Marcador de seta na frente de avanço
    if (!isStrike && progress > 0.15) {
      this.graphics.lineStyle(2, color, strokeAlpha);
      this.graphics.beginPath();
      this.graphics.moveTo(fillEndX + perpX * 0.7, fillEndY + perpY * 0.7);
      this.graphics.lineTo(fillEndX + Math.cos(angle) * 8, fillEndY + Math.sin(angle) * 8);
      this.graphics.lineTo(fillEndX - perpX * 0.7, fillEndY - perpY * 0.7);
      this.graphics.strokePath();
    }
  }

  /**
   * Telégrafo em formato de Círculo no Chão (Spells / Targeted AoE)
   */
  private renderCircleTelegraph(
    x: number,
    y: number,
    radius: number,
    progress: number,
    color: number,
    strokeAlpha: number,
    fillAlpha: number,
    isStrike: boolean,
    time: number
  ): void {
    if (!this.graphics) return;

    // 1. Anel externo com marcador de mira
    this.graphics.lineStyle(isStrike ? 2.5 : 1.5, isStrike ? 0xffffff : color, strokeAlpha);
    this.graphics.strokeCircle(x, y, radius);

    // 2. Marcas de mira cardinais nos eixos
    const tickLen = 6;
    this.graphics.lineStyle(1.5, color, strokeAlpha * 0.8);
    this.graphics.lineBetween(x - radius - tickLen, y, x - radius + 2, y);
    this.graphics.lineBetween(x + radius - 2, y, x + radius + tickLen, y);
    this.graphics.lineBetween(x, y - radius - tickLen, x, y - radius + 2);
    this.graphics.lineBetween(x, y + radius - 2, x, y + radius + tickLen);

    // 3. Disco de preenchimento expansivo
    const currentRadius = isStrike ? radius : Math.max(4, radius * progress);
    this.graphics.fillStyle(color, fillAlpha);
    this.graphics.fillCircle(x, y, currentRadius);

    // 4. Anel interno contraindo ou pulsando
    if (!isStrike && progress < 0.95) {
      const contractRadius = radius * (1 - progress);
      this.graphics.lineStyle(1, 0xffffff, strokeAlpha * 0.5);
      this.graphics.strokeCircle(x, y, contractRadius);
    }
  }

  /**
   * Telégrafo em formato de Boss Slam / Shockwave
   */
  private renderBossSlamTelegraph(
    x: number,
    y: number,
    radius: number,
    progress: number,
    color: number,
    strokeAlpha: number,
    fillAlpha: number,
    isStrike: boolean,
    time: number
  ): void {
    if (!this.graphics) return;

    // Anel externo colossal
    this.graphics.lineStyle(isStrike ? 3 : 2, isStrike ? 0xffffff : 0xef4444, strokeAlpha);
    this.graphics.strokeCircle(x, y, radius);

    // Anel secundário intermediário
    this.graphics.lineStyle(1, 0xf97316, strokeAlpha * 0.7);
    this.graphics.strokeCircle(x, y, radius * 0.55);

    // Preenchimento de magma / sangue crescente
    const currentRadius = isStrike ? radius : Math.max(6, radius * progress);
    this.graphics.fillStyle(color, fillAlpha);
    this.graphics.fillCircle(x, y, currentRadius);

    // Runas pulsantes cardinais rotativas
    const rot = time * 0.002;
    for (let a = 0; a < 4; a++) {
      const curAngle = rot + (a * Math.PI) / 2;
      const rx = x + Math.cos(curAngle) * (radius - 8);
      const ry = y + Math.sin(curAngle) * (radius - 8);
      this.graphics.fillStyle(0xffffff, strokeAlpha * 0.6);
      this.graphics.fillCircle(rx, ry, 2.5);
    }
  }

  /**
   * Ativa ou desativa a renderização dos telégrafos
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.graphics) {
      this.graphics.clear();
    }
  }

  /**
   * Limpeza de recursos
   */
  public cleanup(): void {
    if (this.graphics) {
      try {
        this.graphics.clear();
        this.graphics.destroy();
      } catch {
        // ignore
      }
      this.graphics = null;
    }
  }
}
