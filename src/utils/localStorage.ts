import { GameSettings, HighScoreRecord } from '../types/game';

const SETTINGS_KEY = 'bloodmage_1995_settings';
const HIGHSCORES_KEY = 'bloodmage_1995_highscores';
const BLOOD_CRYSTALS_KEY = 'bloodmage_1995_blood_crystals';
const TALENTS_KEY = 'bloodmage_1995_talents';

export function loadBloodCrystals(): number {
  try {
    const raw = localStorage.getItem(BLOOD_CRYSTALS_KEY);
    if (raw) return parseInt(raw, 10) || 0;
  } catch (e) {
    console.warn('Failed to load blood crystals', e);
  }
  return 0;
}

export function saveBloodCrystals(amount: number): void {
  try {
    localStorage.setItem(BLOOD_CRYSTALS_KEY, amount.toString());
  } catch (e) {
    console.warn('Failed to save blood crystals', e);
  }
}

export function loadTalentLevels(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TALENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load talents', e);
  }
  return {
    hemomancy_power: 0,
    martyr_vitality: 0,
    vampiric_thirst: 0,
    abyssal_haste: 0,
    sacrifice_mastery: 0,
  };
}

export function saveTalentLevels(talents: Record<string, number>): void {
  try {
    localStorage.setItem(TALENTS_KEY, JSON.stringify(talents));
  } catch (e) {
    console.warn('Failed to save talents', e);
  }
}

export const defaultSettings: GameSettings = {
  crtFilter: true,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
  touchSensitivity: 1.0,
  virtualControlsOpacity: 0.7,
  controlsMode: 'auto',
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage', e);
  }
}

export function loadHighScores(): HighScoreRecord[] {
  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load highscores', e);
  }
  return [
    {
      id: 'default-1',
      date: '1995-10-31',
      score: 12500,
      kills: 184,
      wave: 5,
      timeSurvived: '08:42',
      levelReached: 12,
    },
    {
      id: 'default-2',
      date: '1995-11-01',
      score: 8400,
      kills: 112,
      wave: 4,
      timeSurvived: '05:15',
      levelReached: 8,
    }
  ];
}

export function saveHighScore(newRecord: Omit<HighScoreRecord, 'id' | 'date'>): HighScoreRecord[] {
  const currentScores = loadHighScores();
  const record: HighScoreRecord = {
    ...newRecord,
    id: `hs_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
  };

  const updated = [...currentScores, record]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Keep top 10

  try {
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save highscore', e);
  }
  return updated;
}
