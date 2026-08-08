import { create } from 'zustand';
import { PlayerStats, UpgradeOption, GameSettings, HighScoreRecord, LootItem, EquipmentSlots, BiomeType } from '../types/game';
import { loadSettings, saveSettings, loadHighScores, saveHighScore, loadBloodCrystals, saveBloodCrystals, loadTalentLevels, saveTalentLevels } from '../utils/localStorage';
import { soundEngine } from '../utils/soundEngine';

type GameStateStatus = 'menu' | 'playing' | 'paused';

interface GameStore {
  // Game Status
  gameState: GameStateStatus;
  setGameState: (state: GameStateStatus) => void;

  // Settings
  settings: GameSettings;
  updateSettings: (settings: GameSettings) => void;
  
  // High Scores
  highScores: HighScoreRecord[];
  addHighScore: (score: Omit<HighScoreRecord, 'id' | 'date'>) => void;

  // Audio
  isMuted: boolean;
  toggleMute: () => void;

  // Modals & UI overlays
  isBestiaryOpen: boolean;
  setBestiaryOpen: (isOpen: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
  isHighScoresOpen: boolean;
  setHighScoresOpen: (isOpen: boolean) => void;
  isTalentsOpen: boolean;
  setTalentsOpen: (isOpen: boolean) => void;
  isInventoryOpen: boolean;
  setInventoryOpen: (isOpen: boolean) => void;
  isObservabilityOpen: boolean;
  setObservabilityOpen: (isOpen: boolean) => void;
  isRecordsOpen: boolean;
  setRecordsOpen: (isOpen: boolean) => void;

  // Metagame Currency & Talents
  bloodCrystals: number;
  addBloodCrystals: (amount: number) => void;
  talentLevels: Record<string, number>;
  upgradeTalent: (talentId: string, cost: number) => boolean;

  // Equipment & Loot
  equipment: EquipmentSlots;
  equipItem: (item: LootItem) => void;
  recentLootLog: string[];
  addLootLog: (msg: string) => void;

  // Biome & Environment
  currentBiome: BiomeType;
  setCurrentBiome: (biome: BiomeType) => void;

  // Gameplay Events
  levelUpData: { level: number; choices: UpgradeOption[] } | null;
  setLevelUpData: (data: { level: number; choices: UpgradeOption[] } | null) => void;
  gameOverStats: PlayerStats | null;
  setGameOverStats: (stats: PlayerStats | null) => void;

  // Real-time Stats
  playerStats: PlayerStats;
  setPlayerStats: (stats: PlayerStats) => void;

  // Controls (Touch/Skills)
  touchMoveInput: { x: number; y: number };
  setTouchMoveInput: (x: number, y: number) => void;
  touchAimInput: { x: number; y: number };
  setTouchAimInput: (x: number, y: number) => void;
  activeSkillTrigger: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam' | null;
  setActiveSkillTrigger: (skill: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam' | null) => void;

  /** 4 spell IDs the player has pinned to the HUD skill bar */
  skillPreset: string[];
  setSkillPreset: (preset: string[]) => void;
}

const defaultPlayerStats: PlayerStats = {
  hp: 100, maxHp: 100,
  mana: 100, maxMana: 100,
  level: 1, currentXp: 0, nextLevelXp: 50,
  moveSpeed: 160, damageMultiplier: 1.0, cooldownReduction: 0,
  vampirism: 0, projectileBonus: 0,
  kills: 0, souls: 0, wave: 1, floorDepth: 1, score: 0, timeSurvivedSeconds: 0,
  unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe', 'blood_ritual_circle', 'hemomancy_beam'],
  pendingStatPoints: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  setGameState: (state) => set({ gameState: state }),

  settings: loadSettings(),
  updateSettings: (newSettings) => {
    saveSettings(newSettings);
    soundEngine.setVolumes(newSettings.sfxVolume, newSettings.bgmVolume);
    set({ settings: newSettings });
  },

  highScores: loadHighScores(),
  addHighScore: (scoreData) => {
    const updated = saveHighScore(scoreData);
    set({ highScores: updated });
  },

  isMuted: false,
  toggleMute: () => {
    const muted = soundEngine.toggleMute();
    set({ isMuted: muted });
  },

  isBestiaryOpen: false,
  setBestiaryOpen: (isOpen) => set({ isBestiaryOpen: isOpen }),
  isSettingsOpen: false,
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  isHighScoresOpen: false,
  setHighScoresOpen: (isOpen) => set({ isHighScoresOpen: isOpen }),
  isTalentsOpen: false,
  setTalentsOpen: (isOpen) => set({ isTalentsOpen: isOpen }),
  isInventoryOpen: false,
  setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
  isObservabilityOpen: false,
  setObservabilityOpen: (isOpen) => set({ isObservabilityOpen: isOpen }),
  isRecordsOpen: false,
  setRecordsOpen: (isOpen) => set({ isRecordsOpen: isOpen }),

  bloodCrystals: loadBloodCrystals(),
  addBloodCrystals: (amount) => {
    const current = get().bloodCrystals;
    const next = current + amount;
    saveBloodCrystals(next);
    set({ bloodCrystals: next });
  },

  talentLevels: loadTalentLevels(),
  upgradeTalent: (talentId, cost) => {
    const { bloodCrystals, talentLevels } = get();
    if (bloodCrystals < cost) return false;

    const nextCrystals = bloodCrystals - cost;
    const currentLvl = talentLevels[talentId] || 0;
    const nextTalents = { ...talentLevels, [talentId]: currentLvl + 1 };

    saveBloodCrystals(nextCrystals);
    saveTalentLevels(nextTalents);

    set({
      bloodCrystals: nextCrystals,
      talentLevels: nextTalents,
    });
    return true;
  },

  equipment: {
    weapon: null,
    armor: null,
    relics: [],
  },
  equipItem: (item) => {
    const { equipment } = get();
    const updated = { ...equipment };
    if (item.type === 'weapon') {
      updated.weapon = item;
    } else if (item.type === 'armor') {
      updated.armor = item;
    } else if (item.type === 'relic') {
      // Up to 3 relics, replaces oldest if full
      if (updated.relics.length < 3) {
        updated.relics = [...updated.relics, item];
      } else {
        updated.relics = [updated.relics[1], updated.relics[2], item];
      }
    }
    set({ equipment: updated });
  },

  recentLootLog: [],
  addLootLog: (msg) => {
    const current = get().recentLootLog;
    set({ recentLootLog: [msg, ...current].slice(0, 5) });
  },

  currentBiome: 'fosso_chagas',
  setCurrentBiome: (biome) => set({ currentBiome: biome }),

  levelUpData: null,
  setLevelUpData: (data) => set({ levelUpData: data }),
  
  gameOverStats: null,
  setGameOverStats: (stats) => set({ gameOverStats: stats }),

  playerStats: { ...defaultPlayerStats },
  setPlayerStats: (stats) => set({ playerStats: stats }),

  touchMoveInput: { x: 0, y: 0 },
  setTouchMoveInput: (x, y) => set({ touchMoveInput: { x, y } }),
  
  touchAimInput: { x: 0, y: 0 },
  setTouchAimInput: (x, y) => set({ touchAimInput: { x, y } }),

  activeSkillTrigger: null,
  setActiveSkillTrigger: (skill) => set({ activeSkillTrigger: skill }),

  skillPreset: ['hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe'],
  setSkillPreset: (preset) => set({ skillPreset: preset }),
}));
