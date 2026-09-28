/**
 * Lógica pura do menu contextual de alvo (hover do mouse) — Spec 09 residual
 * (Tier B.6, docs/specs/delivered/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md).
 *
 * Mantida fora de GameScene.ts (mesmo espírito de ThreatIndicator.test.ts:
 * a cena só monta candidatos a partir dos groups do Phaser e desenha o
 * `Phaser.GameObjects.Text`; a decisão de "qual alvo está sob o cursor" e
 * "isso é ambiente desktop com mouse" fica em funções puras testáveis sem
 * mock de Phaser/jsdom).
 */

export interface HoverCandidate<T> {
  x: number;
  y: number;
  label: string;
  payload: T;
}

/**
 * Acha o candidato mais prioritário sob o ponto do mundo (worldX, worldY),
 * dentro de `radius`. `candidateGroups` é ordenado por prioridade — hoje
 * inimigos vivos (grupo 0) sempre vencem NPCs (grupo 1) quando ambos caem
 * sob o cursor, mesma prioridade de combate usada no resto do jogo.
 * Cada grupo já deve vir pré-filtrado (só payloads `active`/vivos) por quem
 * chama — esta função só faz a geometria.
 */
export function findNearestHoverCandidate<T>(
  worldX: number,
  worldY: number,
  candidateGroups: HoverCandidate<T>[][],
  radius: number
): HoverCandidate<T> | null {
  for (const group of candidateGroups) {
    for (const candidate of group) {
      if (Math.hypot(candidate.x - worldX, candidate.y - worldY) <= radius) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * Mesma checagem touch-vs-mouse já usada em `GameplayHUD.tsx`
 * (`isTouchCapable`, usada lá para decidir `showTouchControls`) —
 * reaproveitada aqui, não é um novo sistema de detecção de dispositivo.
 * Recebe os sinais já lidos do browser (em vez de ler `window`/`navigator`
 * direto) para poder ser testada sem jsdom.
 */
export function isDesktopPointerEnvironment(signals: {
  hasOntouchstart: boolean;
  maxTouchPoints: number;
  msMaxTouchPoints: number;
  matchesCoarsePointer: boolean;
}): boolean {
  const isTouchCapable =
    signals.hasOntouchstart ||
    signals.maxTouchPoints > 0 ||
    signals.msMaxTouchPoints > 0 ||
    signals.matchesCoarsePointer;
  return !isTouchCapable;
}
