export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'relic';

export interface RelicEffect {
  damageMultiplier?: number;
  maxHpBonus?: number;
  speedBonus?: number;
  lifestealBonus?: number;
  cooldownReductionBonus?: number;
  hpRegenBonus?: number;
  bloodCrystalMultiplier?: number;
  bleedChanceOnHit?: number;
  bleedDamagePerSecond?: number;
  spellCostDiscount?: number;
}

export interface RelicItem {
  id: string;
  name: string;
  type: 'relic';
  rarity: ItemRarity;
  description: string;
  lore?: string;
  icon?: string;
  effect: RelicEffect;
  stats?: {
    damageMultiplier?: number;
    maxHpBonus?: number;
    speedBonus?: number;
    lifestealBonus?: number;
    cooldownReductionBonus?: number;
    critChanceBonus?: number;
    hpRegenBonus?: number;
  };
}

export interface LootItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description?: string;
  stats: {
    damageMultiplier?: number;
    maxHpBonus?: number;
    speedBonus?: number;
    lifestealBonus?: number;
    cooldownReductionBonus?: number;
    critChanceBonus?: number;
    hpRegenBonus?: number;
  };
  effect?: RelicEffect;
}

export interface EquipmentSlots {
  weapon: LootItem | null;
  armor: LootItem | null;
  relics: (LootItem | RelicItem)[];
}

export type BiomeType = 'fosso_chagas' | 'catacumbas_martires' | 'santuario_sangue' | 'safe_house' | 'gloomy_woods';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  description: string;
  ambientColor: string;
  tileGroundKey: string;
  tileWallKey: string;
  accentColor: string;
}

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'offense' | 'defense' | 'utility';
  currentLevel: number;
  maxLevel: number;
  costPerLevel: number;
  statKey: 'damage' | 'maxHp' | 'hpRegen' | 'lifesteal' | 'cooldown' | 'moveSpeed' | 'sacrificeDiscount';
  bonusPerLevel: number;
}

export type MonsterBehavior = 'chaser' | 'ranged' | 'charger' | 'swarmer' | 'boss';

export type MonsterTemperament = 'aggressive' | 'tactical' | 'timid' | 'relentless' | 'highly_aggressive' | 'territorial' | 'defensive' | 'totally_passive';

export interface DroppedCorpse {
  hasDroppedCorpse: boolean;
  zone: string;
  x: number;
  y: number;
  droppedTimestamp: number;
  equipment: EquipmentSlots;
  curatives: {
    bandages: number;
    antidotes: number;
    antibiotics: number;
  };
}

export type MonsterGait = 'quadruped' | 'biped_fast' | 'biped_slow' | 'ethereal' | 'heavy';

export type MonsterBodyType =
  | 'fragile_flesh'
  | 'brittle_bone'
  | 'swarm_aerial'
  | 'humanoid_cultist'
  | 'beast_quadruped'
  | 'vampiric_noble'
  | 'dense_abomination'
  | 'spectral_entity'
  | 'boss';

export type DismembermentType = 'total_destruction' | 'partial_dismemberment' | 'normal_collapse';

export interface DismembermentResult {
  type: DismembermentType;
  gibScore: number;
  fragility: number;
  spellGibMultiplier: number;
  overkillRatio: number;
  isCrit: boolean;
  isExecution: boolean;
}

export type AIState = 'idle' | 'patrol' | 'patrol_away_from_player' | 'investigating' | 'combat' | 'flee' | 'frenzy';

export type EliteAffix = 'frenzied' | 'vampiric' | 'cursed' | 'spectral' | 'teleporter' | 'reflective' | 'none';

export interface MonsterConfig {
  id: string;
  name: string;
  description: string;
  hp: number;
  speed: number;
  damage: number;
  spriteKey: string;
  goreEffect: 'blood_splatter_red' | 'bone_dust' | 'acid_splash' | 'spectral_burst';
  xpDrop: number;
  attackRange: number;
  behavior: MonsterBehavior;
  temperament?: MonsterTemperament;
  gaitType?: MonsterGait;
  bodyType?: MonsterBodyType;
  fragility?: number; // 0.0 (dense/reinforced) to 1.0 (extremely fragile/gibbable)
  visionDistance?: number;
  visionConeDegrees?: number;
  hearingSensitivity?: number;
  dodgeChance?: number;
  courage?: number; // 0.0 to 1.0 (threshold for flee/panic)
  color: string;
  scale: number;
  scoreValue: number;
  executionFragments?: number;
  executionImpulse?: number;
  executionBloodScale?: number;
  statusEffectOnHit?: {
    type: 'bleeding' | 'poison' | 'infection';
    chance: number; // 0.0 to 1.0
  };
}

export interface SpellConfig {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  hpCost?: number;
  cooldownMs: number;
  baseDamage: number;
  projectileSpeed: number;
  type: 'projectile' | 'nova' | 'shield' | 'drain' | 'beam';
  gibPower?: number; // 0.2 to 2.5 (kinetic/explosive gore factor)
  icon: string;
  color: string;
  hotkey: string;
  level: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  category: 'stat' | 'spell' | 'passive';
  rarity: 'common' | 'rare' | 'legendary';
  icon: string;
  effect: {
    hpMaxAdd?: number;
    manaMaxAdd?: number;
    moveSpeedPercent?: number;
    damageMultiplierPercent?: number;
    cooldownReductionPercent?: number;
    vampirismPercent?: number;
    projectileAdd?: number;
    unlockSpellId?: string;
  };
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  moveSpeed: number;
  damageMultiplier: number;
  cooldownReduction: number;
  vampirism: number; // % life steal
  sacrificeDiscount?: number;
  projectileBonus: number;
  kills: number;
  souls: number;
  wave: number;
  floorDepth: number;
  score: number;
  timeSurvivedSeconds: number;
  unlockedSpells: string[]; // spell IDs
  pendingStatPoints: number; // unspent talent/skill points
  knockoutCount: number;
  isUnconscious: boolean;
  isDefinitivelyDead: boolean;
  statusConditions: {
    bleeding: boolean;
    poison: boolean;
    infection: boolean;
  };
  curatives: {
    bandages: number;
    antidotes: number;
    antibiotics: number;
  };
  droppedCorpse: DroppedCorpse;
}

export interface WaveConfig {
  waveNumber: number;
  monsterPool: string[]; // monster IDs
  totalMonsters: number;
  spawnIntervalMs: number;
  isBossWave: boolean;
  bossMonsterId?: string;
}

export interface GameSettings {
  minimapVisible: boolean;
  minimapAlpha: number;
  animatedPortrait: boolean;
  crtFilter: boolean;
  sfxVolume: number; // 0 to 1
  bgmVolume: number; // 0 to 1
  touchSensitivity: number; // 0.5 to 2.0
  virtualControlsOpacity: number; // 0.2 to 1.0
  controlsMode: 'auto' | 'touch' | 'keyboard';
  joystickDeadzone?: number; // 0 to 0.5 (normalized)
  joystickCurve?: number; // 0.5 to 3.0 (response curve exponent)
  screenShakeEnabled?: boolean;
  flashesEnabled?: boolean;
  fearDistortionEnabled?: boolean; // toggle for panic wave screen distortion
  tinnitusEnabled?: boolean; // toggle for threat high-frequency audio tinnitus
  atmosphereEffectsEnabled?: boolean; // threat indicator + danger vignette + directional audio
  lowPerformanceParticles?: boolean;
  highContrastDamageTexts?: boolean;
  postProcessingEnabled?: boolean;
  hudLayout?: Record<string, { x: number, y: number, size: 'small' | 'medium' | 'large' }>;
  activePaletteId?: string;
}

export interface HighScoreRecord {
  id: string;
  date: string;
  score: number;
  kills: number;
  wave: number;
  timeSurvived: string;
  levelReached: number;
}

export type CodexCategory = 'enemies' | 'relics' | 'lore';

export interface CodexMilestone {
  killCount: number;
  rewardCrystals: number;
  description: string;
}

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  title: string;
  subtitle?: string;
  lore: string;
  icon?: string;
  monsterId?: string;
  relicId?: string;
  unlockCriteria?: string;
  milestones?: CodexMilestone[];
  statsOverview?: Record<string, string | number>;
}

export interface CodexState {
  enemyKills: Record<string, number>;
  unlockedEntries: string[];
  claimedMilestones: Record<string, number[]>; // entryId -> array of completed milestone killCounts
}

export interface AchievementState {
  id: string;
  unlocked: boolean;
  redeemed: boolean;
}

export interface RunStats {
  bloodless_floor: number;
  kills_total: number;
  kills_gargoyle: number;
  speedrun_f3: number;
  deaths_total: number;
  hp_healed_magic: number;
  dismemberments_total: number;
  mana_orbs_run: number;
  crystals_hoarded: number;
  survival_time_run: number;
}

export * from './campaign';
