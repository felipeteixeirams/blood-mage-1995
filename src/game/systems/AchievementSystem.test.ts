import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementSystem } from './AchievementSystem';

describe('AchievementSystem', () => {
  let system: AchievementSystem;

  beforeEach(() => {
    localStorage.clear();
    system = new AchievementSystem();
  });

  it('initializes default achievements correctly', () => {
    const all = system.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(system.getTotalCount()).toBe(all.length);
    expect(system.getUnlockedCount()).toBe(0);

    const firstBlood = system.getAchievement('first_blood');
    expect(firstBlood).not.toBeNull();
    expect(firstBlood?.name).toBe('Primeiro Sangue');
  });

  it('returns null for non-existent achievement', () => {
    expect(system.getAchievement('non_existent')).toBeNull();
    expect(system.getProgress('non_existent')).toBeNull();
  });

  it('unlocks achievement and fires unlock callbacks', () => {
    const callback = vi.fn();
    system.onUnlock(callback);

    const unlocked = system.unlock('first_blood');
    expect(unlocked).not.toBeNull();
    expect(unlocked?.id).toBe('first_blood');
    expect(system.getUnlockedCount()).toBe(1);
    expect(callback).toHaveBeenCalledWith(unlocked);

    // Unlocking again should return null and not re-trigger
    const reUnlocked = system.unlock('first_blood');
    expect(reUnlocked).toBeNull();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('updates progress and automatically unlocks at 100%', () => {
    system.updateProgress('slayer_10', 50);
    let prog = system.getProgress('slayer_10');
    expect(prog?.progress).toBe(50);
    expect(prog?.complete).toBe(false);

    system.updateProgress('slayer_10', 100);
    prog = system.getProgress('slayer_10');
    expect(prog?.progress).toBe(100);
    expect(prog?.complete).toBe(true);
    expect(system.getUnlockedCount()).toBe(1);
  });

  it('increments progress with default or specified amounts', () => {
    system.incrementProgress('slayer_50'); // defaults to +1
    expect(system.getProgress('slayer_50')?.progress).toBe(1);

    system.incrementProgress('slayer_50', 25);
    expect(system.getProgress('slayer_50')?.progress).toBe(26);
  });

  it('persists progress in localStorage and restores it', () => {
    system.unlock('first_blood');
    system.updateProgress('wealth_1000', 45);

    // Create a new system instance to load from localStorage
    const newSystem = new AchievementSystem();
    expect(newSystem.getUnlockedCount()).toBe(1);
    expect(newSystem.getProgress('wealth_1000')?.progress).toBe(45);
  });

  it('resets all achievements', () => {
    system.unlock('first_blood');
    system.updateProgress('wealth_1000', 80);
    expect(system.getUnlockedCount()).toBe(1);

    system.resetAll();

    expect(system.getUnlockedCount()).toBe(0);
    expect(system.getProgress('wealth_1000')?.progress).toBe(0);
    expect(system.getProgress('first_blood')?.complete).toBe(false);
  });
});
