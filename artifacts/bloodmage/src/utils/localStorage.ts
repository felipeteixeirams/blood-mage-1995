import { z } from 'zod';
import { GameSettings, HighScoreRecord } from '../types/game';

const SETTINGS_KEY = 'bloodmage_1995_settings';
const HIGHSCORES_KEY = 'bloodmage_1995_highscores';
const BLOOD_CRYSTALS_KEY = 'bloodmage_1995_blood_crystals';
const TALENTS_KEY = 'bloodmage_1995_talents';

// Schema for Blood Crystals validation
const BloodCrystalsSchema = z.number().int().nonnegative().max(1_000_000_000);

export function loadBloodCrystals(): number {
  try {
    const raw = localStorage.getItem(BLOOD_CRYSTALS_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      const validated = BloodCrystalsSchema.safeParse(Number.isNaN(parsed) ? 0 : parsed);
      return validated.success ? validated.data : 0;
    }
  } catch (e) {
    console.warn('Failed to load blood crystals', e);
  }
  return 0;
}

export function saveBloodCrystals(amount: number): void {
  try {
    const validated = BloodCrystalsSchema.safeParse(amount);
    const valueToSave = validated.success ? validated.data : 0;
    localStorage.setItem(BLOOD_CRYSTALS_KEY, valueToSave.toString());
  } catch (e) {
    console.warn('Failed to save blood crystals', e);
  }
}

const defaultTalents: Record<string, number> = {
  hemomancy_power: 0,
  martyr_vitality: 0,
  vampiric_thirst: 0,
  abyssal_haste: 0,
  sacrifice_mastery: 0,
};

// Schema for Talent levels validation
const TalentLevelsSchema = z.object({
  hemomancy_power: z.number().int().nonnegative().max(100).catch(0),
  martyr_vitality: z.number().int().nonnegative().max(100).catch(0),
  vampiric_thirst: z.number().int().nonnegative().max(100).catch(0),
  abyssal_haste: z.number().int().nonnegative().max(100).catch(0),
  sacrifice_mastery: z.number().int().nonnegative().max(100).catch(0),
}).strict(); // strict() prevents prototype pollution and extra keys

export function loadTalentLevels(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TALENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = TalentLevelsSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    }
  } catch (e) {
    console.warn('Failed to load talents', e);
  }
  return { ...defaultTalents };
}

export function saveTalentLevels(talents: Record<string, number>): void {
  try {
    const validated = TalentLevelsSchema.safeParse(talents);
    const valueToSave = validated.success ? validated.data : defaultTalents;
    localStorage.setItem(TALENTS_KEY, JSON.stringify(valueToSave));
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

// Schema for Settings validation
const SettingsSchema = z.object({
  crtFilter: z.boolean().catch(true),
  sfxVolume: z.number().min(0).max(1).catch(0.8),
  bgmVolume: z.number().min(0).max(1).catch(0.5),
  touchSensitivity: z.number().min(0.5).max(2.0).catch(1.0),
  virtualControlsOpacity: z.number().min(0.2).max(1.0).catch(0.7),
  controlsMode: z.enum(['auto', 'touch', 'keyboard']).catch('auto'),
}).strict(); // strict() prevents prototype pollution and extra keys

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = SettingsSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: GameSettings): void {
  try {
    const validated = SettingsSchema.safeParse(settings);
    const valueToSave = validated.success ? validated.data : defaultSettings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(valueToSave));
  } catch (e) {
    console.warn('Failed to save settings to localStorage', e);
  }
}

export const defaultHighScores: HighScoreRecord[] = [
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

// Schema for HighScoreRecord validation
const HighScoreSchema = z.object({
  id: z.string().max(100).catch(() => `hs_${Date.now()}`),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).catch(() => new Date().toISOString().split('T')[0]),
  score: z.number().int().nonnegative().max(10_000_000).catch(0),
  kills: z.number().int().nonnegative().max(1_000_000).catch(0),
  wave: z.number().int().nonnegative().max(1_000).catch(1),
  timeSurvived: z.string().max(20).catch('00:00'),
  levelReached: z.number().int().nonnegative().max(100).catch(1),
}).strict(); // strict() prevents prototype pollution and extra keys

const HighScoresArraySchema = z.array(HighScoreSchema);

export function loadHighScores(): HighScoreRecord[] {
  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = HighScoresArraySchema.safeParse(parsed);
      if (validated.success) return validated.data;
    }
  } catch (e) {
    console.warn('Failed to load highscores', e);
  }
  return defaultHighScores;
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
    const validated = HighScoresArraySchema.safeParse(updated);
    const valueToSave = validated.success ? validated.data : defaultHighScores;
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(valueToSave));
  } catch (e) {
    console.warn('Failed to save highscore', e);
  }
  return updated;
}
