import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock SoundEngine to avoid Web Audio API issues in Node
vi.mock('../../utils/soundEngine', () => ({
  soundEngine: {
    playButtonClick: vi.fn(),
    playEquipLoot: vi.fn(),
    setVolumes: vi.fn(),
    toggleMute: vi.fn(() => true),
  }
}));

import { useGameStore } from '../gameStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    clear: () => { store = {}; }
  };
})();
global.localStorage = localStorageMock as unknown as Storage;

describe('Zustand gameStore unit tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset Zustand store state to default before each test
    useGameStore.setState({
      gameState: 'menu',
      bloodCrystals: 0,
      isMuted: false,
      isTalentsOpen: false,
      isInventoryOpen: false,
      activeModifiers: [],
      recentLootLog: [],
      playerStats: {
        hp: 100, maxHp: 100,
        mana: 100, maxMana: 100,
        level: 1, currentXp: 0, nextLevelXp: 50,
        moveSpeed: 160, damageMultiplier: 1.0, cooldownReduction: 0,
        vampirism: 0, projectileBonus: 0,
        kills: 0, souls: 0, wave: 1, floorDepth: 1, score: 0, timeSurvivedSeconds: 0,
        unlockedSpells: ['blood_bolt'],
        pendingStatPoints: 0,
        knockoutCount: 0,
        isUnconscious: false,
        isDefinitivelyDead: false,
        statusConditions: { bleeding: false, poison: false, infection: false },
        curatives: { bandages: 1, antidotes: 1, antibiotics: 0 },
        droppedCorpse: { hasDroppedCorpse: false, zone: '', x: 0, y: 0, droppedTimestamp: 0, itemsInside: [] }
      }
    });
  });

  it('should have correct initial state values', () => {
    const state = useGameStore.getState();
    expect(state.gameState).toBe('menu');
    expect(state.bloodCrystals).toBe(0);
    expect(state.isTalentsOpen).toBe(false);
  });

  it('should correctly set gameState', () => {
    useGameStore.getState().setGameState('playing');
    expect(useGameStore.getState().gameState).toBe('playing');
  });

  it('should correctly add and purchase blood crystals', () => {
    useGameStore.getState().addBloodCrystals(200);
    expect(useGameStore.getState().bloodCrystals).toBe(200);

    // Upgrade talent costing 150
    const upgraded = useGameStore.getState().upgradeTalent('hemomancy_power', 150);
    expect(upgraded).toBe(true);
    expect(useGameStore.getState().bloodCrystals).toBe(50);
    expect(useGameStore.getState().talentLevels.hemomancy_power).toBe(1);
  });

  it('should block talent upgrades if blood crystals are insufficient', () => {
    const upgraded = useGameStore.getState().upgradeTalent('hemomancy_power', 100);
    expect(upgraded).toBe(false);
    expect(useGameStore.getState().bloodCrystals).toBe(0);
  });

  it('should toggle challenge modifiers correctly', () => {
    useGameStore.getState().toggleModifier('rune_famine');
    expect(useGameStore.getState().activeModifiers).toContain('rune_famine');

    useGameStore.getState().toggleModifier('rune_famine');
    expect(useGameStore.getState().activeModifiers).not.toContain('rune_famine');
  });

  it('should update playerStats and manage status conditions', () => {
    // Set infection condition
    useGameStore.getState().setStatusCondition('infection', true);
    expect(useGameStore.getState().playerStats.statusConditions.infection).toBe(true);

    // Set bleeding condition
    useGameStore.getState().setStatusCondition('bleeding', true);
    expect(useGameStore.getState().playerStats.statusConditions.bleeding).toBe(true);
  });

  it('should apply curatives and resolve status conditions', () => {
    // Setup bleeding and bandages
    useGameStore.setState((state) => ({
      playerStats: {
        ...state.playerStats,
        statusConditions: { ...state.playerStats.statusConditions, bleeding: true },
        curatives: { bandages: 1, antidotes: 0, antibiotics: 0 }
      }
    }));

    expect(useGameStore.getState().playerStats.statusConditions.bleeding).toBe(true);

    // Use bandages curative
    const used = useGameStore.getState().useCurative('bandages');
    expect(used).toBe(true);
    expect(useGameStore.getState().playerStats.statusConditions.bleeding).toBe(false);
    expect(useGameStore.getState().playerStats.curatives.bandages).toBe(0);
  });

  it('should fail to use curative if player does not have it', () => {
    useGameStore.setState((state) => ({
      playerStats: {
        ...state.playerStats,
        statusConditions: { ...state.playerStats.statusConditions, poison: true },
        curatives: { bandages: 0, antidotes: 0, antibiotics: 0 }
      }
    }));

    const used = useGameStore.getState().useCurative('antidotes');
    expect(used).toBe(false);
    expect(useGameStore.getState().playerStats.statusConditions.poison).toBe(true);
  });
});
