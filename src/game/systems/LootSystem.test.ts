import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LootSystem } from './LootSystem';

vi.mock('../../utils/telemetry', () => ({
  telemetry: {
    trackEvent: vi.fn(),
  },
}));

describe('LootSystem', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rolls loot chance correctly based on probability threshold', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.20);
    expect(LootSystem.rollLootChance()).toBe(true);

    vi.spyOn(Math, 'random').mockReturnValue(0.30);
    expect(LootSystem.rollLootChance()).toBe(false);
  });

  it('generates common loot from monster drop when random rolls low', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1) // common rarity
      .mockReturnValueOnce(0.1) // weapon type
      .mockReturnValueOnce(0.0) // name index
      .mockReturnValueOnce(0.1); // id random

    const loot = LootSystem.generateLoot(1, false);
    expect(loot.rarity).toBe('common');
    expect(loot.type).toBe('weapon');
    expect(loot.stats.damageMultiplier).toBeDefined();
    expect(loot.stats.critChanceBonus).toBeDefined();
  });

  it('generates legendary loot from chest when high roll occurs', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9) // legendary rarity
      .mockReturnValueOnce(0.5) // armor type (<0.70)
      .mockReturnValueOnce(0.0) // name index
      .mockReturnValueOnce(0.5); // id random

    const loot = LootSystem.generateLoot(5, true);
    expect(loot.rarity).toBe('legendary');
    expect(loot.type).toBe('armor');
    expect(loot.stats.maxHpBonus).toBeGreaterThan(0);
    expect(loot.stats.hpRegenBonus).toBeGreaterThan(0);
  });

  it('generates relic loot and scales stats with floor depth', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.90) // rare rarity
      .mockReturnValueOnce(0.85) // relic type (>0.70)
      .mockReturnValueOnce(0.0) // name index
      .mockReturnValueOnce(0.5);

    const floor1Relic = LootSystem.generateLoot(1, false);

    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.90) // rare rarity
      .mockReturnValueOnce(0.85) // relic type (>0.70)
      .mockReturnValueOnce(0.0) // name index
      .mockReturnValueOnce(0.5);

    const floor10Relic = LootSystem.generateLoot(10, false);

    expect(floor10Relic.stats.speedBonus!).toBeGreaterThan(floor1Relic.stats.speedBonus!);
    expect(floor10Relic.stats.maxHpBonus!).toBeGreaterThan(floor1Relic.stats.maxHpBonus!);
  });
});
