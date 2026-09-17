import { z } from 'zod';
import { GameSettings, HighScoreRecord, PrestigeData, OnboardingState, CodexState, AchievementState, RunStats } from '../types/game';
import { GameMode, ZoneType, QuestLogEntry } from '../types/campaign';
import { logger } from './logger';
import { loadWithMigration, saveWithEnvelope } from './SaveMigration';

const SETTINGS_KEY = 'bloodmage_1995_settings';
const HIGHSCORES_KEY = 'bloodmage_1995_highscores';
const BLOOD_CRYSTALS_KEY = 'bloodmage_1995_blood_crystals';
const TALENTS_KEY = 'bloodmage_1995_talents';
const PRESTIGE_KEY = 'bloodmage_1995_prestige';

// Schema for Blood Crystals validation
const BloodCrystalsSchema = z.number().int().nonnegative().max(1_000_000_000);

export function loadBloodCrystals(): number {
  return loadWithMigration(BLOOD_CRYSTALS_KEY, 1, BloodCrystalsSchema, {}, 0);
}

export function saveBloodCrystals(amount: number): void {
  saveWithEnvelope(BLOOD_CRYSTALS_KEY, 1, amount, BloodCrystalsSchema, 0);
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
}).strict();

export function loadTalentLevels(): Record<string, number> {
  return loadWithMigration(TALENTS_KEY, 1, TalentLevelsSchema, {}, defaultTalents);
}

export function saveTalentLevels(talents: Record<string, number>): void {
  saveWithEnvelope(TALENTS_KEY, 1, talents, TalentLevelsSchema, defaultTalents);
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
  return loadWithMigration(PRESTIGE_KEY, 1, PrestigeDataSchema, {}, defaultPrestigeData);
}

export function savePrestigeData(prestige: PrestigeData): void {
  saveWithEnvelope(PRESTIGE_KEY, 1, prestige, PrestigeDataSchema, defaultPrestigeData);
}

export const defaultSettings: GameSettings = {
  language: 'pt-BR',
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
  floatingStick: true,
  screenShakeEnabled: true,
  flashesEnabled: true,
  fearDistortionEnabled: true,
  tinnitusEnabled: true,
  atmosphereEffectsEnabled: true,
  lowPerformanceParticles: false,
  highContrastDamageTexts: false,
  postProcessingEnabled: true,
  contentIntensity: 'full',
};

// Schema for Settings validation
const SettingsSchema = z.object({
  language: z.enum(['pt-BR', 'en-US']).catch('pt-BR').optional(),
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
  contentIntensity: z.enum(['full', 'reduced']).catch('full').optional(),
  hudLayout: z.record(z.object({
    x: z.number(),
    y: z.number(),
    size: z.enum(['small', 'medium', 'large'])
  })).optional(),
  activePaletteId: z.string().catch('crimson').optional(),
}).strict();

export function loadSettings(): GameSettings {
  return loadWithMigration(SETTINGS_KEY, 1, SettingsSchema, {}, defaultSettings);
}

export function saveSettings(settings: GameSettings): void {
  saveWithEnvelope(SETTINGS_KEY, 1, settings, SettingsSchema, defaultSettings);
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
}).strict();

const HighScoresArraySchema = z.array(HighScoreSchema);

export function loadHighScores(): HighScoreRecord[] {
  return loadWithMigration(HIGHSCORES_KEY, 1, HighScoresArraySchema, {}, defaultHighScores);
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
    .slice(0, 10);

  saveWithEnvelope(HIGHSCORES_KEY, 1, updated, HighScoresArraySchema, defaultHighScores);
  return updated;
}

const ONBOARDING_KEY = 'bloodmage_1995_onboarding';

const OnboardingSchema = z.object({
  firstKillDone: z.boolean().catch(false),
  firstLevelUpDone: z.boolean().catch(false),
  firstEquipDone: z.boolean().catch(false),
  firstBossSeen: z.boolean().catch(false),
  firstSkillCast: z.boolean().catch(false),
  firstDashDone: z.boolean().catch(false),
  firstSiegeCleared: z.boolean().catch(false),
}).strict();

const defaultOnboarding: OnboardingState = {
  firstKillDone: false,
  firstLevelUpDone: false,
  firstEquipDone: false,
  firstBossSeen: false,
  firstSkillCast: false,
  firstDashDone: false,
  firstSiegeCleared: false,
};

export function loadOnboarding(): OnboardingState {
  return loadWithMigration(ONBOARDING_KEY, 1, OnboardingSchema, {}, defaultOnboarding);
}

export function saveOnboarding(state: any): void {
  saveWithEnvelope(ONBOARDING_KEY, 1, state, OnboardingSchema, defaultOnboarding);
}

const DEATH_STATE_KEY = 'bloodmage_1995_death_state';
const CORPSE_STATE_KEY = 'bloodmage_1995_corpse_state';
const UNLOCKED_RELICS_KEY = 'bloodmage_1995_unlocked_relics';
const EQUIPPED_RELIC_IDS_KEY = 'bloodmage_1995_equipped_relic_ids';

const DeathStateSchema = z.object({
  isDefinitivelyDead: z.boolean().catch(false),
  gameOverStats: z.any().nullable().optional(),
});

const defaultDeathState = { isDefinitivelyDead: false, gameOverStats: null };

export function saveDeathState(isDead: boolean, stats?: any): void {
  const data = {
    isDefinitivelyDead: isDead,
    gameOverStats: stats || null
  };
  saveWithEnvelope(DEATH_STATE_KEY, 1, data, DeathStateSchema, defaultDeathState);
}

export function loadDeathState(): { isDefinitivelyDead: boolean; gameOverStats?: any } {
  return loadWithMigration(DEATH_STATE_KEY, 1, DeathStateSchema, {}, defaultDeathState);
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

const defaultCorpseState = {
  hasDroppedCorpse: false,
  zone: '',
  x: 0,
  y: 0,
  droppedTimestamp: 0,
  itemsInside: []
};

export function saveDroppedCorpseState(corpse: any): void {
  saveWithEnvelope(CORPSE_STATE_KEY, 1, corpse, CorpseSchema, defaultCorpseState);
}

export function loadDroppedCorpseState(): any {
  return loadWithMigration(CORPSE_STATE_KEY, 1, CorpseSchema, {}, defaultCorpseState);
}

const defaultUnlockedRelics = ['selo_hemorragico', 'olho_de_carmim', 'anel_do_pacto_sanguineo'];
const UnlockedRelicsSchema = z.array(z.string().max(100)).max(50);

export function loadUnlockedRelics(): string[] {
  return loadWithMigration(UNLOCKED_RELICS_KEY, 1, UnlockedRelicsSchema, {}, defaultUnlockedRelics);
}

export function saveUnlockedRelics(relicIds: string[]): void {
  saveWithEnvelope(UNLOCKED_RELICS_KEY, 1, relicIds, UnlockedRelicsSchema, defaultUnlockedRelics);
}

const defaultEquippedRelicIds = ['selo_hemorragico'];
const EquippedRelicIdsSchema = z.array(z.string().max(100)).max(3);

export function loadEquippedRelicIds(): string[] {
  return loadWithMigration(EQUIPPED_RELIC_IDS_KEY, 1, EquippedRelicIdsSchema, {}, defaultEquippedRelicIds);
}

export function saveEquippedRelicIds(relicIds: string[]): void {
  saveWithEnvelope(EQUIPPED_RELIC_IDS_KEY, 1, relicIds, EquippedRelicIdsSchema, defaultEquippedRelicIds);
}

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
  return loadWithMigration(CODEX_STATE_KEY, 1, CodexStateSchema, {}, defaultCodexState);
}

export function saveCodexState(state: CodexState): void {
  saveWithEnvelope(CODEX_STATE_KEY, 1, state, CodexStateSchema, defaultCodexState);
}

const ACHIEVEMENTS_KEY = 'bloodmage_1995_achievements';
const RUN_STATS_KEY = 'bloodmage_1995_run_stats';

const AchievementStateSchema = z.record(z.string(), z.object({
  id: z.string(),
  unlocked: z.boolean(),
  redeemed: z.boolean(),
})).catch({});

export function loadAchievements(): Record<string, AchievementState> {
  return loadWithMigration(ACHIEVEMENTS_KEY, 1, AchievementStateSchema, {}, {});
}

export function saveAchievements(achievements: Record<string, AchievementState>): void {
  saveWithEnvelope(ACHIEVEMENTS_KEY, 1, achievements, AchievementStateSchema, {});
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

const defaultRunStats: RunStats = {
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

export function loadRunStats(): RunStats {
  return loadWithMigration(RUN_STATS_KEY, 1, RunStatsSchema, {}, defaultRunStats);
}

export function saveRunStats(stats: RunStats): void {
  saveWithEnvelope(RUN_STATS_KEY, 1, stats, RunStatsSchema, defaultRunStats);
}

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
  return loadWithMigration(CAMPAIGN_STATE_KEY, 1, CampaignStateSchema, {}, defaultCampaignState);
}

export function saveCampaignState(state: PersistedCampaignState): void {
  saveWithEnvelope(CAMPAIGN_STATE_KEY, 1, state, CampaignStateSchema, defaultCampaignState);
}

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
  // Handle legacy un-namespaced key migration
  const legacyRaw = localStorage.getItem(LEGACY_ACHIEVEMENT_PROGRESS_KEY);
  if (legacyRaw && !localStorage.getItem(ACHIEVEMENT_PROGRESS_KEY)) {
    try {
      const legacyParsed = JSON.parse(legacyRaw);
      const validated = AchievementProgressMapSchema.safeParse(legacyParsed);
      if (validated.success) {
        saveAchievementProgress(validated.data);
        localStorage.removeItem(LEGACY_ACHIEVEMENT_PROGRESS_KEY);
        return validated.data;
      }
    } catch (e) {
      logger.warn('PERSISTENCE', 'Falha ao migrar progresso legado de achievements', e);
    }
  }

  return loadWithMigration(ACHIEVEMENT_PROGRESS_KEY, 1, AchievementProgressMapSchema, {}, {});
}

export function saveAchievementProgress(progress: Record<string, AchievementProgressRecord>): void {
  saveWithEnvelope(ACHIEVEMENT_PROGRESS_KEY, 1, progress, AchievementProgressMapSchema, {});
}
