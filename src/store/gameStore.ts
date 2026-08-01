import { create } from 'zustand';
import { PlayerStats, UpgradeOption, GameSettings, HighScoreRecord } from '../types/game';
import { loadSettings, saveSettings, loadHighScores, saveHighScore } from '../utils/localStorage';
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

  // Modals
  isBestiaryOpen: boolean;
  setBestiaryOpen: (isOpen: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
  isHighScoresOpen: boolean;
  setHighScoresOpen: (isOpen: boolean) => void;

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
  activeSkillTrigger: 'nova' | 'syphon' | 'bone_shield' | null;
  setActiveSkillTrigger: (skill: 'nova' | 'syphon' | 'bone_shield' | null) => void;

  // Boss Status
  bossHealth: number;
  bossMaxHealth: number;
  bossActive: boolean;
  bossName: string;
  updateBossHealth: (hp: number, maxHp: number) => void;
  setBossActive: (active: boolean, name?: string, maxHp?: number) => void;
}

const defaultPlayerStats: PlayerStats = {
  hp: 100, maxHp: 100,
  mana: 100, maxMana: 100,
  level: 1, currentXp: 0, nextLevelXp: 50,
  moveSpeed: 160, damageMultiplier: 1.0, cooldownReduction: 0,
  vampirism: 0, projectileBonus: 0,
  kills: 0, souls: 0, wave: 1, floorDepth: 1, score: 0, timeSurvivedSeconds: 0,
  unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield'],
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

  bossHealth: 0,
  bossMaxHealth: 100,
  bossActive: false,
  bossName: '',
  updateBossHealth: (hp, maxHp) => set({ bossHealth: hp, bossMaxHealth: maxHp }),
  setBossActive: (active, name = '', maxHp = 100) => set({
    bossActive: active,
    bossName: name,
    bossHealth: maxHp,
    bossMaxHealth: maxHp,
  }),
}));
