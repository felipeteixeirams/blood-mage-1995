import { describe, it, expect } from 'vitest';
import { CodexSystem } from './CodexSystem';
import { CodexState } from '../../types/game';

describe('CodexSystem', () => {
  const initialCodexState: CodexState = {
    enemyKills: {},
    unlockedEntries: ['lore_origem_hemomancia'],
    claimedMilestones: {},
  };

  it('retrieves entries filtered by category', () => {
    const enemyEntries = CodexSystem.getEntries('enemies');
    expect(enemyEntries.length).toBeGreaterThan(0);
    expect(enemyEntries.every((e) => e.category === 'enemies')).toBe(true);

    const relicEntries = CodexSystem.getEntries('relics');
    expect(relicEntries.length).toBeGreaterThan(0);
    expect(relicEntries.every((e) => e.category === 'relics')).toBe(true);

    const loreEntries = CodexSystem.getEntries('lore');
    expect(loreEntries.length).toBeGreaterThan(0);
    expect(loreEntries.every((e) => e.category === 'lore')).toBe(true);
  });

  it('finds entry by ID', () => {
    const entry = CodexSystem.getEntryById('skeleton_warrior');
    expect(entry).toBeDefined();
    expect(entry?.title).toBe('Guerreiro Esqueleto');
  });

  it('records kills and unlocks corresponding enemy entry automatically', () => {
    const { nextState, newlyUnlocked } = CodexSystem.recordKill('skeleton_warrior', initialCodexState);
    expect(nextState.enemyKills['skeleton_warrior']).toBe(1);
    expect(nextState.unlockedEntries).toContain('skeleton_warrior');
    expect(newlyUnlocked.some((e) => e.id === 'skeleton_warrior')).toBe(true);
  });

  it('handles milestone claims correctly', () => {
    // 1. Setup state with 10 kills for skeleton_warrior
    const stateWithKills: CodexState = {
      enemyKills: { skeleton_warrior: 10 },
      unlockedEntries: ['skeleton_warrior'],
      claimedMilestones: {},
    };

    // 2. Claim milestone for 1 kill
    const claim1 = CodexSystem.claimMilestone('skeleton_warrior', 1, stateWithKills);
    expect(claim1.success).toBe(true);
    expect(claim1.rewardCrystals).toBe(15);
    expect(claim1.nextState.claimedMilestones['skeleton_warrior']).toContain(1);

    // 3. Claiming same milestone twice should fail
    const claimTwice = CodexSystem.claimMilestone('skeleton_warrior', 1, claim1.nextState);
    expect(claimTwice.success).toBe(false);
    expect(claimTwice.rewardCrystals).toBe(0);

    // 4. Claiming milestone higher than current kills should fail
    const claim50 = CodexSystem.claimMilestone('skeleton_warrior', 50, claim1.nextState);
    expect(claim50.success).toBe(false);
  });

  it('calculates completion percentage accurately', () => {
    const state: CodexState = {
      enemyKills: { skeleton_warrior: 50 },
      unlockedEntries: ['skeleton_warrior', 'lore_origem_hemomancia', 'relic_selo_hemorragico'],
      claimedMilestones: { skeleton_warrior: [1, 10] },
    };

    const pct = CodexSystem.calculateCompletionPercentage(state);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});
