import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementSystem } from './AchievementSystem';

describe('AchievementSystem', () => {
  let achievementSystem: AchievementSystem;

  beforeEach(() => {
    localStorage.clear();
    achievementSystem = new AchievementSystem();
  });

  it('initializes default achievements correctly', () => {
    const total = achievementSystem.getTotalCount();
    expect(total).toBeGreaterThan(0);
    expect(achievementSystem.getAchievement('first_blood')).not.toBeNull();
  });

  it('unlocks achievement and triggers callback', () => {
    const callback = vi.fn();
    achievementSystem.onUnlock(callback);

    const unlocked = achievementSystem.unlock('first_blood');
    expect(unlocked).not.toBeNull();
    expect(unlocked?.id).toBe('first_blood');
    expect(callback).toHaveBeenCalledWith(unlocked);

    const progress = achievementSystem.getProgress('first_blood');
    expect(progress?.complete).toBe(true);
    expect(progress?.unlockedAt).not.toBeNull();
  });

  it('prevents double unlock', () => {
    achievementSystem.unlock('first_blood');
    const secondTry = achievementSystem.unlock('first_blood');
    expect(secondTry).toBeNull();
  });

  it('updates and increments progress toward auto-unlock', () => {
    achievementSystem.updateProgress('slayer_10', 50);
    expect(achievementSystem.getProgress('slayer_10')?.progress).toBe(50);
    expect(achievementSystem.getProgress('slayer_10')?.complete).toBe(false);

    achievementSystem.incrementProgress('slayer_10', 50);
    expect(achievementSystem.getProgress('slayer_10')?.complete).toBe(true);
  });

  it('lists unlocked achievements and counts', () => {
    expect(achievementSystem.getUnlockedCount()).toBe(0);
    achievementSystem.unlock('first_blood');
    achievementSystem.unlock('no_damage');

    expect(achievementSystem.getUnlockedCount()).toBe(2);
    expect(achievementSystem.getUnlocked()).toHaveLength(2);
  });

  it('resets all achievements correctly', () => {
    achievementSystem.unlock('first_blood');
    expect(achievementSystem.getUnlockedCount()).toBe(1);

    achievementSystem.resetAll();
    expect(achievementSystem.getUnlockedCount()).toBe(0);
    expect(achievementSystem.getProgress('first_blood')?.complete).toBe(false);
  });
});
