import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadBloodCrystals,
  saveBloodCrystals,
  loadTalentLevels,
  saveTalentLevels,
  loadSettings,
  saveSettings,
  loadHighScores,
  saveHighScore,
  loadDroppedCorpseState,
  saveDroppedCorpseState,
  defaultSettings,
  defaultTalents,
  defaultHighScores,
} from '../localStorage';

// Create a mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

const mockLocalStorage = new LocalStorageMock();
global.localStorage = mockLocalStorage as unknown as Storage;

describe('localStorage utility tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Blood Crystals persistence', () => {
    it('should return 0 when no crystals are saved', () => {
      expect(loadBloodCrystals()).toBe(0);
    });

    it('should correctly save and load blood crystals', () => {
      saveBloodCrystals(150);
      expect(loadBloodCrystals()).toBe(150);
    });

    it('should fallback to 0 when parsing an invalid/negative amount', () => {
      saveBloodCrystals(-10); // fails Zod non-negative check
      expect(loadBloodCrystals()).toBe(0);
    });

    it('should fallback to 0 when raw localStorage value is invalid', () => {
      mockLocalStorage.setItem('bloodmage_1995_blood_crystals', 'not-a-number');
      expect(loadBloodCrystals()).toBe(0);
    });
  });

  describe('Talent Levels persistence', () => {
    it('should load default talents when none are saved', () => {
      const loaded = loadTalentLevels();
      expect(loaded.hemomancy_power).toBe(0);
      expect(loaded.vampirismo_profundo).toBe(0);
    });

    it('should save and load valid talents', () => {
      const myTalents = {
        hemomancy_power: 3,
        vampirismo_profundo: 5,
        execucoes_em_area: 1,
        martyr_vitality: 0,
        escudo_ossos_aprimorado: 2,
        aura_de_medo: 1,
        abyssal_haste: 4,
        sobrecarga_runica: 0,
        tempestade_continua: 0,
      };
      saveTalentLevels(myTalents);
      const loaded = loadTalentLevels();
      expect(loaded.hemomancy_power).toBe(3);
      expect(loaded.vampirismo_profundo).toBe(5);
    });

    it('should filter extra/corrupt keys using strict Zod schema', () => {
      const corruptTalents = {
        hemomancy_power: 2,
        vampirismo_profundo: 1,
        execucoes_em_area: 0,
        martyr_vitality: 0,
        escudo_ossos_aprimorado: 0,
        aura_de_medo: 0,
        abyssal_haste: 0,
        sobrecarga_runica: 0,
        tempestade_continua: 0,
        hack_multiplier: 9999, // extra key
      };
      saveTalentLevels(corruptTalents);
      const loaded = loadTalentLevels();
      // Should fallback to default because of strict check failure or strip the key
      expect(loaded.hemomancy_power).toBe(0); // falls back to defaults
    });
  });

  describe('Settings persistence', () => {
    it('should return default settings when nothing is saved', () => {
      expect(loadSettings()).toEqual(defaultSettings);
    });

    it('should save and load valid settings', () => {
      const customSettings = {
        ...defaultSettings,
        sfxVolume: 0.5,
        bgmVolume: 0.25,
        crtFilter: false,
      };
      saveSettings(customSettings);
      expect(loadSettings().sfxVolume).toBe(0.5);
      expect(loadSettings().bgmVolume).toBe(0.25);
      expect(loadSettings().crtFilter).toBe(false);
    });

    it('should fallback to defaults when settings are corrupt', () => {
      mockLocalStorage.setItem('bloodmage_1995_settings', '{invalid-json}');
      expect(loadSettings()).toEqual(defaultSettings);
    });
  });

  describe('High Scores persistence', () => {
    it('should return default highscores when none exist', () => {
      expect(loadHighScores()).toEqual(defaultHighScores);
    });

    it('should append, sort, and save high score records properly', () => {
      const testRecord = {
        score: 50000,
        kills: 350,
        wave: 8,
        timeSurvived: '15:30',
        levelReached: 20,
      };
      const updatedScores = saveHighScore(testRecord);

      expect(updatedScores.length).toBeGreaterThan(1);
      expect(updatedScores[0].score).toBe(50000); // Top score
      expect(updatedScores[0].kills).toBe(350);
    });
  });

  describe('Corpse retrieval persistence', () => {
    it('should return default corpse state when none is saved', () => {
      const loaded = loadDroppedCorpseState();
      expect(loaded.hasDroppedCorpse).toBe(false);
    });

    it('should save and load corpse state successfully', () => {
      const corpseData = {
        hasDroppedCorpse: true,
        zone: 'fosso_chagas',
        x: 450,
        y: 600,
        droppedTimestamp: 12345678,
        itemsInside: [
          { id: 'relic_blood_chalice', quantity: 1 }
        ]
      };
      saveDroppedCorpseState(corpseData);
      const loaded = loadDroppedCorpseState();
      expect(loaded.hasDroppedCorpse).toBe(true);
      expect(loaded.zone).toBe('fosso_chagas');
      expect(loaded.x).toBe(450);
      expect(loaded.itemsInside[0].id).toBe('relic_blood_chalice');
    });
  });
});
