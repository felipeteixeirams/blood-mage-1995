import Phaser from 'phaser';
import type { Enemy } from '../objects/Enemy';
import { CombatFeel } from './CombatFeel';

/**
 * BossPhaseController (Spec 33 — Sistema de Boss Multi-Fase com Telégrafo Evolutivo)
 *
 * Padrão Extract/Delegate, controlador EXTERNO ADITIVO à FSM de `Enemy.ts`.
 * NÃO toca no switch de estados (`updateEnemy`) nem no modelo de movimento —
 * apenas observa `hp`/`maxHp` de bosses e, ao cruzar um threshold de HP pela
 * primeira vez, aplica efeitos multiplicativos/aditivos já suportados pelo
 * `Enemy` existente (`speedMultiplier`) e dispara feedback de impacto via
 * `CombatFeel` (screen shake + hit-stop).
 *
 * Estado de "qual fase já disparou para esta instância" vive inteiramente
 * neste controller, num `WeakMap<Enemy, ...>` — de propósito, para não
 * adicionar nenhum novo campo de estado dentro da classe `Enemy` (guardrail
 * explícito da spec 33). O WeakMap também garante que o estado por-boss não
 * vaza entre runs: quando a instância de `Enemy` é coletada (destruída ao
 * fim da run/troca de andar), a entrada correspondente é liberada sozinha.
 */
export class BossPhaseController {
  private scene: Phaser.Scene;

  /** Thresholds (hpThreshold) já disparados, por instância de Enemy. */
  private triggeredThresholds = new WeakMap<Enemy, Set<number>>();

  /** Multiplicador de intervalo de ataque acumulado por instância (produto das fases disparadas). */
  private attackIntervalMultipliers = new WeakMap<Enemy, number>();

  /** Instâncias que já cruzaram uma fase com `unlocksWaveTelegraph: true`. */
  private finalPhaseEnemies = new WeakSet<Enemy>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Chamado do loop principal de `GameScene.update()`. Aditivo: recebe a
   * lista de bosses ativos (já filtrada por quem chama) e aplica fases de
   * forma idempotente — chamar repetidamente com o mesmo HP não reaplica
   * nenhum efeito.
   */
  public update(bosses: Enemy[]): void {
    if (!bosses || bosses.length === 0) return;

    for (const enemy of bosses) {
      this.updateSingleBoss(enemy);
    }
  }

  private updateSingleBoss(enemy: Enemy): void {
    if (!enemy || !enemy.active) return;

    const phases = enemy.config?.bossPhases;
    if (!phases || phases.length === 0) return;
    if (!enemy.maxHp || enemy.maxHp <= 0) return;

    const hpRatio = enemy.hp / enemy.maxHp;
    const triggered = this.getTriggeredSet(enemy);

    // Ordenadas do maior hpThreshold pro menor, conforme Requisito 3.
    const orderedPhases = [...phases].sort((a, b) => b.hpThreshold - a.hpThreshold);

    for (const phase of orderedPhases) {
      if (hpRatio > phase.hpThreshold) continue;
      if (triggered.has(phase.hpThreshold)) continue;

      // Idempotência: marca ANTES de aplicar, então múltiplas chamadas de
      // update() no mesmo frame/HP nunca reaplicam o efeito.
      triggered.add(phase.hpThreshold);

      // Multiplicativo, nunca substitui — respeita variação individual já
      // aplicada em Enemy (ver `speedMultiplier` no construtor de Enemy.ts).
      enemy.speedMultiplier *= phase.speedMultiplier;

      const currentIntervalMult = this.attackIntervalMultipliers.get(enemy) ?? 1.0;
      this.attackIntervalMultipliers.set(enemy, currentIntervalMult * phase.attackIntervalMultiplier);

      if (phase.unlocksWaveTelegraph) {
        this.finalPhaseEnemies.add(enemy);
      }

      // Feedback de impacto real da mudança de fase (só quando a fase
      // efetivamente altera algo — evita disparar shake/hit-stop pra fase
      // placeholder hpThreshold=1.0 com multiplicadores 1.0).
      const isRealChange = phase.speedMultiplier !== 1.0 || phase.attackIntervalMultiplier !== 1.0;
      if (isRealChange) {
        CombatFeel.triggerScreenShake(this.scene, 0.008, 180);
        CombatFeel.triggerHitStop(this.scene, 70);
      }
    }
  }

  private getTriggeredSet(enemy: Enemy): Set<number> {
    let set = this.triggeredThresholds.get(enemy);
    if (!set) {
      set = new Set<number>();
      this.triggeredThresholds.set(enemy, set);
    }
    return set;
  }

  /** True somente após o boss cruzar uma fase com `unlocksWaveTelegraph: true`. */
  public isFinalPhase(enemy: Enemy): boolean {
    return this.finalPhaseEnemies.has(enemy);
  }

  /**
   * Multiplicador de intervalo de ataque acumulado para este boss (produto de
   * todas as fases já disparadas). Exposto para consumo futuro/testes — não
   * é consumido hoje pela FSM de `Enemy.ts` (fora de escopo da spec 33: NÃO
   * modificar o switch de estados / timing de ataque).
   */
  public getAttackIntervalMultiplier(enemy: Enemy): number {
    return this.attackIntervalMultipliers.get(enemy) ?? 1.0;
  }
}
