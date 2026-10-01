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
  loadPrestigeData,
  savePrestigeData,
  defaultPrestigeData,
  loadOnboarding,
  saveOnboarding,
  loadDeathState,
  saveDeathState,
  loadDroppedCorpseState,
  saveDroppedCorpseState,
  loadUnlockedRelics,
  saveUnlockedRelics,
  loadEquippedRelicIds,
  saveEquippedRelicIds,
  loadAchievements,
  saveAchievements,
  loadAchievementProgress,
  saveAchievementProgress,
  loadRunStats,
  saveRunStats,
  loadCodexState,
  saveCodexState,
  defaultCodexState,
  loadCampaignState,
  saveCampaignState,
  defaultSettings,
  defaultHighScores,
  defaultCampaignState,
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

    it('clamps amounts exceeding maximum limit to 0', () => {
      saveBloodCrystals(2_000_000_000);
      expect(loadBloodCrystals()).toBe(0);
    });

    it('heals corrupted json in blood crystals', () => {
      localStorage.setItem('bloodmage_1995_blood_crystals', '{invalid_json}');
      expect(loadBloodCrystals()).toBe(0);
      expect(localStorage.getItem('bloodmage_1995_blood_crystals')).toBe('0');
    });
  });

  describe('Settings', () => {
    it('returns defaults when nothing is stored', () => {
      expect(loadSettings()).toEqual(defaultSettings);
    });

    it('round-trips settings including ergonomic options and content intensity', () => {
      const custom = {
        ...defaultSettings,
        sfxVolume: 0.2,
        crtFilter: false,
        controlsMode: 'keyboard' as const,
        virtualStickScale: 'large' as const,
        leftHandedMode: true,
        floatingStick: true,
        contentIntensity: 'reduced' as const,
      };
      saveSettings(custom);
      expect(loadSettings()).toEqual(custom);
    });

    it('sanitizes invalid contentIntensity value to full', () => {
      localStorage.setItem('bloodmage_1995_settings', JSON.stringify({ ...defaultSettings, contentIntensity: 'extreme' }));
      const loaded = loadSettings();
      expect(loaded.contentIntensity).toBe('full');
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
      expect(loaded).toHaveLength(defaultHighScores.length + 1);
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

    it('heals corrupted json in talent levels', () => {
      localStorage.setItem('bloodmage_1995_talents', 'corrupted_string');
      const loaded = loadTalentLevels();
      expect(loaded.hemomancy_power).toBe(0);
      expect(localStorage.getItem('bloodmage_1995_talents')).toContain('hemomancy_power');
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

  describe('Achievements', () => {
    it('returns empty object when nothing is stored', () => {
      expect(loadAchievements()).toEqual({});
    });

    it('round-trips achievement progress', () => {
      const progress = {
        first_blood: { id: 'first_blood', unlocked: true, redeemed: false },
      };
      saveAchievements(progress);
      expect(loadAchievements()).toEqual(progress);
    });

    it('heals corrupted achievement progress JSON', () => {
      localStorage.setItem('bloodmage_1995_achievements', 'invalid_json');
      expect(loadAchievements()).toEqual({});
      expect(localStorage.getItem('bloodmage_1995_achievements')).toBe('{}');
    });
  });

  describe('Relics Persistence', () => {
    it('loads default unlocked relics when nothing is stored', () => {
      const unlocked = loadUnlockedRelics();
      expect(unlocked).toContain('selo_hemorragico');
      expect(unlocked).toContain('olho_de_carmim');
    });

    it('round-trips unlocked relics', () => {
      saveUnlockedRelics(['selo_hemorragico', 'calice_amaldicoado', 'coracao_abissal']);
      const loaded = loadUnlockedRelics();
      expect(loaded).toEqual(['selo_hemorragico', 'calice_amaldicoado', 'coracao_abissal']);
    });

    it('loads default equipped relic IDs when nothing is stored', () => {
      const equipped = loadEquippedRelicIds();
      expect(equipped).toEqual(['selo_hemorragico']);
    });

    it('round-trips equipped relic IDs', () => {
      saveEquippedRelicIds(['selo_hemorragico', 'olho_de_carmim']);
      const loaded = loadEquippedRelicIds();
      expect(loaded).toEqual(['selo_hemorragico', 'olho_de_carmim']);
    });
  });

  describe('Achievement Progress & Legacy Migration', () => {
    it('returns empty object when nothing is stored', () => {
      expect(loadAchievementProgress()).toEqual({});
    });

    it('round-trips achievement progress records', () => {
      const records = {
        slayer_1: { id: 'slayer_1', unlockedAt: 12345678, progress: 100, complete: true },
      };
      saveAchievementProgress(records);
      expect(loadAchievementProgress()).toEqual(records);
    });

    it('migrates legacy "achievements_progress" key when new key is absent', () => {
      const legacyRecords = {
        legacy_1: { id: 'legacy_1', unlockedAt: null, progress: 50, complete: false },
      };
      localStorage.setItem('achievements_progress', JSON.stringify(legacyRecords));

      const loaded = loadAchievementProgress();
      expect(loaded).toEqual(legacyRecords);
      expect(localStorage.getItem('achievements_progress')).toBeNull();
      expect(localStorage.getItem('bloodmage_1995_achievements_progress')).not.toBeNull();
    });

    it('handles corrupted JSON gracefully in achievement progress', () => {
      localStorage.setItem('bloodmage_1995_achievements_progress', '{corrupted');
      expect(loadAchievementProgress()).toEqual({});
    });
  });

  describe('Run Stats Persistence', () => {
    it('returns default zeroed run stats when nothing is stored', () => {
      const stats = loadRunStats();
      expect(stats.kills_total).toBe(0);
      expect(stats.dismemberments_total).toBe(0);
    });

    it('round-trips valid run stats', () => {
      const customStats = {
        bloodless_floor: 1,
        kills_total: 42,
        kills_gargoyle: 3,
        speedrun_f3: 120,
        deaths_total: 2,
        hp_healed_magic: 500,
        dismemberments_total: 15,
        mana_orbs_run: 8,
        crystals_hoarded: 250,
        survival_time_run: 600,
        floor_depth_max: 4,
        spells_unlocked_total: 3,
        knockouts_total: 0,
      };
      saveRunStats(customStats);
      expect(loadRunStats()).toEqual(customStats);
    });

    it('heals corrupted run stats JSON back to defaults', () => {
      localStorage.setItem('bloodmage_1995_run_stats', 'invalid-json');
      const stats = loadRunStats();
      expect(stats.kills_total).toBe(0);
    });
  });

  describe('Campaign State (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md — persistência)', () => {
    it('returns defaults when nothing is stored', () => {
      expect(loadCampaignState()).toEqual(defaultCampaignState);
    });

    it('round-trips zone, quests and unlocked spells', () => {
      const custom = {
        gameMode: 'campaign' as const,
        currentZone: 'gloomy_woods' as const,
        chapter: 1,
        storyFlags: { maelen_intro_seen: true },
        quests: {
          quest_ch1_first_steps: {
            questId: 'quest_ch1_first_steps',
            status: 'active' as const,
            currentObjectiveIndex: 0,
            objectivesProgress: { obj_loot_chest: 1, obj_clear_woods: 2 },
          },
        },
        discoveredZones: ['safe_house' as const, 'gloomy_woods' as const],
        unlockedSpellIds: ['blood_bolt'],
      };
      saveCampaignState(custom);
      expect(loadCampaignState()).toEqual(custom);
    });

    it('falls back to defaults on corrupted JSON', () => {
      localStorage.setItem('bloodmage_1995_campaign_state', '{not valid json');
      expect(loadCampaignState()).toEqual(defaultCampaignState);
    });

    it('sanitizes an invalid gameMode/zone back to defaults for those fields', () => {
      localStorage.setItem(
        'bloodmage_1995_campaign_state',
        JSON.stringify({ ...defaultCampaignState, gameMode: 'god_mode', currentZone: 'nowhere' }),
      );
      const loaded = loadCampaignState();
      expect(loaded.gameMode).toBe('arcade');
      expect(loaded.currentZone).toBe('safe_house');
    });

    it('strips unknown keys via strict schema (prototype pollution guard)', () => {
      localStorage.setItem(
        'bloodmage_1995_campaign_state',
        JSON.stringify({ ...defaultCampaignState, malicious: '__proto__' }),
      );
      const loaded = loadCampaignState();
      expect(loaded).not.toHaveProperty('malicious');
    });

    it('never persists activeDialogueTree/activeDialogueNodeId (session-only, not part of the shape)', () => {
      saveCampaignState({ ...defaultCampaignState, gameMode: 'campaign' } as any);
      const raw = localStorage.getItem('bloodmage_1995_campaign_state');
      expect(raw).not.toContain('activeDialogueTree');
      expect(raw).not.toContain('activeDialogueNodeId');
    });
  });

  describe('Prestige Persistence', () => {
    it('returns default prestige data when nothing is stored', () => {
      expect(loadPrestigeData()).toEqual(defaultPrestigeData);
    });

    it('round-trips prestige data', () => {
      const data = {
        ...defaultPrestigeData,
        level: 2,
        unspentSealPoints: 1,
        seals: { ...defaultPrestigeData.seals, carnage: 1 },
      };
      savePrestigeData(data);
      expect(loadPrestigeData()).toEqual(data);
    });

    it('falls back to default on corrupted JSON', () => {
      localStorage.setItem('bloodmage_1995_prestige', '{invalid_json}');
      expect(loadPrestigeData()).toEqual(defaultPrestigeData);
    });
  });

  describe('Codex State Persistence', () => {
    it('returns default codex state when nothing is stored', () => {
      expect(loadCodexState()).toEqual(defaultCodexState);
    });

    it('round-trips codex state', () => {
      const state = {
        enemyKills: { skeleton_warrior: 10 },
        unlockedEntries: ['lore_origem_hemomancia', 'enemy_skeleton_warrior'],
        claimedMilestones: { skeleton_warrior: [10] },
      };
      saveCodexState(state);
      expect(loadCodexState()).toEqual(state);
    });
  });

  describe('Run Stats Persistence', () => {
    it('returns empty run stats when nothing is stored', () => {
      const loaded = loadRunStats();
      expect(loaded.kills_total).toBe(0);
      expect(loaded.floor_depth_max).toBe(0);
    });

    it('round-trips run stats', () => {
      const stats = {
        bloodless_floor: 1,
        kills_total: 50,
        kills_gargoyle: 2,
        speedrun_f3: 120,
        deaths_total: 5,
        hp_healed_magic: 300,
        dismemberments_total: 12,
        mana_orbs_run: 25,
        crystals_hoarded: 100,
        survival_time_run: 600,
        floor_depth_max: 3,
        spells_unlocked_total: 4,
        knockouts_total: 0,
      };
      saveRunStats(stats);
      expect(loadRunStats()).toEqual(stats);
    });
  });

  describe('Achievement Progress Persistence (AchievementSystem)', () => {
    it('returns empty object when nothing is stored', () => {
      expect(loadAchievementProgress()).toEqual({});
    });

    it('round-trips achievement progress records', () => {
      const progress = {
        first_blood: { id: 'first_blood', unlockedAt: 1000, progress: 100, complete: true },
      };
      saveAchievementProgress(progress);
      expect(loadAchievementProgress()).toEqual(progress);
    });

    it('migrates legacy achievement progress key if present', () => {
      const legacyData = {
        first_blood: { id: 'first_blood', unlockedAt: 1000, progress: 100, complete: true },
      };
      localStorage.setItem('achievements_progress', JSON.stringify(legacyData));
      const loaded = loadAchievementProgress();
      expect(loaded).toEqual(legacyData);
      expect(localStorage.getItem('achievements_progress')).toBeNull();
      expect(localStorage.getItem('bloodmage_1995_achievements_progress')).not.toBeNull();
    });
  });
});
