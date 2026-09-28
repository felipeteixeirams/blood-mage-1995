import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BossPhaseController } from './BossPhaseController';
import type { Enemy } from '../objects/Enemy';
import type { BossPhaseConfig, MonsterConfig } from '../../types/game';

/**
 * Spec 33 — Sistema de Boss Multi-Fase com Telégrafo Evolutivo.
 *
 * Não depende de uma Phaser Scene real: `scene` é um mock mínimo (mesmo
 * padrão de CombatFeel.test.ts), já que `CombatFeel.triggerScreenShake` /
 * `triggerHitStop` fazem no-op seguro quando `cameras`/`physics`/`time`
 * estão ausentes — aqui fornecemos versões mockadas para também poder
 * observar (sem exigir) que o feedback de impacto é disparado.
 */

const DEFAULT_PHASES: BossPhaseConfig[] = [
  { hpThreshold: 1.0, speedMultiplier: 1.0, attackIntervalMultiplier: 1.0 },
  { hpThreshold: 0.5, speedMultiplier: 1.15, attackIntervalMultiplier: 0.85 },
  { hpThreshold: 0.2, speedMultiplier: 1.3, attackIntervalMultiplier: 0.7, unlocksWaveTelegraph: true },
];

function makeFakeScene() {
  return {
    physics: { world: { pause: vi.fn(), resume: vi.fn() } },
    cameras: { main: { shake: vi.fn() } },
    time: { addEvent: vi.fn(() => ({})) },
  };
}

function makeBoss(overrides: Partial<{ hp: number; maxHp: number; active: boolean; bossPhases: BossPhaseConfig[] | null }> = {}): Enemy {
  // `null` explicitamente pede "sem bossPhases" (monstro não-boss); omitir a
  // chave usa os DEFAULT_PHASES. Isso evita ambiguidade com `undefined`.
  const hasOverride = Object.prototype.hasOwnProperty.call(overrides, 'bossPhases');
  const resolvedPhases = hasOverride ? overrides.bossPhases ?? undefined : DEFAULT_PHASES;

  const config = {
    id: 'necro_lord_boss',
    behavior: 'boss',
    bossPhases: resolvedPhases,
  } as unknown as MonsterConfig;

  return {
    config,
    active: overrides.active ?? true,
    hp: overrides.hp ?? 1800,
    maxHp: overrides.maxHp ?? 1800,
    speedMultiplier: 1.0,
  } as unknown as Enemy;
}

describe('BossPhaseController (Spec 33)', () => {
  let scene: ReturnType<typeof makeFakeScene>;
  let controller: BossPhaseController;

  beforeEach(() => {
    scene = makeFakeScene();
    controller = new BossPhaseController(scene as never);
  });

  it('não dispara nenhuma fase real quando hp === maxHp (fase placeholder 1.0 é um no-op)', () => {
    const boss = makeBoss({ hp: 1800, maxHp: 1800 });

    controller.update([boss]);

    expect(boss.speedMultiplier).toBe(1.0);
    expect(controller.isFinalPhase(boss)).toBe(false);
    expect(controller.getAttackIntervalMultiplier(boss)).toBe(1.0);
  });

  it('aplica speedMultiplier ao cruzar hpThreshold 0.5 EXATAMENTE uma vez, mesmo com updates repetidos no mesmo HP', () => {
    const boss = makeBoss({ hp: 900, maxHp: 1800 }); // hpRatio = 0.5

    controller.update([boss]);
    expect(boss.speedMultiplier).toBeCloseTo(1.15);

    // Múltiplos frames consecutivos com o mesmo HP não devem reaplicar.
    controller.update([boss]);
    controller.update([boss]);
    controller.update([boss]);

    expect(boss.speedMultiplier).toBeCloseTo(1.15);
    expect(controller.getAttackIntervalMultiplier(boss)).toBeCloseTo(0.85);
    expect(controller.isFinalPhase(boss)).toBe(false);
  });

  it('dispara todas as fases intermediárias na ordem quando o HP cai rapidamente de 100% para 15%', () => {
    const boss = makeBoss({ hp: 1800, maxHp: 1800 });

    // Primeiro frame: cheio de vida, nada dispara de fato.
    controller.update([boss]);
    expect(boss.speedMultiplier).toBe(1.0);

    // Corte direto para 15% — cruza 0.5 E 0.2 no mesmo update().
    boss.hp = 270; // 270 / 1800 = 0.15
    controller.update([boss]);

    // Produto multiplicativo das duas fases, na ordem (maior threshold primeiro): 1.0 * 1.15 * 1.3
    expect(boss.speedMultiplier).toBeCloseTo(1.15 * 1.3);
    expect(controller.getAttackIntervalMultiplier(boss)).toBeCloseTo(0.85 * 0.7);
    expect(controller.isFinalPhase(boss)).toBe(true);

    // Idempotência também vale após o corte múltiplo: updates seguintes no mesmo HP não reaplicam.
    controller.update([boss]);
    controller.update([boss]);
    expect(boss.speedMultiplier).toBeCloseTo(1.15 * 1.3);
  });

  it('isFinalPhase() só retorna true depois de cruzar o último threshold (unlocksWaveTelegraph)', () => {
    const boss = makeBoss({ hp: 1800, maxHp: 1800 });

    controller.update([boss]);
    expect(controller.isFinalPhase(boss)).toBe(false);

    boss.hp = 900; // 50% — cruza só a fase intermediária
    controller.update([boss]);
    expect(controller.isFinalPhase(boss)).toBe(false);

    boss.hp = 300; // ~16.6% — cruza a fase final
    controller.update([boss]);
    expect(controller.isFinalPhase(boss)).toBe(true);
  });

  it('é multiplicativo, não substitui: preserva variação individual de speedMultiplier já existente em Enemy', () => {
    const boss = makeBoss({ hp: 300, maxHp: 1800 }); // já cruza 0.5 e 0.2 de uma vez
    boss.speedMultiplier = 0.9; // variação individual de personalidade (ver construtor de Enemy.ts)

    controller.update([boss]);

    expect(boss.speedMultiplier).toBeCloseTo(0.9 * 1.15 * 1.3);
  });

  it('ignora inimigos sem bossPhases configurado (backward-compatible, monstros não-boss)', () => {
    const nonBoss = makeBoss({ hp: 10, maxHp: 100, bossPhases: null });

    expect(() => controller.update([nonBoss])).not.toThrow();
    expect(nonBoss.speedMultiplier).toBe(1.0);
    expect(controller.isFinalPhase(nonBoss)).toBe(false);
  });

  it('ignora inimigos inativos e listas vazias sem lançar erro', () => {
    const inactiveBoss = makeBoss({ hp: 100, maxHp: 1800, active: false });

    expect(() => controller.update([inactiveBoss])).not.toThrow();
    expect(inactiveBoss.speedMultiplier).toBe(1.0);

    expect(() => controller.update([])).not.toThrow();
  });

  it('mantém estado de fase independente por instância de boss (WeakMap por Enemy)', () => {
    const bossA = makeBoss({ hp: 900, maxHp: 1800 }); // 50%
    const bossB = makeBoss({ hp: 1800, maxHp: 1800 }); // 100%

    controller.update([bossA, bossB]);

    expect(bossA.speedMultiplier).toBeCloseTo(1.15);
    expect(bossB.speedMultiplier).toBe(1.0);
    expect(controller.isFinalPhase(bossA)).toBe(false);
    expect(controller.isFinalPhase(bossB)).toBe(false);
  });
});
