import { z } from 'zod';
import { GameSettings, HighScoreRecord, PrestigeData, BloodSealType, GameDifficulty } from '../types/game';
import { logger } from './logger';

const SETTINGS_KEY = 'bloodmage_1995_settings';
const HIGHSCORES_KEY = 'bloodmage_1995_highscores';
const BLOOD_CRYSTALS_KEY = 'bloodmage_1995_blood_crystals';
const TALENTS_KEY = 'bloodmage_1995_talents';
const PRESTIGE_KEY = 'bloodmage_1995_prestige';

// Schema for Blood Crystals validation
const BloodCrystalsSchema = z.number().int().nonnegative().max(1_000_000_000);

export function loadBloodCrystals(): number {
  try {
    const raw = localStorage.getItem(BLOOD_CRYSTALS_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      const validated = BloodCrystalsSchema.safeParse(Number.isNaN(parsed) ? 0 : parsed);
      if (validated.success && !Number.isNaN(parsed) && raw === parsed.toString()) {
        logger.debug('PERSISTENCE', `Blood crystals loaded successfully: ${validated.data}`);
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Valor inválido de cristais de sangue no localStorage. Restaurando para 0.', { raw });
        saveBloodCrystals(0);
        return 0;
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load blood crystals', e);
    saveBloodCrystals(0);
  }
  return 0;
}

export function saveBloodCrystals(amount: number): void {
  try {
    const validated = BloodCrystalsSchema.safeParse(amount);
    const valueToSave = validated.success ? validated.data : 0;
    if (!validated.success) {
      logger.warn('PERSISTENCE', `Tentativa de salvar quantia inválida de cristais: ${amount}. Ajustando para 0.`);
    }
    localStorage.setItem(BLOOD_CRYSTALS_KEY, valueToSave.toString());
    logger.debug('PERSISTENCE', `Blood crystals saved successfully: ${valueToSave}`);
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save blood crystals', e);
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
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Talents loaded successfully from localStorage');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Estrutura de talentos inválida no localStorage. Restaurando padrões.', { raw });
        saveTalentLevels(defaultTalents);
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load talents', e);
    saveTalentLevels(defaultTalents);
  }
  return { ...defaultTalents };
}

export function saveTalentLevels(talents: Record<string, number>): void {
  try {
    const validated = TalentLevelsSchema.safeParse(talents);
    const valueToSave = validated.success ? validated.data : defaultTalents;
    if (!validated.success) {
      logger.warn('PERSISTENCE', 'Tentativa de salvar talentos inválidos. Usando padrões.');
    }
    localStorage.setItem(TALENTS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Talents saved successfully to localStorage');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save talents', e);
  }
}

export const defaultPrestigeData: PrestigeData = {
  level: 0,
  unspentSealPoints: 0,
  seals: {
    carnage: 0,
    dark_vitality: 0,
    runic_flow: 0,
    deep_vampirism: 0,
    macabre_fortune: 0,
  },
  selectedDifficulty: 'normal',
  unlockedDifficulties: ['normal'],
  totalSacrifices: 0,
};

const PrestigeDataSchema = z.object({
  level: z.number().int().min(0).max(10).catch(0),
  unspentSealPoints: z.number().int().min(0).max(10).catch(0),
  seals: z.object({
    carnage: z.number().int().min(0).max(5).catch(0),
    dark_vitality: z.number().int().min(0).max(5).catch(0),
    runic_flow: z.number().int().min(0).max(5).catch(0),
    deep_vampirism: z.number().int().min(0).max(5).catch(0),
    macabre_fortune: z.number().int().min(0).max(5).catch(0),
  }).catch(defaultPrestigeData.seals),
  selectedDifficulty: z.enum(['normal', 'nightmare', 'inferno']).catch('normal'),
  unlockedDifficulties: z.array(z.enum(['normal', 'nightmare', 'inferno'])).catch(['normal']),
  totalSacrifices: z.number().int().min(0).catch(0),
});

export function loadPrestigeData(): PrestigeData {
  try {
    const raw = localStorage.getItem(PRESTIGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = PrestigeDataSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Prestige data loaded successfully from localStorage');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Estrutura de prestígio inválida no localStorage. Restaurando padrões.', { raw });
        savePrestigeData(defaultPrestigeData);
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load prestige data', e);
    savePrestigeData(defaultPrestigeData);
  }
  return { ...defaultPrestigeData, seals: { ...defaultPrestigeData.seals }, unlockedDifficulties: [...defaultPrestigeData.unlockedDifficulties] };
}

export function savePrestigeData(prestige: PrestigeData): void {
  try {
    const validated = PrestigeDataSchema.safeParse(prestige);
    const valueToSave = validated.success ? validated.data : defaultPrestigeData;
    if (!validated.success) {
      logger.warn('PERSISTENCE', 'Tentativa de salvar dados de prestígio inválidos. Usando padrões.');
    }
    localStorage.setItem(PRESTIGE_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Prestige data saved successfully to localStorage');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save prestige data', e);
  }
}

export const defaultSettings: GameSettings = {
  minimapVisible: true,
  minimapAlpha: 0.65,
  animatedPortrait: true,
  crtFilter: true,
  sfxVolume: 0.8,
  bgmVolume: 0.3,
  touchSensitivity: 1.0,
  virtualControlsOpacity: 0.7,
  controlsMode: 'auto',
  joystickDeadzone: 0.08,
  joystickCurve: 1.8,
  virtualStickScale: 'medium',
  leftHandedMode: false,
  // Padrão FLUTUANTE (spawna a base do stick onde o dedo toca, estilo Mobile
  // Legends/Diablo Immortal) — antes era `false`, o que ancorava a base do
  // stick num ponto fixo minúsculo perto da borda (~100px). Como a zona de
  // toque aceita até 48% da largura da tela, qualquer toque fora desse ponto
  // fixo calculava um vetor positivo (direita) mesmo tocando "na esquerda da
  // tela" — só dava pra mover pra esquerda tocando bem colado na borda.
  floatingStick: true,
  screenShakeEnabled: true,
  flashesEnabled: true,
  fearDistortionEnabled: true,
  tinnitusEnabled: true,
  atmosphereEffectsEnabled: true,
  lowPerformanceParticles: false,
  highContrastDamageTexts: false,
  postProcessingEnabled: true,
};

// Schema for Settings validation
const SettingsSchema = z.object({
  minimapVisible: z.boolean().catch(true),
  minimapAlpha: z.number().min(0).max(1).catch(0.65),
  animatedPortrait: z.boolean().catch(true),
  crtFilter: z.boolean().catch(true),
  sfxVolume: z.number().min(0).max(1).catch(0.8),
  bgmVolume: z.number().min(0).max(1).catch(0.3),
  touchSensitivity: z.number().min(0.5).max(2.0).catch(1.0),
  virtualControlsOpacity: z.number().min(0.2).max(1.0).catch(0.7),
  controlsMode: z.enum(['auto', 'touch', 'keyboard']).catch('auto'),
  joystickDeadzone: z.number().min(0).max(0.5).catch(0.08).optional(),
  joystickCurve: z.number().min(0.5).max(3.0).catch(1.8).optional(),
  virtualStickScale: z.enum(['small', 'medium', 'large']).catch('medium').optional(),
  leftHandedMode: z.boolean().catch(false).optional(),
  floatingStick: z.boolean().catch(false).optional(),
  screenShakeEnabled: z.boolean().catch(true),
  flashesEnabled: z.boolean().catch(true),
  fearDistortionEnabled: z.boolean().catch(true).optional(),
  tinnitusEnabled: z.boolean().catch(true).optional(),
  atmosphereEffectsEnabled: z.boolean().catch(true).optional(),
  lowPerformanceParticles: z.boolean().catch(false),
  highContrastDamageTexts: z.boolean().catch(false),
  postProcessingEnabled: z.boolean().catch(true),
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
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Game settings loaded successfully from localStorage');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Configurações inválidas no localStorage. Restaurando padrões.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load settings from localStorage', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: GameSettings): void {
  try {
    const validated = SettingsSchema.safeParse(settings);
    const valueToSave = validated.success ? validated.data : defaultSettings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Game settings saved successfully to localStorage');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save settings to localStorage', e);
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
      if (validated.success) {
        logger.debug('PERSISTENCE', 'High scores loaded successfully from localStorage');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'High scores inválidos no localStorage. Restaurando lista padrão.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load highscores', e);
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
    logger.debug('PERSISTENCE', 'High score record saved successfully to localStorage');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save highscore', e);
  }
  return updated;
}

const ONBOARDING_KEY = 'bloodmage_1995_onboarding';

import { OnboardingState } from '../types/game';

const OnboardingSchema = z.object({
  firstKillDone: z.boolean().catch(false),
  firstLevelUpDone: z.boolean().catch(false),
  firstEquipDone: z.boolean().catch(false),
  firstBossSeen: z.boolean().catch(false),
  firstSkillCast: z.boolean().catch(false),
  firstDashDone: z.boolean().catch(false),
  firstSiegeCleared: z.boolean().catch(false),
}).strict();

export function loadOnboarding(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = OnboardingSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Onboarding loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Onboarding data inválido no localStorage. Restaurando defaults.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load onboarding', e);
  }
  return {
    firstKillDone: false,
    firstLevelUpDone: false,
    firstEquipDone: false,
    firstBossSeen: false,
    firstSkillCast: false,
    firstDashDone: false,
    firstSiegeCleared: false,
  };
}

export function saveOnboarding(state: any): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
    logger.debug('PERSISTENCE', 'Onboarding saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save onboarding', e);
  }
}

const DEATH_STATE_KEY = 'bloodmage_1995_death_state';
const CORPSE_STATE_KEY = 'bloodmage_1995_corpse_state';
const UNLOCKED_RELICS_KEY = 'bloodmage_1995_unlocked_relics';
const EQUIPPED_RELIC_IDS_KEY = 'bloodmage_1995_equipped_relic_ids';

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
    logger.debug('PERSISTENCE', `Death state saved successfully: ${isDead}`);
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save death state', e);
  }
}

export function loadDeathState(): { isDefinitivelyDead: boolean; gameOverStats?: any } {
  try {
    const raw = localStorage.getItem(DEATH_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = DeathStateSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Death state loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Death state inválido no localStorage. Restaurando default.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load death state', e);
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
    logger.debug('PERSISTENCE', 'Corpse state saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save corpse state', e);
  }
}

export function loadDroppedCorpseState(): any {
  try {
    const raw = localStorage.getItem(CORPSE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = CorpseSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Corpse state loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Corpse state inválido no localStorage. Restaurando default.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load corpse state', e);
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

const defaultUnlockedRelics = ['selo_hemorragico', 'olho_de_carmim', 'anel_do_pacto_sanguineo'];
const UnlockedRelicsSchema = z.array(z.string().max(100)).max(50);

export function loadUnlockedRelics(): string[] {
  try {
    const raw = localStorage.getItem(UNLOCKED_RELICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = UnlockedRelicsSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Unlocked relics loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Relíquias desbloqueadas inválidas no localStorage. Restaurando padrão.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load unlocked relics', e);
  }
  return defaultUnlockedRelics;
}

export function saveUnlockedRelics(relicIds: string[]): void {
  try {
    const validated = UnlockedRelicsSchema.safeParse(relicIds);
    const valueToSave = validated.success ? validated.data : defaultUnlockedRelics;
    localStorage.setItem(UNLOCKED_RELICS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Unlocked relics saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save unlocked relics', e);
  }
}

const defaultEquippedRelicIds = ['selo_hemorragico'];
const EquippedRelicIdsSchema = z.array(z.string().max(100)).max(3);

export function loadEquippedRelicIds(): string[] {
  try {
    const raw = localStorage.getItem(EQUIPPED_RELIC_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = EquippedRelicIdsSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Equipped relic IDs loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Relíquias equipadas inválidas no localStorage. Restaurando padrão.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load equipped relic IDs', e);
  }
  return defaultEquippedRelicIds;
}

export function saveEquippedRelicIds(relicIds: string[]): void {
  try {
    const validated = EquippedRelicIdsSchema.safeParse(relicIds);
    const valueToSave = validated.success ? validated.data : defaultEquippedRelicIds;
    localStorage.setItem(EQUIPPED_RELIC_IDS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Equipped relic IDs saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save equipped relic IDs', e);
  }
}

import { CodexState } from '../types/game';

const CODEX_STATE_KEY = 'bloodmage_1995_codex';

export const defaultCodexState: CodexState = {
  enemyKills: {},
  unlockedEntries: ['lore_origem_hemomancia', 'relic_selo_hemorragico'],
  claimedMilestones: {},
};

const CodexStateSchema = z.object({
  enemyKills: z.record(z.string(), z.number().int().nonnegative().max(10_000_000)).catch({}),
  unlockedEntries: z.array(z.string().max(100)).max(200).catch(['lore_origem_hemomancia', 'relic_selo_hemorragico']),
  claimedMilestones: z.record(z.string(), z.array(z.number().int().nonnegative())).catch({}),
}).strict();

export function loadCodexState(): CodexState {
  try {
    const raw = localStorage.getItem(CODEX_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = CodexStateSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Codex state loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Estrutura do códice inválida no localStorage. Restaurando padrão.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load codex state', e);
  }
  return { ...defaultCodexState };
}

export function saveCodexState(state: CodexState): void {
  try {
    const validated = CodexStateSchema.safeParse(state);
    const valueToSave = validated.success ? validated.data : defaultCodexState;
    localStorage.setItem(CODEX_STATE_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Codex state saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save codex state', e);
  }
}

import { AchievementState, RunStats } from '../types/game';

const ACHIEVEMENTS_KEY = 'bloodmage_1995_achievements';
const RUN_STATS_KEY = 'bloodmage_1995_run_stats';

const AchievementStateSchema = z.record(z.string(), z.object({
  id: z.string(),
  unlocked: z.boolean(),
  redeemed: z.boolean(),
})).catch({});

export function loadAchievements(): Record<string, AchievementState> {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = AchievementStateSchema.safeParse(parsed);
      if (validated.success && typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return validated.data;
      } else {
        saveAchievements({});
        return {};
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load achievements', e);
    saveAchievements({});
  }
  return {};
}

export function saveAchievements(achievements: Record<string, AchievementState>): void {
  try {
    const validated = AchievementStateSchema.safeParse(achievements);
    const valueToSave = validated.success ? validated.data : {};
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Achievements saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save achievements', e);
  }
}

const RunStatsSchema = z.object({
  bloodless_floor: z.number().catch(0),
  kills_total: z.number().catch(0),
  kills_gargoyle: z.number().catch(0),
  speedrun_f3: z.number().catch(0),
  deaths_total: z.number().catch(0),
  hp_healed_magic: z.number().catch(0),
  dismemberments_total: z.number().catch(0),
  mana_orbs_run: z.number().catch(0),
  crystals_hoarded: z.number().catch(0),
  survival_time_run: z.number().catch(0),
  floor_depth_max: z.number().catch(0),
  spells_unlocked_total: z.number().catch(0),
  knockouts_total: z.number().catch(0),
}).catch({
  bloodless_floor: 0,
  kills_total: 0,
  kills_gargoyle: 0,
  speedrun_f3: 0,
  deaths_total: 0,
  hp_healed_magic: 0,
  dismemberments_total: 0,
  mana_orbs_run: 0,
  crystals_hoarded: 0,
  survival_time_run: 0,
  floor_depth_max: 0,
  spells_unlocked_total: 0,
  knockouts_total: 0,
});

export function loadRunStats(): RunStats {
  try {
    const raw = localStorage.getItem(RUN_STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = RunStatsSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load run stats', e);
  }
  return {
    bloodless_floor: 0,
    kills_total: 0,
    kills_gargoyle: 0,
    speedrun_f3: 0,
    deaths_total: 0,
    hp_healed_magic: 0,
    dismemberments_total: 0,
    mana_orbs_run: 0,
    crystals_hoarded: 0,
    survival_time_run: 0,
    floor_depth_max: 0,
    spells_unlocked_total: 0,
    knockouts_total: 0,
  };
}

export function saveRunStats(stats: RunStats): void {
  try {
    const validated = RunStatsSchema.safeParse(stats);
    const valueToSave = validated.success ? validated.data : {
      bloodless_floor: 0,
      kills_total: 0,
      kills_gargoyle: 0,
      speedrun_f3: 0,
      deaths_total: 0,
      hp_healed_magic: 0,
      dismemberments_total: 0,
      mana_orbs_run: 0,
      crystals_hoarded: 0,
      survival_time_run: 0,
      floor_depth_max: 0,
      spells_unlocked_total: 0,
      knockouts_total: 0,
    };
    localStorage.setItem(RUN_STATS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Run stats saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save run stats', e);
  }
}

// Persistência do progresso de campanha — docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md.
// Só a parte "de save" de `CampaignState` é persistida aqui: zona atual, capítulo,
// flags de história, quests (com progresso real de objetivos), zonas descobertas e
// magias desbloqueadas — além do `gameMode` (nível superior na store, não dentro de
// `CampaignState`), pra "Continuar" depois de recarregar a página voltar pro modo
// Campanha certo. `activeDialogueTree`/`activeDialogueNodeId` ficam de fora de
// propósito: são estado de sessão (o diálogo aberto na tela), não progresso — recarregar
// no meio de uma conversa simplesmente fecha o modal em vez de tentar retomá-lo.
import { GameMode, ZoneType, QuestLogEntry } from '../types/campaign';

const CAMPAIGN_STATE_KEY = 'bloodmage_1995_campaign_state';

export interface PersistedCampaignState {
  gameMode: GameMode;
  currentZone: ZoneType;
  chapter: number;
  storyFlags: Record<string, boolean>;
  quests: Record<string, QuestLogEntry>;
  discoveredZones: ZoneType[];
  unlockedSpellIds: string[];
}

export const defaultCampaignState: PersistedCampaignState = {
  gameMode: 'arcade',
  currentZone: 'safe_house',
  chapter: 1,
  storyFlags: {},
  quests: {},
  discoveredZones: ['safe_house'],
  unlockedSpellIds: [],
};

// `ZoneType` (types/campaign.ts) agora é alias de `BiomeType` (types/game.ts) —
// mesma lista de valores usada pela progressão de campanha em
// `DungeonFlowController.ts`, ver observação lá.
const ZoneTypeSchema = z.enum(['safe_house', 'gloomy_woods', 'fosso_chagas', 'catacumbas_martires', 'santuario_sangue']);

const QuestLogEntrySchema = z.object({
  questId: z.string().max(100),
  status: z.enum(['not_started', 'active', 'completed', 'failed']).catch('not_started'),
  currentObjectiveIndex: z.number().int().nonnegative().max(1_000).catch(0),
  objectivesProgress: z.record(z.string().max(100), z.number().int().nonnegative().max(1_000_000)).catch({}),
}).strict();

const CampaignStateSchema = z.object({
  gameMode: z.enum(['arcade', 'campaign']).catch('arcade'),
  currentZone: ZoneTypeSchema.catch('safe_house'),
  chapter: z.number().int().positive().max(100).catch(1),
  storyFlags: z.record(z.string().max(100), z.boolean()).catch({}),
  quests: z.record(z.string().max(100), QuestLogEntrySchema).catch({}),
  discoveredZones: z.array(ZoneTypeSchema).max(20).catch(['safe_house']),
  unlockedSpellIds: z.array(z.string().max(100)).max(50).catch([]),
}).strict();

export function loadCampaignState(): PersistedCampaignState {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = CampaignStateSchema.safeParse(parsed);
      if (validated.success) {
        logger.debug('PERSISTENCE', 'Campaign state loaded successfully from localStorage');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Estado de campanha inválido no localStorage. Restaurando padrão.', { raw });
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load campaign state', e);
  }
  return { ...defaultCampaignState, storyFlags: {}, quests: {}, discoveredZones: [...defaultCampaignState.discoveredZones], unlockedSpellIds: [] };
}

export function saveCampaignState(state: PersistedCampaignState): void {
  try {
    const validated = CampaignStateSchema.safeParse(state);
    const valueToSave = validated.success ? validated.data : defaultCampaignState;
    if (!validated.success) {
      logger.warn('PERSISTENCE', 'Tentativa de salvar estado de campanha inválido. Usando padrão.');
    }
    localStorage.setItem(CAMPAIGN_STATE_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Campaign state saved successfully to localStorage');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save campaign state', e);
  }
}

// Auditoria de 27/08 (docs/product/ROADMAP.md, Fase 0) — `AchievementSystem.ts`
// (usado por `GameScene.ts`) é um sistema de conquistas SEPARADO do baseado em
// store (`gameStore.ts` + `data/achievements.json` + `AchievementsModal.tsx`,
// já persistido via `loadAchievements`/`saveAchievements` acima, chave
// `bloodmage_1995_achievements`, formato {id, unlocked, redeemed}). Os dois
// sistemas coexistem com formatos incompatíveis — unificá-los é fora de escopo
// desta correção (só fecha o item do Roadmap: acesso direto/sem Zod ao
// localStorage). Aqui só validamos e namespaceamos o progresso do
// `AchievementSystem.ts`, sem mudar seu formato ({id, unlockedAt, progress,
// complete}). Migra automaticamente da chave antiga não-namespaceada
// ("achievements_progress") na primeira carga.
const ACHIEVEMENT_PROGRESS_KEY = 'bloodmage_1995_achievements_progress';
const LEGACY_ACHIEVEMENT_PROGRESS_KEY = 'achievements_progress';

export interface AchievementProgressRecord {
  id: string;
  unlockedAt: number | null;
  progress: number;
  complete: boolean;
}

const AchievementProgressRecordSchema = z.object({
  id: z.string().max(100),
  unlockedAt: z.number().nonnegative().nullable().catch(null),
  progress: z.number().min(0).max(100).catch(0),
  complete: z.boolean().catch(false),
}).strict();

const AchievementProgressMapSchema = z.record(z.string().max(100), AchievementProgressRecordSchema).catch({});

export function loadAchievementProgress(): Record<string, AchievementProgressRecord> {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = AchievementProgressMapSchema.safeParse(parsed);
      if (validated.success && typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        logger.debug('PERSISTENCE', 'Achievement progress (AchievementSystem) loaded successfully');
        return validated.data;
      } else {
        logger.warn('PERSISTENCE', 'Progresso de achievements inválido no localStorage. Restaurando padrão.', { raw });
      }
    } else {
      // Migração única da chave legada sem namespace/validação.
      const legacyRaw = localStorage.getItem(LEGACY_ACHIEVEMENT_PROGRESS_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          const validated = AchievementProgressMapSchema.safeParse(legacyParsed);
          if (validated.success && typeof legacyParsed === 'object' && legacyParsed !== null && !Array.isArray(legacyParsed)) {
            logger.debug('PERSISTENCE', 'Migrando progresso de achievements da chave legada "achievements_progress".');
            saveAchievementProgress(validated.data);
            localStorage.removeItem(LEGACY_ACHIEVEMENT_PROGRESS_KEY);
            return validated.data;
          }
        } catch (e) {
          logger.warn('PERSISTENCE', 'Falha ao migrar progresso legado de achievements', e);
        }
      }
    }
  } catch (e) {
    logger.warn('PERSISTENCE', 'Failed to load achievement progress (AchievementSystem)', e);
  }
  return {};
}

export function saveAchievementProgress(progress: Record<string, AchievementProgressRecord>): void {
  try {
    const validated = AchievementProgressMapSchema.safeParse(progress);
    const valueToSave = validated.success ? validated.data : {};
    localStorage.setItem(ACHIEVEMENT_PROGRESS_KEY, JSON.stringify(valueToSave));
    logger.debug('PERSISTENCE', 'Achievement progress (AchievementSystem) saved successfully');
  } catch (e) {
    logger.error('PERSISTENCE', 'Failed to save achievement progress (AchievementSystem)', e);
  }
}
