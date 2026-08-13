import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadHighScores,
  saveHighScore,
  loadBloodCrystals,
  saveBloodCrystals,
  loadTalentLevels,
  saveTalentLevels,
  loadOnboarding,
  saveOnboarding,
  loadDeathState,
  saveDeathState,
  loadDroppedCorpseState,
  saveDroppedCorpseState,
  defaultSettings,
  defaultHighScores,
} from './localStorage';

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Blood Crystals', () => {
    it('returns 0 when nothing is stored', () => {
      expect(loadBloodCrystals()).toBe(0);
    });

    it('saves and loads a valid amount', () => {
      saveBloodCrystals(12345);
      expect(loadBloodCrystals()).toBe(12345);
    });

    it('falls back to 0 on invalid stored values', () => {
      localStorage.setItem('bloodmage_1995_blood_crystals', 'not-a-number');
      expect(loadBloodCrystals()).toBe(0);

      localStorage.setItem('bloodmage_1995_blood_crystals', '99999999999');
      expect(loadBloodCrystals()).toBe(0);
    });

    it('clamps invalid saved amounts to 0', () => {
      saveBloodCrystals(-5);
      expect(loadBloodCrystals()).toBe(0);
    });
  });

  describe('Settings', () => {
    it('returns defaults when nothing is stored', () => {
      expect(loadSettings()).toEqual(defaultSettings);
    });

    it('round-trips settings', () => {
      const custom = { ...defaultSettings, sfxVolume: 0.2, crtFilter: false, controlsMode: 'keyboard' as const };
      saveSettings(custom);
      expect(loadSettings()).toEqual(custom);
    });

    it('sanitizes out-of-range volume to its default', () => {
      localStorage.setItem('bloodmage_1995_settings', JSON.stringify({ ...defaultSettings, sfxVolume: 5 }));
      const loaded = loadSettings();
      expect(loaded.sfxVolume).toBe(0.8);
    });

    it('strips unknown keys via strict schema', () => {
      localStorage.setItem(
        'bloodmage_1995_settings',
        JSON.stringify({ ...defaultSettings, malicious: '__proto__' }),
      );
      const loaded = loadSettings();
      expect(loaded).not.toHaveProperty('malicious');
    });
  });

  describe('High Scores', () => {
    it('returns default highscores when nothing is stored', () => {
      expect(loadHighScores()).toEqual(defaultHighScores);
    });

    it('adds a score and keeps top 10 sorted descending', () => {
      saveHighScore({ score: 100, kills: 10, wave: 1, timeSurvived: '01:00', levelReached: 2 });
      const loaded = loadHighScores();
      expect(loaded).toHaveLength(3);
      expect(loaded[0].score).toBeGreaterThanOrEqual(loaded[1].score);
    });

    it('caps the list at 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        saveHighScore({ score: i, kills: 1, wave: 1, timeSurvived: '00:10', levelReached: 1 });
      }
      expect(loadHighScores()).toHaveLength(10);
    });
  });

  describe('Talents', () => {
    it('returns default talent levels when nothing is stored', () => {
      const loaded = loadTalentLevels();
      expect(loaded.hemomancy_power).toBe(0);
      expect(loaded.tempestade_continua).toBe(0);
    });

    it('round-trips talent levels', () => {
      saveTalentLevels({ hemomancy_power: 3, tempestade_continua: 5 });
      const loaded = loadTalentLevels();
      expect(loaded.hemomancy_power).toBe(3);
      expect(loaded.tempestade_continua).toBe(5);
    });

    it('sanitizes out-of-range talent levels', () => {
      localStorage.setItem('bloodmage_1995_talents', JSON.stringify({ hemomancy_power: 9999 }));
      const loaded = loadTalentLevels();
      expect(loaded.hemomancy_power).toBe(0);
    });
  });

  describe('Onboarding', () => {
    it('returns all-false defaults when nothing is stored', () => {
      const loaded = loadOnboarding();
      expect(loaded.firstKillDone).toBe(false);
      expect(loaded.firstBossSeen).toBe(false);
    });

    it('round-trips onboarding flags', () => {
      saveOnboarding({ firstKillDone: true, firstLevelUpDone: true, firstEquipDone: false, firstBossSeen: true, firstSkillCast: false });
      const loaded = loadOnboarding();
      expect(loaded.firstKillDone).toBe(true);
      expect(loaded.firstLevelUpDone).toBe(true);
      expect(loaded.firstBossSeen).toBe(true);
    });
  });

  describe('Death State', () => {
    it('returns not-dead default', () => {
      expect(loadDeathState().isDefinitivelyDead).toBe(false);
    });

    it('round-trips death state', () => {
      saveDeathState(true, { score: 500 });
      const loaded = loadDeathState();
      expect(loaded.isDefinitivelyDead).toBe(true);
      expect(loaded.gameOverStats.score).toBe(500);
    });
  });

  describe('Corpse State', () => {
    it('returns empty corpse default', () => {
      const loaded = loadDroppedCorpseState();
      expect(loaded.hasDroppedCorpse).toBe(false);
      expect(loaded.itemsInside).toEqual([]);
    });

    it('round-trips corpse state', () => {
      saveDroppedCorpseState({
        hasDroppedCorpse: true,
        zone: 'fosso_chagas',
        x: 12,
        y: 34,
        droppedTimestamp: 1234,
        itemsInside: [{ id: 'item_1', quantity: 2 }],
      });
      const loaded = loadDroppedCorpseState();
      expect(loaded.hasDroppedCorpse).toBe(true);
      expect(loaded.zone).toBe('fosso_chagas');
      expect(loaded.itemsInside[0].quantity).toBe(2);
    });
  });
});
