import { GameSettings, HighScoreRecord } from '../types/game';

const SETTINGS_KEY = 'bloodmage_1995_settings';
const HIGHSCORES_KEY = 'bloodmage_1995_highscores';
const BLOOD_CRYSTALS_KEY = 'bloodmage_1995_blood_crystals';
const TALENTS_KEY = 'bloodmage_1995_talents';

export function loadBloodCrystals(): number {
  try {
    const raw = localStorage.getItem(BLOOD_CRYSTALS_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (Number.isInteger(parsed) && parsed >= 0) {
        return Math.min(parsed, 999999); // Defense in depth: clamp to a sensible maximum to prevent overflow
      }
    }
  } catch (e) {
    console.warn('Failed to load blood crystals safely', e);
  }
  return 0;
}

export function saveBloodCrystals(amount: number): void {
  try {
    const validatedAmount = Math.max(0, Math.min(Math.floor(amount), 999999));
    localStorage.setItem(BLOOD_CRYSTALS_KEY, validatedAmount.toString());
  } catch (e) {
    console.warn('Failed to save blood crystals', e);
  }
}

export function loadTalentLevels(): Record<string, number> {
  const defaults = {
    hemomancy_power: 0,
    martyr_vitality: 0,
    vampiric_thirst: 0,
    abyssal_haste: 0,
    sacrifice_mastery: 0,
  };
  try {
    const raw = localStorage.getItem(TALENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const validated: Record<string, number> = { ...defaults };
        const maxLevels: Record<string, number> = {
          hemomancy_power: 10,
          martyr_vitality: 10,
          vampiric_thirst: 5,
          abyssal_haste: 5,
          sacrifice_mastery: 5,
        };
        for (const key of Object.keys(defaults)) {
          const val = parsed[key];
          if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
            validated[key] = Math.min(val, maxLevels[key] || 5);
          }
        }
        return validated;
      }
    }
  } catch (e) {
    console.warn('Failed to load talents safely', e);
  }
  return defaults;
}

export function saveTalentLevels(talents: Record<string, number>): void {
  try {
    const defaults = {
      hemomancy_power: 0,
      martyr_vitality: 0,
      vampiric_thirst: 0,
      abyssal_haste: 0,
      sacrifice_mastery: 0,
    };
    const maxLevels: Record<string, number> = {
      hemomancy_power: 10,
      martyr_vitality: 10,
      vampiric_thirst: 5,
      abyssal_haste: 5,
      sacrifice_mastery: 5,
    };
    const validated: Record<string, number> = {};
    for (const key of Object.keys(defaults)) {
      const val = talents[key];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
        validated[key] = Math.min(val, maxLevels[key] || 5);
      } else {
        validated[key] = 0;
      }
    }
    localStorage.setItem(TALENTS_KEY, JSON.stringify(validated));
  } catch (e) {
    console.warn('Failed to save talents safely', e);
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
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const settings = { ...defaultSettings };

        if (typeof parsed.crtFilter === 'boolean') {
          settings.crtFilter = parsed.crtFilter;
        }
        if (typeof parsed.sfxVolume === 'number' && !isNaN(parsed.sfxVolume)) {
          settings.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
        }
        if (typeof parsed.bgmVolume === 'number' && !isNaN(parsed.bgmVolume)) {
          settings.bgmVolume = Math.max(0, Math.min(1, parsed.bgmVolume));
        }
        if (typeof parsed.touchSensitivity === 'number' && !isNaN(parsed.touchSensitivity)) {
          settings.touchSensitivity = Math.max(0.5, Math.min(2.0, parsed.touchSensitivity));
        }
        if (typeof parsed.virtualControlsOpacity === 'number' && !isNaN(parsed.virtualControlsOpacity)) {
          settings.virtualControlsOpacity = Math.max(0.2, Math.min(1.0, parsed.virtualControlsOpacity));
        }
        if (parsed.controlsMode === 'auto' || parsed.controlsMode === 'touch' || parsed.controlsMode === 'keyboard') {
          settings.controlsMode = parsed.controlsMode;
        }

        return settings;
      }
    }
  } catch (e) {
    console.warn('Failed to load settings safely from localStorage', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: GameSettings): void {
  try {
    const validated: GameSettings = {
      crtFilter: !!settings.crtFilter,
      sfxVolume: Math.max(0, Math.min(1, typeof settings.sfxVolume === 'number' ? settings.sfxVolume : 0.8)),
      bgmVolume: Math.max(0, Math.min(1, typeof settings.bgmVolume === 'number' ? settings.bgmVolume : 0.5)),
      touchSensitivity: Math.max(0.5, Math.min(2.0, typeof settings.touchSensitivity === 'number' ? settings.touchSensitivity : 1.0)),
      virtualControlsOpacity: Math.max(0.2, Math.min(1.0, typeof settings.virtualControlsOpacity === 'number' ? settings.virtualControlsOpacity : 0.7)),
      controlsMode: (settings.controlsMode === 'auto' || settings.controlsMode === 'touch' || settings.controlsMode === 'keyboard') ? settings.controlsMode : 'auto'
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated));
  } catch (e) {
    console.warn('Failed to save settings safely to localStorage', e);
  }
}

const defaultHighScores: HighScoreRecord[] = [
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

export function loadHighScores(): HighScoreRecord[] {
  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validated: HighScoreRecord[] = [];
        for (const item of parsed) {
          if (
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.date === 'string' &&
            typeof item.score === 'number' &&
            Number.isInteger(item.score) &&
            item.score >= 0 &&
            typeof item.kills === 'number' &&
            Number.isInteger(item.kills) &&
            item.kills >= 0 &&
            typeof item.wave === 'number' &&
            Number.isInteger(item.wave) &&
            item.wave >= 1 &&
            typeof item.timeSurvived === 'string' &&
            typeof item.levelReached === 'number' &&
            Number.isInteger(item.levelReached) &&
            item.levelReached >= 1
          ) {
            // Defense in depth: sanitize text fields of html/tags and restrict size
            const cleanId = item.id.replace(/[<>]/g, '').slice(0, 50);
            const cleanDate = item.date.replace(/[<>]/g, '').slice(0, 10);
            const cleanTimeSurvived = item.timeSurvived.replace(/[<>]/g, '').slice(0, 10);

            validated.push({
              id: cleanId,
              date: cleanDate,
              score: Math.min(item.score, 999999999),
              kills: Math.min(item.kills, 999999),
              wave: Math.min(item.wave, 1000),
              timeSurvived: cleanTimeSurvived,
              levelReached: Math.min(item.levelReached, 100)
            });
          }
        }
        return validated.sort((a, b) => b.score - a.score).slice(0, 10);
      }
    }
  } catch (e) {
    console.warn('Failed to load highscores safely', e);
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
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save highscore safely', e);
  }
  return updated;
}
