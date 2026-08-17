import { create } from 'zustand';
import { PlayerStats, UpgradeOption, GameSettings, HighScoreRecord, LootItem, RelicItem, RelicEffect, EquipmentSlots, BiomeType, DroppedCorpse, CodexState } from '../types/game';
import { loadSettings, saveSettings, loadHighScores, saveHighScore, loadBloodCrystals, saveBloodCrystals, loadTalentLevels, saveTalentLevels, loadOnboarding, saveOnboarding, loadUnlockedRelics, saveUnlockedRelics, loadEquippedRelicIds, saveEquippedRelicIds, loadCodexState, saveCodexState } from '../utils/localStorage';
import { soundEngine } from '../utils/soundEngine';
import { CodexSystem } from '../game/systems/CodexSystem';
import relicsData from '../data/relics.json';

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
  isCodexOpen: boolean;
  setCodexOpen: (isOpen: boolean) => void;
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
  isEditingHUD: boolean;
  setEditingHUD: (isEditing: boolean) => void;
  gamepadConnected: boolean;
  setGamepadConnected: (connected: boolean) => void;
  activeContracts: { id: string; label: string; description: string; progress: number; target: number; completed: boolean }[];
  setActiveContracts: (contracts: any[]) => void;
  updateContractProgress: (id: string, progress: number) => void;
  completeContract: (id: string) => void;
  activeModifiers: string[];
  toggleModifier: (id: string) => void;
  clearModifiers: () => void;
  onboarding: {
    firstKillDone: boolean;
    firstLevelUpDone: boolean;
    firstEquipDone: boolean;
    firstBossSeen: boolean;
    firstSkillCast: boolean;
  };
  triggerOnboardingEvent: (key: 'firstKillDone' | 'firstLevelUpDone' | 'firstEquipDone' | 'firstBossSeen' | 'firstSkillCast', tipText: string) => void;
  activeTip: string | null;
  setActiveTip: (tip: string | null) => void;
  isRecordsOpen: boolean;
  setRecordsOpen: (isOpen: boolean) => void;

  // Metagame Currency & Talents
  bloodCrystals: number;
  addBloodCrystals: (amount: number) => void;
  talentLevels: Record<string, number>;
  upgradeTalent: (talentId: string, cost: number) => boolean;

  // Codex & Lore System
  codexState: CodexState;
  onEnemyKilled: (monsterId: string) => void;
  claimCodexMilestone: (entryId: string, killCount: number) => boolean;
  unlockCodexEntry: (entryId: string) => void;
  getLoreCompletionPercentage: () => number;

  // Relic System & Metagame
  unlockedRelics: string[];
  unlockRelic: (relicId: string) => void;
  equipRelicById: (relicId: string) => boolean;
  unequipRelicById: (relicId: string) => void;
  getRelicModifiers: () => RelicEffect;

  // Equipment & Loot
  equipment: EquipmentSlots;
  equipItem: (item: LootItem | RelicItem) => void;
  clearInventoryOnDeath: () => void;
  retrieveCorpseLoot: () => void;
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
  setUnconscious: (unconscious: boolean) => void;
  setStatusCondition: (condition: 'bleeding' | 'poison' | 'infection', active: boolean) => void;
  setDefinitivelyDead: (isDead: boolean) => void;
  setDroppedCorpse: (corpse: DroppedCorpse) => void;
  useCurative: (type: 'bandages' | 'antidotes' | 'antibiotics') => boolean;
  buyCurative: (type: 'bandages' | 'antidotes' | 'antibiotics', cost: number) => boolean;

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

  activeScavengeable: { id: string; type: string; duration: number } | null;
  setActiveScavengeable: (scav: { id: string; type: string; duration: number } | null) => void;
  scavengeProgress: number;
  setScavengeProgress: (prog: number) => void;

  activeNPC: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | null;
  setActiveNPC: (npc: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | null) => void;
  closestNPCType: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | null;
  setClosestNPCType: (type: 'cleric' | 'alchemist' | 'blacksmith' | 'elder' | null) => void;

  currentTarget: { id: string; name: string; hp: number; maxHp: number; level?: number; isBoss?: boolean; lastAttacked: number } | null;
  setCurrentTarget: (target: { id: string; name: string; hp: number; maxHp: number; level?: number; isBoss?: boolean } | null) => void;
  clearStaleTarget: (timeNow: number) => void;
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
  knockoutCount: 0,
  isUnconscious: false,
  isDefinitivelyDead: false,
  statusConditions: {
    bleeding: false,
    poison: false,
    infection: false,
  },
  curatives: {
    bandages: 1,
    antidotes: 1,
    antibiotics: 0,
  },
  droppedCorpse: {
    hasDroppedCorpse: false,
    zone: '',
    x: 0,
    y: 0,
    droppedTimestamp: 0,
    equipment: { weapon: null, armor: null, relics: [] },
    curatives: { bandages: 0, antidotes: 0, antibiotics: 0 },
  },
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
  setBestiaryOpen: (isOpen) => set({ isBestiaryOpen: isOpen, isCodexOpen: isOpen }),
  isCodexOpen: false,
  setCodexOpen: (isOpen) => set({ isCodexOpen: isOpen, isBestiaryOpen: isOpen }),
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
  isEditingHUD: false,
  setEditingHUD: (isEditing) => set({ isEditingHUD: isEditing }),
  gamepadConnected: false,
  setGamepadConnected: (connected) => set({ gamepadConnected: connected }),
  activeModifiers: [],
  toggleModifier: (id) => {
    const current = get().activeModifiers;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    set({ activeModifiers: next });
  },
  clearModifiers: () => set({ activeModifiers: [] }),
  onboarding: loadOnboarding(),
  activeTip: null,
  setActiveTip: (tip) => set({ activeTip: tip }),
  triggerOnboardingEvent: (key, tipText) => {
    const current = get().onboarding;
    if (current[key]) return; // Already triggered before

    const updated = { ...current, [key]: true };
    saveOnboarding(updated);
    set({ onboarding: updated, activeTip: tipText });

    // Auto-fade tip after 6 seconds
    setTimeout(() => {
      if (get().activeTip === tipText) {
        set({ activeTip: null });
      }
    }, 6000);
  },
  activeContracts: [],
  setActiveContracts: (contracts) => set({ activeContracts: contracts }),
  updateContractProgress: (id, progress) => {
    const current = get().activeContracts;
    const updated = current.map((c) => {
      if (c.id === id) {
        return { ...c, progress: Math.min(c.target, progress) };
      }
      return c;
    });
    set({ activeContracts: updated });
  },
  completeContract: (id) => {
    const current = get().activeContracts;
    const updated = current.map((c) => {
      if (c.id === id) {
        return { ...c, completed: true, progress: c.target };
      }
      return c;
    });
    set({ activeContracts: updated });
  },
  isRecordsOpen: false,
  setRecordsOpen: (isOpen) => set({ isRecordsOpen: isOpen }),

  bloodCrystals: loadBloodCrystals(),
  addBloodCrystals: (amount) => {
    const current = get().bloodCrystals;
    const mult = get().getRelicModifiers().bloodCrystalMultiplier || 1.0;
    const finalAmount = amount > 0 ? Math.round(amount * mult) : amount;
    const next = current + finalAmount;
    saveBloodCrystals(next);
    set({ bloodCrystals: next });
  },

  codexState: loadCodexState(),
  onEnemyKilled: (monsterId) => {
    const currentState = get().codexState;
    const { nextState } = CodexSystem.recordKill(monsterId, currentState);
    saveCodexState(nextState);
    set({ codexState: nextState });
  },
  claimCodexMilestone: (entryId, killCount) => {
    const currentState = get().codexState;
    const { success, rewardCrystals, nextState } = CodexSystem.claimMilestone(entryId, killCount, currentState);
    if (success) {
      saveCodexState(nextState);
      set({ codexState: nextState });
      get().addBloodCrystals(rewardCrystals);
      soundEngine.playOrbPickup();
    }
    return success;
  },
  unlockCodexEntry: (entryId) => {
    const currentState = get().codexState;
    const nextState = CodexSystem.unlockEntry(entryId, currentState);
    saveCodexState(nextState);
    set({ codexState: nextState });
  },
  getLoreCompletionPercentage: () => {
    return CodexSystem.calculateCompletionPercentage(get().codexState);
  },

  unlockedRelics: loadUnlockedRelics(),
  unlockRelic: (relicId) => {
    const current = get().unlockedRelics;
    if (!current.includes(relicId)) {
      const next = [...current, relicId];
      saveUnlockedRelics(next);
      set({ unlockedRelics: next });
    }
  },

  equipRelicById: (relicId) => {
    const relic = (relicsData as RelicItem[]).find((r) => r.id === relicId);
    if (!relic) return false;

    const { equipment } = get();
    const currentRelics = equipment.relics as RelicItem[];

    // If already equipped, return true
    if (currentRelics.some((r) => r.id === relicId)) return true;

    let updatedRelics: RelicItem[] = [];
    if (currentRelics.length < 3) {
      updatedRelics = [...currentRelics, relic];
    } else {
      updatedRelics = [currentRelics[1], currentRelics[2], relic];
    }

    const nextEquipment = { ...equipment, relics: updatedRelics };
    saveEquippedRelicIds(updatedRelics.map((r) => r.id));
    set({ equipment: nextEquipment });
    soundEngine.playEquipLoot();
    return true;
  },

  unequipRelicById: (relicId) => {
    const { equipment } = get();
    const currentRelics = equipment.relics as RelicItem[];
    const updatedRelics = currentRelics.filter((r) => r.id !== relicId);
    const nextEquipment = { ...equipment, relics: updatedRelics };
    saveEquippedRelicIds(updatedRelics.map((r) => r.id));
    set({ equipment: nextEquipment });
  },

  getRelicModifiers: () => {
    const { equipment } = get();
    const combined: RelicEffect = {
      damageMultiplier: 0,
      maxHpBonus: 0,
      speedBonus: 0,
      lifestealBonus: 0,
      cooldownReductionBonus: 0,
      hpRegenBonus: 0,
      bloodCrystalMultiplier: 1.0,
      bleedChanceOnHit: 0,
      bleedDamagePerSecond: 0,
      spellCostDiscount: 0,
    };

    equipment.relics.forEach((r) => {
      const effect = (r as RelicItem).effect || {};
      if (effect.damageMultiplier) combined.damageMultiplier! += effect.damageMultiplier;
      if (effect.maxHpBonus) combined.maxHpBonus! += effect.maxHpBonus;
      if (effect.speedBonus) combined.speedBonus! += effect.speedBonus;
      if (effect.lifestealBonus) combined.lifestealBonus! += effect.lifestealBonus;
      if (effect.cooldownReductionBonus) combined.cooldownReductionBonus! += effect.cooldownReductionBonus;
      if (effect.hpRegenBonus) combined.hpRegenBonus! += effect.hpRegenBonus;
      if (effect.bloodCrystalMultiplier) combined.bloodCrystalMultiplier! *= effect.bloodCrystalMultiplier;
      if (effect.bleedChanceOnHit) combined.bleedChanceOnHit! = Math.max(combined.bleedChanceOnHit!, effect.bleedChanceOnHit);
      if (effect.bleedDamagePerSecond) combined.bleedDamagePerSecond! += effect.bleedDamagePerSecond;
      if (effect.spellCostDiscount) combined.spellCostDiscount! += effect.spellCostDiscount;
    });

    return combined;
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
    relics: loadEquippedRelicIds()
      .map((id) => (relicsData as RelicItem[]).find((r) => r.id === id))
      .filter((r): r is RelicItem => Boolean(r)),
  },
  equipItem: (item) => {
    const { equipment } = get();
    const updated = { ...equipment };
    if (item.type === 'weapon') {
      updated.weapon = item as LootItem;
    } else if (item.type === 'armor') {
      updated.armor = item as LootItem;
    } else if (item.type === 'relic') {
      // Up to 3 relics, replaces oldest if full
      if (updated.relics.length < 3) {
        updated.relics = [...updated.relics, item];
      } else {
        updated.relics = [updated.relics[1], updated.relics[2], item];
      }
      saveEquippedRelicIds(updated.relics.map((r) => r.id));
    }
    set({ equipment: updated });
  },
  clearInventoryOnDeath: () => {
    set((state) => ({
      equipment: { weapon: null, armor: null, relics: [] },
      playerStats: {
        ...state.playerStats,
        curatives: { bandages: 0, antidotes: 0, antibiotics: 0 }
      }
    }));
  },
  retrieveCorpseLoot: () => {
    const state = get();
    const corpse = state.playerStats.droppedCorpse;
    if (corpse.hasDroppedCorpse) {
      set({
        equipment: corpse.equipment,
        playerStats: {
          ...state.playerStats,
          curatives: corpse.curatives,
          droppedCorpse: { ...corpse, hasDroppedCorpse: false }
        }
      });
      state.addLootLog("Equipamentos e itens recuperados com sucesso!");
    }
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
  setUnconscious: (unconscious) => set((state) => ({
    playerStats: { ...state.playerStats, isUnconscious: unconscious }
  })),
  setStatusCondition: (condition, active) => set((state) => ({
    playerStats: {
      ...state.playerStats,
      statusConditions: {
        ...state.playerStats.statusConditions,
        [condition]: active
      }
    }
  })),
  setDefinitivelyDead: (isDead) => set((state) => ({
    playerStats: { ...state.playerStats, isDefinitivelyDead: isDead }
  })),
  setDroppedCorpse: (corpse) => set((state) => ({
    playerStats: { ...state.playerStats, droppedCorpse: corpse }
  })),
  useCurative: (type) => {
    const { playerStats } = get();
    if (playerStats.curatives[type] < 1) return false;

    let condition: 'bleeding' | 'poison' | 'infection' | null = null;
    if (type === 'bandages') condition = 'bleeding';
    else if (type === 'antidotes') condition = 'poison';
    else if (type === 'antibiotics') condition = 'infection';

    if (!condition || !playerStats.statusConditions[condition]) return false;

    soundEngine.playEquipLoot(); // Use sound
    set((state) => ({
      playerStats: {
        ...state.playerStats,
        statusConditions: {
          ...state.playerStats.statusConditions,
          [condition!]: false,
        },
        curatives: {
          ...state.playerStats.curatives,
          [type]: state.playerStats.curatives[type] - 1,
        },
      },
    }));
    return true;
  },
  buyCurative: (type, cost) => {
    const { bloodCrystals, playerStats } = get();
    if (bloodCrystals < cost) return false;

    const nextCrystals = bloodCrystals - cost;
    saveBloodCrystals(nextCrystals);

    soundEngine.playEquipLoot(); // Shop use sound
    set((state) => ({
      bloodCrystals: nextCrystals,
      playerStats: {
        ...state.playerStats,
        curatives: {
          ...state.playerStats.curatives,
          [type]: state.playerStats.curatives[type] + 1,
        },
      },
    }));
    return true;
  },

  touchMoveInput: { x: 0, y: 0 },
  setTouchMoveInput: (x, y) => set({ touchMoveInput: { x, y } }),
  
  touchAimInput: { x: 0, y: 0 },
  setTouchAimInput: (x, y) => set({ touchAimInput: { x, y } }),

  activeSkillTrigger: null,
  setActiveSkillTrigger: (skill) => set({ activeSkillTrigger: skill }),

  skillPreset: ['hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe'],
  setSkillPreset: (preset) => set({ skillPreset: preset }),

  activeScavengeable: null,
  setActiveScavengeable: (scav) => set({ activeScavengeable: scav }),
  scavengeProgress: 0,
  setScavengeProgress: (prog) => set({ scavengeProgress: prog }),

  activeNPC: null,
  setActiveNPC: (npc) => set({ activeNPC: npc }),
  closestNPCType: null,
  setClosestNPCType: (type) => set({ closestNPCType: type }),

  currentTarget: null,
  setCurrentTarget: (target) => set({ 
    currentTarget: target ? { ...target, lastAttacked: Date.now() } : null 
  }),
  clearStaleTarget: (timeNow) => set((state) => {
    if (state.currentTarget && timeNow - state.currentTarget.lastAttacked > 5000) {
      return { currentTarget: null };
    }
    return state;
  }),
}));
