export type ItemRarity = 'common' | 'rare' | 'epic';
export type ItemType = 'weapon' | 'armor' | 'relic';

export interface LootItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: {
    damageMultiplier?: number;
    maxHpBonus?: number;
    speedBonus?: number;
    lifestealBonus?: number;
  };
}

export type MonsterBehavior = 'chaser' | 'ranged' | 'charger' | 'swarmer' | 'boss';

export type MonsterTemperament = 'aggressive' | 'tactical' | 'timid' | 'relentless';

export type MonsterGait = 'quadruped' | 'biped_fast' | 'biped_slow' | 'ethereal' | 'heavy';

export type AIState = 'idle' | 'patrol' | 'investigating' | 'combat' | 'flee' | 'frenzy';

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
  visionDistance?: number;
  visionConeDegrees?: number;
  hearingSensitivity?: number;
  dodgeChance?: number;
  courage?: number; // 0.0 to 1.0 (threshold for flee/panic)
  color: string;
  scale: number;
  scoreValue: number;
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
  projectileBonus: number;
  kills: number;
  souls: number;
  wave: number;
  floorDepth: number;
  score: number;
  timeSurvivedSeconds: number;
  unlockedSpells: string[]; // spell IDs
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
  crtFilter: boolean;
  sfxVolume: number; // 0 to 1
  bgmVolume: number; // 0 to 1
  touchSensitivity: number; // 0.5 to 2.0
  virtualControlsOpacity: number; // 0.2 to 1.0
  controlsMode: 'auto' | 'touch' | 'keyboard';
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
