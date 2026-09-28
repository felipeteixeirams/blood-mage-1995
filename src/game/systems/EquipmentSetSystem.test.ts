import { describe, it, expect } from 'vitest';
import { calculateSetBonuses } from './EquipmentSetSystem';
import { EquipmentSlots, EquipmentSetDef, RelicItem } from '../../types/game';

const relic = (id: string, setId?: string): RelicItem => ({
  id,
  name: id,
  type: 'relic',
  rarity: 'common',
  description: '',
  effect: {},
  setId,
});

const emptyEquipment = (): EquipmentSlots => ({
  weapon: null,
  armor: null,
  relics: [],
});

const conjuntoSangue: EquipmentSetDef = {
  id: 'conjunto_sangue',
  name: 'Conjunto Sangue',
  itemIds: ['selo_hemorragico', 'olho_de_carmim'],
  bonuses: {
    2: { lifestealBonus: 0.05, damageMultiplier: 0.05 },
  },
};

const conjuntoAbissal: EquipmentSetDef = {
  id: 'conjunto_abissal',
  name: 'Conjunto Abissal',
  itemIds: ['coracao_abissal', 'amuleto_do_martir', 'calice_amaldicoado'],
  bonuses: {
    2: { cooldownReductionBonus: 0.05 },
    3: { cooldownReductionBonus: 0.12, maxHpBonus: 20 },
  },
};

const allSets = [conjuntoSangue, conjuntoAbissal];

describe('calculateSetBonuses', () => {
  it('retorna todos os campos neutros/zerados quando nenhuma peça de set está equipada', () => {
    const equipment = emptyEquipment();
    const result = calculateSetBonuses(equipment, allSets);

    expect(result.damageMultiplier).toBe(0);
    expect(result.maxHpBonus).toBe(0);
    expect(result.lifestealBonus).toBe(0);
    expect(result.cooldownReductionBonus).toBe(0);
    expect(result.bloodCrystalMultiplier).toBe(0);
  });

  it('nenhum bônus quando exatamente 1 peça de um set de 2 está equipada', () => {
    const equipment: EquipmentSlots = {
      ...emptyEquipment(),
      relics: [relic('selo_hemorragico', 'conjunto_sangue')],
    };
    const result = calculateSetBonuses(equipment, allSets);

    expect(result.damageMultiplier).toBe(0);
    expect(result.lifestealBonus).toBe(0);
  });

  it('aplica o bônus de patamar 2 quando 2 peças do mesmo set estão equipadas', () => {
    const equipment: EquipmentSlots = {
      ...emptyEquipment(),
      relics: [
        relic('selo_hemorragico', 'conjunto_sangue'),
        relic('olho_de_carmim', 'conjunto_sangue'),
      ],
    };
    const result = calculateSetBonuses(equipment, allSets);

    expect(result.lifestealBonus).toBeCloseTo(0.05);
    expect(result.damageMultiplier).toBeCloseTo(0.05);
  });

  it('não conta peça duplicada equipada duas vezes (Set<string>, sem duplicata)', () => {
    const equipment: EquipmentSlots = {
      ...emptyEquipment(),
      relics: [
        relic('selo_hemorragico', 'conjunto_sangue'),
        relic('selo_hemorragico', 'conjunto_sangue'),
      ],
    };
    const result = calculateSetBonuses(equipment, allSets);

    // Mesmo item repetido conta como 1 peça distinta -> não atinge patamar 2
    expect(result.damageMultiplier).toBe(0);
    expect(result.lifestealBonus).toBe(0);
  });

  it('aplica o bônus de patamar 3 EM VEZ DE somar ao patamar 2, quando 3 peças estão equipadas', () => {
    const equipment: EquipmentSlots = {
      ...emptyEquipment(),
      relics: [
        relic('coracao_abissal', 'conjunto_abissal'),
        relic('amuleto_do_martir', 'conjunto_abissal'),
        relic('calice_amaldicoado', 'conjunto_abissal'),
      ],
    };
    const result = calculateSetBonuses(equipment, allSets);

    expect(result.cooldownReductionBonus).toBeCloseTo(0.12);
    expect(result.maxHpBonus).toBe(20);
  });

  it('aplica apenas o patamar 2 quando 2 das 3 peças do conjunto de patamar 3 estão equipadas', () => {
    const equipment: EquipmentSlots = {
      ...emptyEquipment(),
      relics: [
        relic('coracao_abissal', 'conjunto_abissal'),
        relic('amuleto_do_martir', 'conjunto_abissal'),
      ],
    };
    const result = calculateSetBonuses(equipment, allSets);

    expect(result.cooldownReductionBonus).toBeCloseTo(0.05);
    expect(result.maxHpBonus).toBe(0);
  });

  it('soma os bônus de 2 sets diferentes ativos simultaneamente', () => {
    const equipment: EquipmentSlots = {
      weapon: null,
      armor: null,
      relics: [
        relic('selo_hemorragico', 'conjunto_sangue'),
        relic('olho_de_carmim', 'conjunto_sangue'),
      ],
    };
    // weapon/armor também contam como equipamento equipável do set
    equipment.weapon = { ...relic('coracao_abissal', 'conjunto_abissal'), type: 'weapon', stats: {} } as any;
    equipment.armor = { ...relic('amuleto_do_martir', 'conjunto_abissal'), type: 'armor', stats: {} } as any;

    const result = calculateSetBonuses(equipment, allSets);

    // Conjunto Sangue (2/2): +5% lifesteal, +5% dano
    expect(result.lifestealBonus).toBeCloseTo(0.05);
    expect(result.damageMultiplier).toBeCloseTo(0.05);
    // Conjunto Abissal (2/3): +5% CDR
    expect(result.cooldownReductionBonus).toBeCloseTo(0.05);
  });

  it('não quebra e não conta bônus para item com setId que não corresponde a nenhum set (dado inconsistente)', () => {
    const equipment: EquipmentSlots = {
      ...emptyEquipment(),
      relics: [
        relic('item_orfao', 'set_que_nao_existe'),
        relic('outro_item_orfao', 'set_que_nao_existe'),
      ],
    };

    expect(() => calculateSetBonuses(equipment, allSets)).not.toThrow();
    const result = calculateSetBonuses(equipment, allSets);
    expect(result.damageMultiplier).toBe(0);
    expect(result.lifestealBonus).toBe(0);
    expect(result.cooldownReductionBonus).toBe(0);
    expect(result.maxHpBonus).toBe(0);
  });

  it('lida com lista de sets vazia ou equipment sem relics sem lançar exceção', () => {
    expect(() => calculateSetBonuses(emptyEquipment(), [])).not.toThrow();
    const result = calculateSetBonuses(emptyEquipment(), []);
    expect(result.damageMultiplier).toBe(0);
  });
});
