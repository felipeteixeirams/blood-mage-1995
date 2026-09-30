import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import relicsData from '../../data/relics.json';
import { RelicItem } from '../../types/game';

vi.mock('../../utils/soundEngine', () => ({
  soundEngine: {
    setVolumes: vi.fn(),
    toggleMute: vi.fn(() => true),
    playEquipLoot: vi.fn(),
  },
}));

describe('RelicSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({
      bloodCrystals: 0,
      unlockedRelics: ['selo_hemorragico', 'olho_de_carmim', 'anel_do_pacto_sanguineo'],
      equipment: { weapon: null, armor: null, relics: [] },
    });
  });

  it('contains 8 relics in the catalog', () => {
    const catalog = relicsData as RelicItem[];
    expect(catalog).toHaveLength(8);
  });

  it('catalog relics have valid structure and effects', () => {
    const catalog = relicsData as RelicItem[];
    catalog.forEach((relic) => {
      expect(relic.id).toBeDefined();
      expect(relic.name).toBeDefined();
      expect(relic.type).toBe('relic');
      expect(['common', 'rare', 'epic', 'legendary']).toContain(relic.rarity);
      expect(relic.description).toBeDefined();
      expect(relic.effect).toBeDefined();
    });
  });

  it('can equip up to 3 relics and calculate combined modifiers correctly', () => {
    const store = useGameStore.getState();
    store.equipRelicById('selo_hemorragico');
    store.equipRelicById('olho_de_carmim');
    store.equipRelicById('coracao_abissal');

    const mods = useGameStore.getState().getRelicModifiers();

    // selo_hemorragico: bleedChance 0.30, damageMultiplier +0.10
    // olho_de_carmim: speedBonus +20, lifestealBonus +0.05
    // coracao_abissal: maxHpBonus +40, cooldownReductionBonus +0.15
    expect(mods.bleedChanceOnHit).toBe(0.30);
    expect(mods.damageMultiplier).toBe(0.10);
    expect(mods.speedBonus).toBe(20);
    expect(mods.lifestealBonus).toBe(0.05);
    expect(mods.maxHpBonus).toBe(40);
    expect(mods.cooldownReductionBonus).toBe(0.15);
  });

  it('replaces oldest relic when equipping a 4th relic', () => {
    const store = useGameStore.getState();
    store.equipRelicById('selo_hemorragico');
    store.equipRelicById('olho_de_carmim');
    store.equipRelicById('coracao_abissal');
    expect(useGameStore.getState().equipment.relics).toHaveLength(3);

    store.equipRelicById('calice_amaldicoado');
    const relics = useGameStore.getState().equipment.relics as RelicItem[];
    expect(relics).toHaveLength(3);
    expect(relics.some((r) => r.id === 'calice_amaldicoado')).toBe(true);
    expect(relics.some((r) => r.id === 'selo_hemorragico')).toBe(false);
  });

  it('unequipRelicById removes specified relic', () => {
    const store = useGameStore.getState();
    store.equipRelicById('selo_hemorragico');
    store.equipRelicById('olho_de_carmim');

    store.unequipRelicById('selo_hemorragico');
    const relics = useGameStore.getState().equipment.relics as RelicItem[];
    expect(relics).toHaveLength(1);
    expect(relics[0].id).toBe('olho_de_carmim');
  });

  it('unlocks new relics and stores them in state', () => {
    const store = useGameStore.getState();
    expect(store.unlockedRelics).not.toContain('fragmento_abissal');

    store.unlockRelic('fragmento_abissal');
    expect(useGameStore.getState().unlockedRelics).toContain('fragmento_abissal');
  });
});
