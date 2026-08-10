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
  vampirismo_profundo: 0,
  execucoes_em_area: 0,
  martyr_vitality: 0,
  escudo_ossos_aprimorado: 0,
  aura_de_medo: 0,
  abyssal_haste: 0,
  sobrecarga_runica: 0,
  tempestade_continua: 0,
};

// Schema for Talent levels validation
const TalentLevelsSchema = z.object({
  hemomancy_power: z.number().int().nonnegative().max(100).catch(0),
  vampirismo_profundo: z.number().int().nonnegative().max(100).catch(0),
  execucoes_em_area: z.number().int().nonnegative().max(100).catch(0),
  martyr_vitality: z.number().int().nonnegative().max(100).catch(0),
  escudo_ossos_aprimorado: z.number().int().nonnegative().max(100).catch(0),
  aura_de_medo: z.number().int().nonnegative().max(100).catch(0),
  abyssal_haste: z.number().int().nonnegative().max(100).catch(0),
  sobrecarga_runica: z.number().int().nonnegative().max(100).catch(0),
  tempestade_continua: z.number().int().nonnegative().max(100).catch(0),
  vampiric_thirst: z.number().int().nonnegative().max(100).catch(0).optional(),
  sacrifice_mastery: z.number().int().nonnegative().max(100).catch(0).optional(),
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
  minimapVisible: true,
  minimapAlpha: 0.65,
  animatedPortrait: true,
  crtFilter: true,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
  touchSensitivity: 1.0,
  virtualControlsOpacity: 0.7,
  controlsMode: 'auto',
  screenShakeEnabled: true,
  flashesEnabled: true,
  lowPerformanceParticles: false,
  highContrastDamageTexts: false,
};

// Schema for Settings validation
const SettingsSchema = z.object({
  minimapVisible: z.boolean().catch(true),
  minimapAlpha: z.number().min(0).max(1).catch(0.65),
  animatedPortrait: z.boolean().catch(true),
  crtFilter: z.boolean().catch(true),
  sfxVolume: z.number().min(0).max(1).catch(0.8),
  bgmVolume: z.number().min(0).max(1).catch(0.5),
  touchSensitivity: z.number().min(0.5).max(2.0).catch(1.0),
  virtualControlsOpacity: z.number().min(0.2).max(1.0).catch(0.7),
  controlsMode: z.enum(['auto', 'touch', 'keyboard']).catch('auto'),
  screenShakeEnabled: z.boolean().catch(true),
  flashesEnabled: z.boolean().catch(true),
  lowPerformanceParticles: z.boolean().catch(false),
  highContrastDamageTexts: z.boolean().catch(false),
  hudLayout: z.record(z.object({
    x: z.number(),
    y: z.number(),
    size: z.enum(['small', 'medium', 'large'])
  })).optional(),
  activePaletteId: z.string().catch('crimson').optional(),
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

const ONBOARDING_KEY = 'bloodmage_1995_onboarding';

const OnboardingSchema = z.object({
  firstKillDone: z.boolean().catch(false),
  firstLevelUpDone: z.boolean().catch(false),
  firstEquipDone: z.boolean().catch(false),
  firstBossSeen: z.boolean().catch(false),
  firstSkillCast: z.boolean().catch(false),
}).strict();

export function loadOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = OnboardingSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    }
  } catch (e) {
    console.warn('Failed to load onboarding', e);
  }
  return {
    firstKillDone: false,
    firstLevelUpDone: false,
    firstEquipDone: false,
    firstBossSeen: false,
    firstSkillCast: false
  };
}

export function saveOnboarding(state: any): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save onboarding', e);
  }
}

const DEATH_STATE_KEY = 'bloodmage_1995_death_state';
const CORPSE_STATE_KEY = 'bloodmage_1995_corpse_state';

const DeathStateSchema = z.object({
  isDefinitivelyDead: z.boolean().catch(false),
  gameOverStats: z.any().nullable().optional(),
});

export function saveDeathState(isDead: boolean, stats?: any): void {
  try {
    const data = {
      isDefinitivelyDead: isDead,
      gameOverStats: stats || null
    };
    localStorage.setItem(DEATH_STATE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save death state', e);
  }
}

export function loadDeathState(): { isDefinitivelyDead: boolean; gameOverStats?: any } {
  try {
    const raw = localStorage.getItem(DEATH_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = DeathStateSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    }
  } catch (e) {
    console.warn('Failed to load death state', e);
  }
  return { isDefinitivelyDead: false, gameOverStats: null };
}

const CorpseSchema = z.object({
  hasDroppedCorpse: z.boolean().catch(false),
  zone: z.string().catch(''),
  x: z.number().catch(0),
  y: z.number().catch(0),
  droppedTimestamp: z.number().catch(0),
  itemsInside: z.array(z.object({
    id: z.string(),
    quantity: z.number()
  })).catch([]),
});

export function saveDroppedCorpseState(corpse: any): void {
  try {
    const validated = CorpseSchema.safeParse(corpse);
    const data = validated.success ? validated.data : corpse;
    localStorage.setItem(CORPSE_STATE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save corpse state', e);
  }
}

export function loadDroppedCorpseState(): any {
  try {
    const raw = localStorage.getItem(CORPSE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = CorpseSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    }
  } catch (e) {
    console.warn('Failed to load corpse state', e);
  }
  return {
    hasDroppedCorpse: false,
    zone: '',
    x: 0,
    y: 0,
    droppedTimestamp: 0,
    itemsInside: []
  };
}
