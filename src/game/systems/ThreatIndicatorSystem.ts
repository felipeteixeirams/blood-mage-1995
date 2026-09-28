/**
 * ThreatIndicatorSystem — Spec 11 (Atmosfera e Tensão), seção 3.1.
 *
 * Lógica PURA de cálculo do Indicador de Ameaça Fora de Tela (chevrons na
 * borda da câmera, estilo Silent Hill). Isolada aqui (sem depender de uma
 * cena Phaser real) para ser testável em `ThreatIndicator.test.ts` E para
 * ser a ÚNICA fonte de verdade consumida por `GameScene.ts` — antes desta
 * extração, `GameScene.updateThreatIndicator()` reimplementava esta mesma
 * matemática inline, duplicada em relação ao que o teste exercitava
 * (`ThreatIndicator.test.ts` testava uma cópia local, não o código real).
 * Essa duplicação é exatamente o tipo de risco descrito no CLAUDE.md
 * (seção "Honestidade Técnica") — testes verdes que não garantem nada sobre
 * o comportamento real. Extrair o cálculo puro para cá e fazer GameScene
 * delegar a ele fecha esse gap sem tocar na FSM de `Enemy.ts` nem no
 * restante do loop de `GameScene.update()`.
 *
 * `GameScene.ts` continua responsável por tudo que é Phaser-specific:
 * desenhar no `Graphics` pooled (reutilizado entre frames, nunca
 * recriado), tocar o áudio espacial e aplicar o pulso de alpha dependente
 * de `time` (não é lógica pura, então fica de fora deste módulo).
 */

import type { AIState } from '../../types/game';

/** Contrato mínimo que um "inimigo" precisa satisfazer para entrar no cálculo. */
export interface ThreatIndicatorEnemyLike {
  x: number;
  y: number;
  aiState: AIState;
  active: boolean;
}

export interface ThreatIndicatorCameraLike {
  scrollX: number;
  scrollY: number;
  zoom: number;
  width: number;
  height: number;
}

/** Margem, em pixels, que o indicador nunca ultrapassa na borda da tela. */
export const THREAT_INDICATOR_EDGE_MARGIN = 25;
/** Nº máximo de ameaças fora de tela desenhadas simultaneamente (perf). */
export const THREAT_INDICATOR_MAX_COUNT = 8;

/** Cor usada para ameaças em `combat`/`frenzy` (vermelho translúcido). */
export const THREAT_INDICATOR_COLOR_ALERT = 0xef4444;
/** Cor usada para ameaças em `investigating` (âmbar suave, mais discreto). */
export const THREAT_INDICATOR_COLOR_INVESTIGATING = 0xf59e0b;

export interface ThreatIndicatorResult<E extends ThreatIndicatorEnemyLike> {
  /** Posição X final na tela (já projetada e clampada na borda). */
  indicatorX: number;
  /** Posição Y final na tela (já projetada e clampada na borda). */
  indicatorY: number;
  /** Ângulo (radianos) do jogador até o inimigo — usado para orientar o chevron. */
  angle: number;
  /** Cor do indicador (0xef4444 alerta / 0xf59e0b investigando). */
  color: number;
  /** Referência ao inimigo original, para o chamador aplicar lógica extra (áudio, elite, etc). */
  enemy: E;
}

export interface ThreatIndicatorClosestThreat<E extends ThreatIndicatorEnemyLike> {
  enemy: E;
  dist: number;
}

export interface ComputeThreatIndicatorsResult<E extends ThreatIndicatorEnemyLike> {
  /** Total de inimigos fora OU dentro de tela em `combat`/`frenzy` (usado pela vinheta/drone de tensão). */
  alertCount: number;
  /** Até `THREAT_INDICATOR_MAX_COUNT` indicadores, mais próximos primeiro. */
  indicators: ThreatIndicatorResult<E>[];
  /** Ameaça fora de tela mais próxima (para áudio espacial), ou null se nenhuma. */
  closestOffscreenThreat: ThreatIndicatorClosestThreat<E> | null;
}

function isAlertState(state: AIState): boolean {
  return state === 'combat' || state === 'frenzy';
}

function isTrackedThreatState(state: AIState): boolean {
  return isAlertState(state) || state === 'investigating';
}

/**
 * Calcula, de forma pura (sem side-effects, sem depender de uma `Phaser.Scene`
 * real), quais inimigos fora do campo de visão da câmera devem exibir um
 * indicador de ameaça na borda da tela, e onde/com qual cor desenhá-lo.
 *
 * @param player Posição do jogador (mundo).
 * @param enemies Lista de candidatos (tipicamente `enemiesGroup.getChildren()`).
 * @param camera Câmera ativa (ou um objeto camera-like equivalente em testes).
 */
export function computeThreatIndicators<E extends ThreatIndicatorEnemyLike>(
  player: { x: number; y: number },
  enemies: E[],
  camera: ThreatIndicatorCameraLike
): ComputeThreatIndicatorsResult<E> {
  const viewW = camera.width;
  const viewH = camera.height;
  const cx = viewW / 2;
  const cy = viewH / 2;
  let alertCount = 0;

  const offscreenThreats: ThreatIndicatorClosestThreat<E>[] = [];

  for (const enemy of enemies) {
    if (!enemy.active) continue;
    if (!isTrackedThreatState(enemy.aiState)) continue;

    if (isAlertState(enemy.aiState)) {
      alertCount++;
    }

    const screenX = (enemy.x - camera.scrollX) * camera.zoom;
    const screenY = (enemy.y - camera.scrollY) * camera.zoom;
    const isOffscreen = screenX < 0 || screenX > viewW || screenY < 0 || screenY > viewH;

    if (isOffscreen) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      offscreenThreats.push({ enemy, dist });
    }
  }

  offscreenThreats.sort((a, b) => a.dist - b.dist);
  const visibleThreats = offscreenThreats.slice(0, THREAT_INDICATOR_MAX_COUNT);

  const indicators: ThreatIndicatorResult<E>[] = visibleThreats.map(({ enemy }) => {
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    const edgeX = cx + Math.cos(angle) * (cx - THREAT_INDICATOR_EDGE_MARGIN);
    const edgeY = cy + Math.sin(angle) * (cy - THREAT_INDICATOR_EDGE_MARGIN);

    const indicatorX = Math.max(THREAT_INDICATOR_EDGE_MARGIN, Math.min(viewW - THREAT_INDICATOR_EDGE_MARGIN, edgeX));
    const indicatorY = Math.max(THREAT_INDICATOR_EDGE_MARGIN, Math.min(viewH - THREAT_INDICATOR_EDGE_MARGIN, edgeY));

    const color = isAlertState(enemy.aiState) ? THREAT_INDICATOR_COLOR_ALERT : THREAT_INDICATOR_COLOR_INVESTIGATING;

    return { indicatorX, indicatorY, angle, color, enemy };
  });

  return {
    alertCount,
    indicators,
    closestOffscreenThreat: offscreenThreats.length > 0 ? offscreenThreats[0] : null,
  };
}
