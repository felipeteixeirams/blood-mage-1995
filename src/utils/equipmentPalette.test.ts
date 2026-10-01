import { describe, it, expect } from 'vitest';
import { getEquipmentRarityTint, shouldEmitLegendarySparks } from './equipmentPalette';
import { EquipmentSlots, LootItem } from '../types/game';

function makeItem(partial: Partial<LootItem>): LootItem {
  return {
    id: 'test_item',
    name: 'Teste',
    type: 'weapon',
    rarity: 'common',
    stats: {},
    ...partial,
  };
}

function makeEquipment(partial: Partial<EquipmentSlots>): EquipmentSlots {
  return { weapon: null, armor: null, relics: [], ...partial };
}

describe('equipmentPalette (spec 11, Frente 7 — Palette Swap procedural, 27/08)', () => {
  describe('getEquipmentRarityTint', () => {
    it('retorna null sem equipamento algum', () => {
      expect(getEquipmentRarityTint(makeEquipment({}))).toBeNull();
      expect(getEquipmentRarityTint(null)).toBeNull();
      expect(getEquipmentRarityTint(undefined)).toBeNull();
    });

    it('retorna null quando só há equipamento common (personagem fica neutro)', () => {
      const equipment = makeEquipment({
        weapon: makeItem({ type: 'weapon', rarity: 'common' }),
        armor: makeItem({ type: 'armor', rarity: 'common' }),
      });
      expect(getEquipmentRarityTint(equipment)).toBeNull();
    });

    it('deriva a cor da raridade rare/epic/legendary — mesma paleta do glow de itens no chão', () => {
      expect(getEquipmentRarityTint(makeEquipment({ weapon: makeItem({ rarity: 'rare' }) }))).toBe(0x3b82f6);
      expect(getEquipmentRarityTint(makeEquipment({ armor: makeItem({ rarity: 'epic' }) }))).toBe(0xa855f7);
      expect(getEquipmentRarityTint(makeEquipment({ weapon: makeItem({ rarity: 'legendary' }) }))).toBe(0xf59e0b);
    });

    it('usa a MAIOR raridade entre arma e armadura quando ambas equipadas', () => {
      const equipment = makeEquipment({
        weapon: makeItem({ type: 'weapon', rarity: 'rare' }),
        armor: makeItem({ type: 'armor', rarity: 'legendary' }),
      });
      expect(getEquipmentRarityTint(equipment)).toBe(0xf59e0b);
    });

    it('ignora relíquias — elas não são renderizadas "vestidas" no sprite', () => {
      const equipment = makeEquipment({
        weapon: makeItem({ type: 'weapon', rarity: 'common' }),
        relics: [makeItem({ type: 'relic', rarity: 'legendary' }) as any],
      });
      expect(getEquipmentRarityTint(equipment)).toBeNull();
    });
  });

  describe('shouldEmitLegendarySparks', () => {
    it('false sem equipamento lendário', () => {
      const equipment = makeEquipment({
        weapon: makeItem({ type: 'weapon', rarity: 'epic' }),
        armor: makeItem({ type: 'armor', rarity: 'rare' }),
      });
      expect(shouldEmitLegendarySparks(equipment)).toBe(false);
      expect(shouldEmitLegendarySparks(null)).toBe(false);
    });

    it('true quando arma OU armadura é lendária', () => {
      expect(shouldEmitLegendarySparks(makeEquipment({ weapon: makeItem({ rarity: 'legendary' }) }))).toBe(true);
      expect(shouldEmitLegendarySparks(makeEquipment({ armor: makeItem({ rarity: 'legendary' }) }))).toBe(true);
    });

    it('ignora relíquia lendária (mesmo motivo do tint — não é renderizada no sprite)', () => {
      const equipment = makeEquipment({
        relics: [makeItem({ type: 'relic', rarity: 'legendary' }) as any],
      });
      expect(shouldEmitLegendarySparks(equipment)).toBe(false);
    });
  });
});
