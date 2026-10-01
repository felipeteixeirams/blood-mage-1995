import codexDataRaw from '../../data/codex.json';
import { CodexEntry, CodexState, CodexCategory, CodexMilestone } from '../../types/game';

export const codexEntries: CodexEntry[] = codexDataRaw as CodexEntry[];

export class CodexSystem {
  /**
   * Retrieves all codex entries, optionally filtered by category.
   */
  public static getEntries(category?: CodexCategory): CodexEntry[] {
    if (!category) return codexEntries;
    return codexEntries.filter((entry) => entry.category === category);
  }

  /**
   * Retrieves a single codex entry by ID.
   */
  public static getEntryById(id: string): CodexEntry | undefined {
    return codexEntries.find((entry) => entry.id === id);
  }

  /**
   * Checks whether a codex entry is unlocked for the player.
   */
  public static isEntryUnlocked(entry: CodexEntry, state: CodexState): boolean {
    if (state.unlockedEntries.includes(entry.id)) return true;

    // Check if monster kill count unlocks the entry
    if (entry.monsterId) {
      const kills = state.enemyKills[entry.monsterId] || 0;
      if (kills >= 1) return true;
    }

    return false;
  }

  /**
   * Records an enemy kill in the codex state.
   * Unlocks corresponding codex entry if it was locked.
   */
  public static recordKill(
    monsterId: string,
    state: CodexState
  ): { nextState: CodexState; newlyUnlocked: CodexEntry[] } {
    const currentKills = state.enemyKills[monsterId] || 0;
    const newKills = currentKills + 1;

    const nextEnemyKills = {
      ...state.enemyKills,
      [monsterId]: newKills,
    };

    const newlyUnlocked: CodexEntry[] = [];
    const nextUnlockedEntries = [...state.unlockedEntries];

    codexEntries.forEach((entry) => {
      if (entry.monsterId === monsterId && !nextUnlockedEntries.includes(entry.id)) {
        nextUnlockedEntries.push(entry.id);
        newlyUnlocked.push(entry);
      }
    });

    const nextState: CodexState = {
      ...state,
      enemyKills: nextEnemyKills,
      unlockedEntries: nextUnlockedEntries,
    };

    return { nextState, newlyUnlocked };
  }

  /**
   * Unlocks a specific entry by ID (e.g., lore or relic discovered).
   */
  public static unlockEntry(entryId: string, state: CodexState): CodexState {
    if (state.unlockedEntries.includes(entryId)) return state;
    return {
      ...state,
      unlockedEntries: [...state.unlockedEntries, entryId],
    };
  }

  /**
   * Claims a milestone reward for an entry if kill count requirement is met and not yet claimed.
   */
  public static claimMilestone(
    entryId: string,
    killCount: number,
    state: CodexState
  ): { success: boolean; rewardCrystals: number; nextState: CodexState } {
    const entry = this.getEntryById(entryId);
    if (!entry || !entry.milestones || !entry.monsterId) {
      return { success: false, rewardCrystals: 0, nextState: state };
    }

    const milestone = entry.milestones.find((m) => m.killCount === killCount);
    if (!milestone) {
      return { success: false, rewardCrystals: 0, nextState: state };
    }

    const currentKills = state.enemyKills[entry.monsterId] || 0;
    if (currentKills < killCount) {
      return { success: false, rewardCrystals: 0, nextState: state };
    }

    const claimedForEntry = state.claimedMilestones[entryId] || [];
    if (claimedForEntry.includes(killCount)) {
      return { success: false, rewardCrystals: 0, nextState: state };
    }

    const nextClaimedMilestones = {
      ...state.claimedMilestones,
      [entryId]: [...claimedForEntry, killCount],
    };

    const nextState: CodexState = {
      ...state,
      claimedMilestones: nextClaimedMilestones,
    };

    return {
      success: true,
      rewardCrystals: milestone.rewardCrystals,
      nextState,
    };
  }

  /**
   * Calculates overall lore/codex completion percentage (0 to 100).
   */
  public static calculateCompletionPercentage(state: CodexState): number {
    if (codexEntries.length === 0) return 100;

    let totalPoints = 0;
    let earnedPoints = 0;

    codexEntries.forEach((entry) => {
      // 1 point for unlocking the entry
      totalPoints += 1;
      if (this.isEntryUnlocked(entry, state)) {
        earnedPoints += 1;
      }

      // 1 point for each milestone claimed
      if (entry.milestones) {
        totalPoints += entry.milestones.length;
        const claimed = state.claimedMilestones[entry.id] || [];
        earnedPoints += claimed.length;
      }
    });

    if (totalPoints === 0) return 100;
    return Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
  }
}
