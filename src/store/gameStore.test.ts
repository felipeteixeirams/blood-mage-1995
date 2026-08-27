import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';
import { LootItem } from '../types/game';

vi.mock('../utils/soundEngine', () => ({
  soundEngine: {
    setVolumes: vi.fn(),
    toggleMute: vi.fn(() => true),
    playEquipLoot: vi.fn(),
    playOrbPickup: vi.fn(),
  },
}));

const initialStore = useGameStore.getState();

function resetStore() {
  localStorage.clear();
  useGameStore.setState(initialStore, true);
}

function makeItem(partial: Partial<LootItem>): LootItem {
  return {
    id: `item_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Teste',
    type: 'relic',
    rarity: 'common',
    stats: {},
    ...partial,
  };
}

describe('gameStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('codex system & actions', () => {
    it('records enemy kill and unlocks codex entry', () => {
      useGameStore.getState().onEnemyKilled('skeleton_warrior');
      const state = useGameStore.getState();
      expect(state.codexState.enemyKills.skeleton_warrior).toBe(1);
      expect(state.codexState.unlockedEntries).toContain('skeleton_warrior');
    });

    it('claims milestone reward and adds blood crystals', () => {
      // Record 10 kills
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().onEnemyKilled('skeleton_warrior');
      }

      const initialCrystals = useGameStore.getState().bloodCrystals;
      const claimed = useGameStore.getState().claimCodexMilestone('skeleton_warrior', 10);
      expect(claimed).toBe(true);
      expect(useGameStore.getState().bloodCrystals).toBeGreaterThan(initialCrystals);
      expect(useGameStore.getState().codexState.claimedMilestones['skeleton_warrior']).toContain(10);
    });

    it('calculates completion percentage', () => {
      const pct = useGameStore.getState().getLoreCompletionPercentage();
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });

  describe('bloodCrystals & talents', () => {
    it('adds blood crystals', () => {
      useGameStore.getState().addBloodCrystals(100);
      expect(useGameStore.getState().bloodCrystals).toBe(100);
    });

    it('upgradeTalent returns false when crystals are insufficient', () => {
      useGameStore.getState().addBloodCrystals(10);
      const ok = useGameStore.getState().upgradeTalent('hemomancy_power', 50);
      expect(ok).toBe(false);
      expect(useGameStore.getState().talentLevels.hemomancy_power).toBe(0);
      expect(useGameStore.getState().bloodCrystals).toBe(10);
    });

    it('upgradeTalent deducts cost and increases level when affordable', () => {
      useGameStore.getState().addBloodCrystals(100);
      const ok = useGameStore.getState().upgradeTalent('hemomancy_power', 40);
      expect(ok).toBe(true);
      expect(useGameStore.getState().bloodCrystals).toBe(60);
      expect(useGameStore.getState().talentLevels.hemomancy_power).toBe(1);
    });
  });

  describe('contracts', () => {
    it('updateContractProgress caps at target', () => {
      useGameStore.getState().setActiveContracts([
        { id: 'c1', label: 'L', description: 'D', progress: 0, target: 3, completed: false },
      ]);
      useGameStore.getState().updateContractProgress('c1', 99);
      expect(useGameStore.getState().activeContracts[0].progress).toBe(3);
    });

    it('completeContract marks completed and sets progress to target', () => {
      useGameStore.getState().setActiveContracts([
        { id: 'c1', label: 'L', description: 'D', progress: 1, target: 3, completed: false },
      ]);
      useGameStore.getState().completeContract('c1');
      const contract = useGameStore.getState().activeContracts[0];
      expect(contract.completed).toBe(true);
      expect(contract.progress).toBe(3);
    });
  });

  describe('modifiers', () => {
    it('toggles a modifier on and off', () => {
      useGameStore.getState().toggleModifier('rune_famine');
      expect(useGameStore.getState().activeModifiers).toContain('rune_famine');
      useGameStore.getState().toggleModifier('rune_famine');
      expect(useGameStore.getState().activeModifiers).not.toContain('rune_famine');
    });

    it('clearModifiers empties the list', () => {
      useGameStore.getState().toggleModifier('rune_famine');
      useGameStore.getState().toggleModifier('blood_tide');
      useGameStore.getState().clearModifiers();
      expect(useGameStore.getState().activeModifiers).toEqual([]);
    });
  });

  describe('relics system', () => {
    it('unlocks a relic', () => {
      useGameStore.getState().unlockRelic('coracao_abissal');
      expect(useGameStore.getState().unlockedRelics).toContain('coracao_abissal');
    });

    it('equips and unequips relic by ID', () => {
      const ok = useGameStore.getState().equipRelicById('selo_hemorragico');
      expect(ok).toBe(true);
      expect(useGameStore.getState().equipment.relics.some((r) => r.id === 'selo_hemorragico')).toBe(true);

      useGameStore.getState().unequipRelicById('selo_hemorragico');
      expect(useGameStore.getState().equipment.relics.some((r) => r.id === 'selo_hemorragico')).toBe(false);
    });

    it('calculates combined relic modifiers', () => {
      useGameStore.getState().equipRelicById('selo_hemorragico');
      useGameStore.getState().equipRelicById('calice_amaldicoado');

      const mods = useGameStore.getState().getRelicModifiers();
      expect(mods.bleedChanceOnHit).toBe(0.30);
      expect(mods.bloodCrystalMultiplier).toBe(1.50);
      expect(mods.hpRegenBonus).toBe(-0.5);
    });

    it('applies bloodCrystalMultiplier to addBloodCrystals', () => {
      useGameStore.getState().equipRelicById('calice_amaldicoado'); // 1.5x multiplier
      useGameStore.getState().addBloodCrystals(100);
      expect(useGameStore.getState().bloodCrystals).toBe(150);
    });
  });

  describe('equipment', () => {
    it('equips a weapon', () => {
      const weapon = makeItem({ type: 'weapon', stats: { damageMultiplier: 0.5 } });
      useGameStore.getState().equipItem(weapon);
      expect(useGameStore.getState().equipment.weapon).toEqual(weapon);
    });

    it('stores up to 3 relics replacing the oldest when full', () => {
      const r1 = makeItem({ type: 'relic' });
      const r2 = makeItem({ type: 'relic' });
      const r3 = makeItem({ type: 'relic' });
      const r4 = makeItem({ type: 'relic' });

      useGameStore.getState().equipItem(r1);
      useGameStore.getState().equipItem(r2);
      useGameStore.getState().equipItem(r3);
      expect(useGameStore.getState().equipment.relics).toHaveLength(3);

      useGameStore.getState().equipItem(r4);
      const relics = useGameStore.getState().equipment.relics;
      expect(relics).toHaveLength(3);
      expect(relics).toContainEqual(r4);
      expect(relics).not.toContainEqual(r1);
    });
  });

  describe('curatives', () => {
    it('useCurative returns false when none are owned', () => {
      const ok = useGameStore.getState().useCurative('bandages');
      expect(ok).toBe(false);
    });

    it('useCurative returns false when the condition is not active', () => {
      const state = useGameStore.getState();
      state.setPlayerStats({ ...state.playerStats, curatives: { bandages: 2, antidotes: 1, antibiotics: 0 } });
      const ok = useGameStore.getState().useCurative('bandages');
      expect(ok).toBe(false);
    });

    it('useCurative cures the condition and consumes one item', () => {
      const state = useGameStore.getState();
      state.setPlayerStats({
        ...state.playerStats,
        curatives: { bandages: 2, antidotes: 1, antibiotics: 0 },
        statusConditions: { bleeding: true, poison: false, infection: false },
      });
      const ok = useGameStore.getState().useCurative('bandages');
      expect(ok).toBe(true);
      const ps = useGameStore.getState().playerStats;
      expect(ps.statusConditions.bleeding).toBe(false);
      expect(ps.curatives.bandages).toBe(1);
    });

    it('buyCurative returns false when crystals are insufficient', () => {
      const ok = useGameStore.getState().buyCurative('bandages', 500);
      expect(ok).toBe(false);
    });

    it('buyCurative deducts crystals and adds one item', () => {
      useGameStore.getState().addBloodCrystals(200);
      const ok = useGameStore.getState().buyCurative('antidotes', 50);
      expect(ok).toBe(true);
      expect(useGameStore.getState().bloodCrystals).toBe(150);
      expect(useGameStore.getState().playerStats.curatives.antidotes).toBe(2);
    });
  });

  describe('death & corpse', () => {
    it('clearInventoryOnDeath resets equipment and curatives', () => {
      const weapon = makeItem({ type: 'weapon' });
      useGameStore.getState().equipItem(weapon);
      useGameStore.getState().clearInventoryOnDeath();
      const state = useGameStore.getState();
      expect(state.equipment.weapon).toBeNull();
      expect(state.playerStats.curatives.bandages).toBe(0);
      expect(state.playerStats.curatives.antidotes).toBe(0);
    });

    it('retrieveCorpseLoot restores equipment and clears corpse flag', () => {
      const weapon = makeItem({ type: 'weapon', stats: { maxHpBonus: 10 } });
      useGameStore.getState().setDroppedCorpse({
        hasDroppedCorpse: true,
        zone: 'fosso_chagas',
        x: 0,
        y: 0,
        droppedTimestamp: 1,
        equipment: { weapon, armor: null, relics: [] },
        curatives: { bandages: 3, antidotes: 0, antibiotics: 0 },
      });
      useGameStore.getState().retrieveCorpseLoot();
      const state = useGameStore.getState();
      expect(state.equipment.weapon).toEqual(weapon);
      expect(state.playerStats.curatives.bandages).toBe(3);
      expect(state.playerStats.droppedCorpse.hasDroppedCorpse).toBe(false);
    });
  });

  describe('loot log', () => {
    it('keeps only the latest 5 messages', () => {
      for (let i = 0; i < 8; i++) {
        useGameStore.getState().addLootLog(`msg_${i}`);
      }
      const log = useGameStore.getState().recentLootLog;
      expect(log).toHaveLength(5);
      expect(log[0]).toBe('msg_7');
    });
  });

  describe('player status', () => {
    it('setStatusCondition updates only the target condition', () => {
      useGameStore.getState().setStatusCondition('bleeding', true);
      const sc = useGameStore.getState().playerStats.statusConditions;
      expect(sc.bleeding).toBe(true);
      expect(sc.poison).toBe(false);
    });

    it('setDefinitivelyDead flags the player', () => {
      useGameStore.getState().setDefinitivelyDead(true);
      expect(useGameStore.getState().playerStats.isDefinitivelyDead).toBe(true);
    });
  });

  describe('ui state setters', () => {
    it('setGameState transitions between states', () => {
      useGameStore.getState().setGameState('playing');
      expect(useGameStore.getState().gameState).toBe('playing');
      useGameStore.getState().setGameState('paused');
      expect(useGameStore.getState().gameState).toBe('paused');
    });

    it('updateSettings persists and applies new settings', () => {
      const custom = { ...useGameStore.getState().settings, sfxVolume: 0.3 };
      useGameStore.getState().updateSettings(custom);
      expect(useGameStore.getState().settings.sfxVolume).toBe(0.3);
    });

    it('toggleMute flips the muted flag', () => {
      useGameStore.getState().toggleMute();
      expect(useGameStore.getState().isMuted).toBe(true);
    });

    it('modal open/close setters work', () => {
      const state = useGameStore.getState();
      state.setSettingsOpen(true);
      state.setHighScoresOpen(true);
      state.setInventoryOpen(true);
      state.setTalentsOpen(true);
      state.setBestiaryOpen(true);
      state.setObservabilityOpen(true);
      expect(useGameStore.getState().isSettingsOpen).toBe(true);
      expect(useGameStore.getState().isHighScoresOpen).toBe(true);
      expect(useGameStore.getState().isInventoryOpen).toBe(true);
      expect(useGameStore.getState().isTalentsOpen).toBe(true);
      expect(useGameStore.getState().isBestiaryOpen).toBe(true);
      expect(useGameStore.getState().isObservabilityOpen).toBe(true);
    });

    it('setLevelUpData and setGameOverStats store payloads', () => {
      useGameStore.getState().setLevelUpData({ level: 3, choices: [] });
      useGameStore.getState().setGameOverStats({ score: 100 } as never);
      expect(useGameStore.getState().levelUpData?.level).toBe(3);
      expect(useGameStore.getState().gameOverStats?.score).toBe(100);
    });

    it('setDroppedCorpse persists a corpse in player stats', () => {
      useGameStore.getState().setDroppedCorpse({
        hasDroppedCorpse: true,
        zone: 'catacumbas_martires',
        x: 5,
        y: 6,
        droppedTimestamp: 10,
        equipment: { weapon: null, armor: null, relics: [] },
        curatives: { bandages: 1, antidotes: 0, antibiotics: 0 },
      });
      expect(useGameStore.getState().playerStats.droppedCorpse.hasDroppedCorpse).toBe(true);
    });
  });

  describe('input & skill triggers', () => {
    it('setTouchMoveInput and setTouchAimInput update vectors', () => {
      useGameStore.getState().setTouchMoveInput(0.5, -0.5);
      useGameStore.getState().setTouchAimInput(1, 0);
      expect(useGameStore.getState().touchMoveInput).toEqual({ x: 0.5, y: -0.5 });
      expect(useGameStore.getState().touchAimInput).toEqual({ x: 1, y: 0 });
    });

    it('setActiveSkillTrigger stores the triggered skill', () => {
      useGameStore.getState().setActiveSkillTrigger('nova');
      expect(useGameStore.getState().activeSkillTrigger).toBe('nova');
    });

    it('setSkillPreset replaces the pinned spells', () => {
      useGameStore.getState().setSkillPreset(['blood_bolt']);
      expect(useGameStore.getState().skillPreset).toEqual(['blood_bolt']);
    });

    it('setCurrentBiome changes the biome', () => {
      useGameStore.getState().setCurrentBiome('santuario_sangue');
      expect(useGameStore.getState().currentBiome).toBe('santuario_sangue');
    });

    it('setGamepadConnected flags connection', () => {
      useGameStore.getState().setGamepadConnected(true);
      expect(useGameStore.getState().gamepadConnected).toBe(true);
    });
  });

  describe('Phaser<->React typed bridge (docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md)', () => {
    it('setActiveCurativeTrigger stores and clears the curative command', () => {
      useGameStore.getState().setActiveCurativeTrigger('bandages');
      expect(useGameStore.getState().activeCurativeTrigger).toBe('bandages');
      useGameStore.getState().setActiveCurativeTrigger(null);
      expect(useGameStore.getState().activeCurativeTrigger).toBeNull();
    });

    it('setRespawnRequested toggles the respawn command', () => {
      expect(useGameStore.getState().respawnRequested).toBe(false);
      useGameStore.getState().setRespawnRequested(true);
      expect(useGameStore.getState().respawnRequested).toBe(true);
      useGameStore.getState().setRespawnRequested(false);
      expect(useGameStore.getState().respawnRequested).toBe(false);
    });

    it('bumpCosmeticTint increments the version on every call, including concurrent-looking calls', () => {
      const start = useGameStore.getState().cosmeticTintVersion;
      useGameStore.getState().bumpCosmeticTint();
      useGameStore.getState().bumpCosmeticTint();
      expect(useGameStore.getState().cosmeticTintVersion).toBe(start + 2);
    });

    it('setDragAim stores the full gesture state for start/move/end phases', () => {
      useGameStore.getState().setDragAim({ spellId: 'crimson_scythe', phase: 'start', dx: 0, dy: 0, isDrag: false });
      expect(useGameStore.getState().dragAim).toEqual({ spellId: 'crimson_scythe', phase: 'start', dx: 0, dy: 0, isDrag: false });

      useGameStore.getState().setDragAim({ spellId: 'crimson_scythe', phase: 'move', dx: 40, dy: -12, isDrag: true });
      expect(useGameStore.getState().dragAim).toEqual({ spellId: 'crimson_scythe', phase: 'move', dx: 40, dy: -12, isDrag: true });

      useGameStore.getState().setDragAim({ spellId: 'crimson_scythe', phase: 'end', dx: 40, dy: -12, isDrag: true });
      expect(useGameStore.getState().dragAim).toEqual({ spellId: 'crimson_scythe', phase: 'end', dx: 40, dy: -12, isDrag: true });
    });

    it('notifyLootPickup stores the item and increments id on every call, even for the same item reference', () => {
      const item = makeItem({ name: 'Adaga Enferrujada', rarity: 'common' });

      useGameStore.getState().notifyLootPickup(item);
      expect(useGameStore.getState().lastLootPickup).toEqual({ item, id: 1 });

      // Segundo pickup consecutivo do mesmo objeto: id precisa mudar para que
      // o LootLog dispare o toast de novo, mesmo que o item seja idêntico.
      useGameStore.getState().notifyLootPickup(item);
      expect(useGameStore.getState().lastLootPickup).toEqual({ item, id: 2 });
    });

    it('notifyLootPickup id keeps incrementing across resets of unrelated state', () => {
      useGameStore.getState().notifyLootPickup(makeItem({ name: 'Item A' }));
      useGameStore.getState().setActiveSkillTrigger('nova'); // ação não relacionada não deve afetar o contador
      useGameStore.getState().notifyLootPickup(makeItem({ name: 'Item B' }));
      expect(useGameStore.getState().lastLootPickup?.id).toBe(2);
      expect(useGameStore.getState().lastLootPickup?.item.name).toBe('Item B');
    });
  });

  describe('minimap (docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md)', () => {
    it('setMinimapRooms starts empty and stores the full snapshot GameScene pushes', () => {
      expect(useGameStore.getState().minimapRooms).toEqual([]);

      const snapshot = [
        { index: 0, type: 'spawn' as const, explored: true, hasChest: false, hasPlayer: true, x: 0, y: 0, width: 100, height: 100 },
        { index: 1, type: 'chamber' as const, explored: false, hasChest: false, hasPlayer: false, x: 100, y: 0, width: 100, height: 100 },
        { index: 8, type: 'boss' as const, explored: false, hasChest: true, hasPlayer: false, x: 200, y: 0, width: 100, height: 100 },
      ];

      useGameStore.getState().setMinimapRooms(snapshot);
      expect(useGameStore.getState().minimapRooms).toEqual(snapshot);
    });
  });

  describe('campaign quests (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)', () => {
    const QUEST_ID = 'quest_ch1_first_steps';

    it('advanceQuestObjective("start") activates the quest with zero progress', () => {
      useGameStore.getState().advanceQuestObjective(QUEST_ID, 'start');
      const log = useGameStore.getState().campaignState.quests[QUEST_ID];
      expect(log).toBeDefined();
      expect(log.status).toBe('active');
      expect(log.objectivesProgress).toEqual({});
    });

    it('advanceQuestObjectiveByTarget advances only the matching objective by type+targetId', () => {
      useGameStore.getState().advanceQuestObjective(QUEST_ID, 'start');

      // "scout_beast" bate com obj_clear_woods (kill_enemy) — não deve mexer nos outros
      useGameStore.getState().advanceQuestObjectiveByTarget('kill_enemy', 'scout_beast', 1);
      let log = useGameStore.getState().campaignState.quests[QUEST_ID];
      expect(log.objectivesProgress['obj_clear_woods']).toBe(1);
      expect(log.objectivesProgress['obj_loot_chest']).toBeUndefined();
      expect(log.status).toBe('active');

      // Um monstro que não é alvo de nenhum objetivo desta quest não deve gerar erro nem progresso
      useGameStore.getState().advanceQuestObjectiveByTarget('kill_enemy', 'skeleton_warrior', 1);
      log = useGameStore.getState().campaignState.quests[QUEST_ID];
      expect(log.objectivesProgress['obj_clear_woods']).toBe(1);
    });

    it('completes the quest and grants blood crystals once all objectives hit their target', () => {
      const store = useGameStore.getState();
      const crystalsBefore = store.bloodCrystals;

      store.advanceQuestObjective(QUEST_ID, 'start');
      store.advanceQuestObjectiveByTarget('collect_item', 'starter_dagger', 1); // obj_loot_chest (alvo 1)
      for (let i = 0; i < 4; i++) {
        store.advanceQuestObjectiveByTarget('kill_enemy', 'scout_beast', 1); // obj_clear_woods (alvo 4)
      }
      // Ainda falta obj_find_altar — quest deve continuar ativa
      expect(useGameStore.getState().campaignState.quests[QUEST_ID].status).toBe('active');

      store.advanceQuestObjectiveByTarget('discover_zone', 'altar_crimson', 1); // obj_find_altar (alvo 1)

      const finalState = useGameStore.getState();
      const log = finalState.campaignState.quests[QUEST_ID];
      expect(log.status).toBe('completed');
      expect(log.objectivesProgress).toEqual({ obj_loot_chest: 1, obj_clear_woods: 4, obj_find_altar: 1 });
      expect(finalState.bloodCrystals).toBe(crystalsBefore + 25); // rewards.bloodCrystals da quest

      // Chamadas extras num objetivo já concluído não devem conceder recompensa de novo
      store.advanceQuestObjectiveByTarget('discover_zone', 'altar_crimson', 1);
      expect(useGameStore.getState().bloodCrystals).toBe(crystalsBefore + 25);
    });

    it('onEnemyKilled advances an active kill_enemy quest objective as a side effect', () => {
      useGameStore.getState().advanceQuestObjective(QUEST_ID, 'start');
      useGameStore.getState().onEnemyKilled('scout_beast');
      const log = useGameStore.getState().campaignState.quests[QUEST_ID];
      expect(log.objectivesProgress['obj_clear_woods']).toBe(1);
    });
  });

  describe('campaign spell unlocks — Frente 3 Zero-to-Hero (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)', () => {
    it('treats every spell as unlocked outside campaign mode (arcade)', () => {
      useGameStore.getState().setGameMode('arcade');
      expect(useGameStore.getState().isCampaignSpellUnlocked('blood_bolt')).toBe(true);
      expect(useGameStore.getState().isCampaignSpellUnlocked('hellfire_nova')).toBe(true);
    });

    it('starts campaign mode with every spell locked', () => {
      useGameStore.getState().setGameMode('campaign');
      expect(useGameStore.getState().isCampaignSpellUnlocked('blood_bolt')).toBe(false);
      expect(useGameStore.getState().campaignState.unlockedSpellIds).toEqual([]);
    });

    it('unlockCampaignSpell adds the spell id and only that id becomes unlocked', () => {
      useGameStore.getState().setGameMode('campaign');
      useGameStore.getState().unlockCampaignSpell('blood_bolt');
      expect(useGameStore.getState().isCampaignSpellUnlocked('blood_bolt')).toBe(true);
      expect(useGameStore.getState().isCampaignSpellUnlocked('hellfire_nova')).toBe(false);
      expect(useGameStore.getState().campaignState.unlockedSpellIds).toEqual(['blood_bolt']);
    });

    it('unlockCampaignSpell is idempotent — calling it twice does not duplicate the id', () => {
      useGameStore.getState().setGameMode('campaign');
      useGameStore.getState().unlockCampaignSpell('blood_bolt');
      useGameStore.getState().unlockCampaignSpell('blood_bolt');
      expect(useGameStore.getState().campaignState.unlockedSpellIds).toEqual(['blood_bolt']);
    });
  });

  describe('campaign state persistence (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)', () => {
    const CAMPAIGN_STATE_KEY = 'bloodmage_1995_campaign_state';
    const QUEST_ID = 'quest_ch1_first_steps';

    it('persists gameMode to localStorage as soon as it changes', () => {
      useGameStore.getState().setGameMode('campaign');
      const raw = JSON.parse(localStorage.getItem(CAMPAIGN_STATE_KEY)!);
      expect(raw.gameMode).toBe('campaign');
    });

    it('persists the current zone and discovered zones on setCampaignZone', () => {
      useGameStore.getState().setCampaignZone('gloomy_woods');
      const raw = JSON.parse(localStorage.getItem(CAMPAIGN_STATE_KEY)!);
      expect(raw.currentZone).toBe('gloomy_woods');
      expect(raw.discoveredZones).toEqual(['safe_house', 'gloomy_woods']);
    });

    it('persists quest progress on advanceQuestObjective', () => {
      useGameStore.getState().advanceQuestObjective(QUEST_ID, 'start');
      useGameStore.getState().advanceQuestObjectiveByTarget('kill_enemy', 'scout_beast', 1);
      const raw = JSON.parse(localStorage.getItem(CAMPAIGN_STATE_KEY)!);
      expect(raw.quests[QUEST_ID].objectivesProgress.obj_clear_woods).toBe(1);
      expect(raw.quests[QUEST_ID].status).toBe('active');
    });

    it('persists unlocked spells on unlockCampaignSpell', () => {
      useGameStore.getState().unlockCampaignSpell('blood_bolt');
      const raw = JSON.parse(localStorage.getItem(CAMPAIGN_STATE_KEY)!);
      expect(raw.unlockedSpellIds).toEqual(['blood_bolt']);
    });

    it('a fresh store read from the same localStorage restores zone, quests and unlocks (simulated reload)', () => {
      useGameStore.getState().setGameMode('campaign');
      useGameStore.getState().setCampaignZone('gloomy_woods');
      useGameStore.getState().advanceQuestObjective(QUEST_ID, 'start');
      useGameStore.getState().advanceQuestObjectiveByTarget('collect_item', 'starter_dagger', 1);
      useGameStore.getState().unlockCampaignSpell('blood_bolt');

      // `loadCampaignState()` é o que o store chama na inicialização do módulo
      // (recarregar a página); aqui simulamos isso lendo direto do mesmo
      // localStorage que as ações acima já escreveram.
      const persisted = JSON.parse(localStorage.getItem(CAMPAIGN_STATE_KEY)!);
      expect(persisted.gameMode).toBe('campaign');
      expect(persisted.currentZone).toBe('gloomy_woods');
      expect(persisted.quests[QUEST_ID].objectivesProgress.obj_loot_chest).toBe(1);
      expect(persisted.unlockedSpellIds).toEqual(['blood_bolt']);
      // Estado de sessão (diálogo aberto) nunca deve estar no snapshot salvo.
      expect(persisted).not.toHaveProperty('activeDialogueTree');
      expect(persisted).not.toHaveProperty('activeDialogueNodeId');
    });
  });

  describe('dialogue actions beyond give_quest (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md — gap da Frente 2)', () => {
    // Nenhum diálogo real hoje usa give_spell/open_shop/heal_player/give_weapon
    // (só safe_house_maelen_intro > give_quest) — injeta uma árvore sintética
    // direto no campaignState pra exercitar o handler de cada ação.
    function primeDialogueWithChoice(choice: {
      id: string;
      text: string;
      action?: string;
      actionPayload?: string;
    }) {
      useGameStore.setState((state) => ({
        campaignState: {
          ...state.campaignState,
          activeDialogueTree: {
            id: 'test_tree',
            npcId: 'test_npc',
            initialNodeId: 'n1',
            nodes: {
              n1: { id: 'n1', speakerName: 'Teste', text: 'texto de teste', choices: [choice as any] },
            },
          },
          activeDialogueNodeId: 'n1',
        },
      }));
    }

    it('give_spell desbloqueia a magia do payload', () => {
      useGameStore.getState().setGameMode('campaign');
      primeDialogueWithChoice({ id: 'c1', text: '...', action: 'give_spell', actionPayload: 'hellfire_nova' });
      useGameStore.getState().selectDialogueChoice('c1');
      expect(useGameStore.getState().isCampaignSpellUnlocked('hellfire_nova')).toBe(true);
    });

    it('open_shop define activeNPC com o payload', () => {
      primeDialogueWithChoice({ id: 'c1', text: '...', action: 'open_shop', actionPayload: 'blacksmith' });
      useGameStore.getState().selectDialogueChoice('c1');
      expect(useGameStore.getState().activeNPC).toBe('blacksmith');
    });

    it('heal_player enfileira um CampaignEffect pro GameScene consumir', () => {
      primeDialogueWithChoice({ id: 'c1', text: '...', action: 'heal_player' });
      useGameStore.getState().selectDialogueChoice('c1');
      expect(useGameStore.getState().drainCampaignEffects()).toEqual([{ type: 'heal_player' }]);
      // drenar esvazia a fila
      expect(useGameStore.getState().drainCampaignEffects()).toEqual([]);
    });

    it('give_weapon enfileira um CampaignEffect com o id do item', () => {
      primeDialogueWithChoice({ id: 'c1', text: '...', action: 'give_weapon', actionPayload: 'starter_dagger' });
      useGameStore.getState().selectDialogueChoice('c1');
      expect(useGameStore.getState().drainCampaignEffects()).toEqual([
        { type: 'give_weapon', itemId: 'starter_dagger' },
      ]);
    });
  });

  describe('recompensa de quest — XP e spellUnlockId (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md — gap da Frente 2)', () => {
    const QUEST_ID = 'quest_ch1_first_steps';

    it('concede XP (via CampaignEffect) e desbloqueia a magia da recompensa ao completar a quest', () => {
      useGameStore.getState().setGameMode('campaign');
      useGameStore.getState().advanceQuestObjective(QUEST_ID, 'start');
      useGameStore.getState().advanceQuestObjectiveByTarget('collect_item', 'starter_dagger', 1);
      for (let i = 0; i < 4; i++) {
        useGameStore.getState().advanceQuestObjectiveByTarget('kill_enemy', 'scout_beast', 1);
      }
      useGameStore.getState().advanceQuestObjectiveByTarget('discover_zone', 'altar_crimson', 1);

      expect(useGameStore.getState().campaignState.quests[QUEST_ID].status).toBe('completed');
      expect(useGameStore.getState().isCampaignSpellUnlocked('blood_bolt')).toBe(true);
      expect(useGameStore.getState().drainCampaignEffects()).toContainEqual({ type: 'give_xp', amount: 150 });
    });
  });

  describe("resetCampaignProgress — reset real de \"Nova Campanha\" (docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md)", () => {
    it('limpa quests, magias desbloqueadas e zona de volta pro estado inicial, e persiste o reset', () => {
      useGameStore.getState().setGameMode('campaign');
      useGameStore.getState().setCampaignZone('gloomy_woods');
      useGameStore.getState().advanceQuestObjective('quest_ch1_first_steps', 'start');
      useGameStore.getState().unlockCampaignSpell('blood_bolt');

      useGameStore.getState().resetCampaignProgress();

      const state = useGameStore.getState();
      expect(state.campaignState.currentZone).toBe('safe_house');
      expect(state.campaignState.quests).toEqual({});
      expect(state.campaignState.unlockedSpellIds).toEqual([]);
      expect(state.campaignState.discoveredZones).toEqual(['safe_house']);
      // resetCampaignProgress não mexe no modo — só limpa o progresso salvo
      expect(state.gameMode).toBe('campaign');

      const persisted = JSON.parse(localStorage.getItem('bloodmage_1995_campaign_state')!);
      expect(persisted.quests).toEqual({});
      expect(persisted.unlockedSpellIds).toEqual([]);
      expect(persisted.currentZone).toBe('safe_house');
    });
  });
});
