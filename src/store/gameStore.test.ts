import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';
import { LootItem } from '../types/game';

vi.mock('../utils/soundEngine', () => ({
  soundEngine: {
    setVolumes: vi.fn(),
    toggleMute: vi.fn(() => true),
    playEquipLoot: vi.fn(),
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
});
