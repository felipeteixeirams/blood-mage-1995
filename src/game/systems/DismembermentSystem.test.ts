import { describe, it, expect, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {} }));

import { DismembermentSystem } from './DismembermentSystem';
import monstersData from '../../data/monsters.json';
import { MonsterConfig } from '../../types/game';

const typedMonsters = monstersData as Record<string, MonsterConfig>;

describe('DismembermentSystem - 3-Factor Gore Logic', () => {
  it('triggers total_destruction for fragile zombie struck with explosive hellfire_nova', () => {
    const zombie = typedMonsters['zombie_shambler'];
    const result = DismembermentSystem.calculateDismemberment({
      monsterConfig: zombie,
      damageAmount: 90,
      enemyMaxHp: 110,
      enemyCurrentHp: 30, // 90 - 30 = 60 overkill
      killerSpellId: 'hellfire_nova',
      isCrit: false,
    });

    expect(result.type).toBe('total_destruction');
    expect(result.fragility).toBe(0.85);
    expect(result.spellGibMultiplier).toBe(2.2);
    expect(result.gibScore).toBeGreaterThanOrEqual(0.72);
  });

  it('triggers total_destruction for brittle skeleton warrior under critical strike', () => {
    const skeleton = typedMonsters['skeleton_warrior'];
    const result = DismembermentSystem.calculateDismemberment({
      monsterConfig: skeleton,
      damageAmount: 85,
      enemyMaxHp: 85,
      enemyCurrentHp: 20,
      killerSpellId: 'blood_bolt',
      isCrit: true,
    });

    expect(result.type).toBe('total_destruction');
    expect(result.fragility).toBe(0.90);
    expect(result.isCrit).toBe(true);
  });

  it('triggers normal_collapse for sturdy flesh_golem struck with low damage syphon_soul', () => {
    const golem = typedMonsters['flesh_golem'];
    const result = DismembermentSystem.calculateDismemberment({
      monsterConfig: golem,
      damageAmount: 40,
      enemyMaxHp: 330,
      enemyCurrentHp: 20, // 20 overkill on 330 HP = low overkill ratio
      killerSpellId: 'syphon_soul',
      isCrit: false,
    });

    expect(result.type).toBe('normal_collapse');
    expect(result.fragility).toBe(0.20);
    expect(result.spellGibMultiplier).toBe(0.3);
    expect(result.gibScore).toBeLessThan(0.35);
  });

  it('triggers partial_dismemberment for moderate hit on cultist', () => {
    const cultist = typedMonsters['cultist_acolyte'];
    const result = DismembermentSystem.calculateDismemberment({
      monsterConfig: cultist,
      damageAmount: 40,
      enemyMaxHp: 75,
      enemyCurrentHp: 30, // 10 overkill
      killerSpellId: 'blood_bolt',
      isCrit: false,
    });

    expect(result.type).toBe('partial_dismemberment');
    expect(result.gibScore).toBeGreaterThanOrEqual(0.35);
    expect(result.gibScore).toBeLessThan(0.72);
  });

  it('always triggers total_destruction when isExecution is true', () => {
    const golem = typedMonsters['flesh_golem'];
    const result = DismembermentSystem.calculateDismemberment({
      monsterConfig: golem,
      damageAmount: 50,
      enemyMaxHp: 330,
      enemyCurrentHp: 10,
      isExecution: true,
      killerSpellId: 'crimson_scythe',
    });

    expect(result.type).toBe('total_destruction');
    expect(result.isExecution).toBe(true);
  });
});
