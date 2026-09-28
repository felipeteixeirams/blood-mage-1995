import { EquipmentSlots, EquipmentSetDef, RelicEffect, LootItem, RelicItem } from '../../types/game';

/**
 * Spec 34 — Sistema de Bônus de Conjunto (Equipment Sets).
 *
 * Função pura, sem dependência de Zustand/React — testável isoladamente.
 * Consumida por `getRelicModifiers()` em `src/store/gameStore.ts`, que soma
 * o resultado a `combined` (relíquias individuais) antes do `return`.
 *
 * Nota sobre `bloodCrystalMultiplier`: diferente de `getRelicModifiers()`
 * (onde o valor neutro é 1.0 e relíquias se combinam por multiplicação),
 * aqui o campo é tratado como um DELTA aditivo (0 = nenhum bônus de set).
 * Isso é necessário para que o objeto retornado possa ser somado campo a
 * campo com segurança em qualquer lugar que o consuma — um valor neutro de
 * 1.0 somado via `+=` inflaria o multiplicador mesmo sem nenhum set ativo.
 * Nenhum dos 2 conjuntos padrão (`src/data/equipmentSets.json`) usa esse
 * campo hoje; se um futuro conjunto vier a usá-lo, o chamador deve compor
 * esse delta multiplicativamente (`combined.bloodCrystalMultiplier *= 1 +
 * delta`), nunca somando diretamente ao multiplicador combinado.
 */

const NEUTRAL_SET_BONUS: RelicEffect = {
  damageMultiplier: 0,
  maxHpBonus: 0,
  speedBonus: 0,
  lifestealBonus: 0,
  cooldownReductionBonus: 0,
  hpRegenBonus: 0,
  bloodCrystalMultiplier: 0,
  bleedChanceOnHit: 0,
  bleedDamagePerSecond: 0,
  spellCostDiscount: 0,
};

function addEffectInto(target: RelicEffect, source?: Partial<RelicEffect>): void {
  if (!source) return;
  (Object.keys(source) as (keyof RelicEffect)[]).forEach((key) => {
    const value = source[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      target[key] = (target[key] ?? 0) + value;
    }
  });
}

/**
 * Calcula o bônus de conjunto combinado para o equipamento atual.
 *
 * Regras:
 * - Só itens com `setId` definido contam para qualquer set.
 * - Para cada set, conta-se quantos `itemIds` DISTINTOS do set estão
 *   equipados (via `Set<string>`, sem contar duplicata).
 * - count >= 2 aplica `bonuses[2]`; count >= 3 aplica `bonuses[3]` NO LUGAR
 *   de `bonuses[2]` (patamar maior substitui o menor do mesmo set, nunca
 *   soma os dois). Se o set não tiver `bonuses[3]` definido, um count >= 3
 *   continua aplicando apenas `bonuses[2]`.
 * - Bônus de sets DIFERENTES ativos simultaneamente são somados.
 * - Dado inconsistente (setId de item não corresponde a nenhum set
 *   conhecido) não quebra e simplesmente não conta bônus (fail-safe).
 */
export function calculateSetBonuses(
  equipment: EquipmentSlots,
  sets: EquipmentSetDef[]
): RelicEffect {
  const combined: RelicEffect = { ...NEUTRAL_SET_BONUS };

  const equippedItems: (LootItem | RelicItem)[] = [
    ...(equipment.weapon ? [equipment.weapon] : []),
    ...(equipment.armor ? [equipment.armor] : []),
    ...(equipment.relics || []),
  ];

  // Ids de itens equipados que declaram participar de algum conjunto.
  const equippedSetItemIds = new Set(
    equippedItems
      .filter((item) => Boolean(item && (item as LootItem | RelicItem).setId))
      .map((item) => item.id)
  );

  for (const setDef of sets || []) {
    if (!setDef || !Array.isArray(setDef.itemIds)) continue;

    const matchedIds = new Set(
      setDef.itemIds.filter((itemId) => equippedSetItemIds.has(itemId))
    );
    const count = matchedIds.size;

    let tierBonus: Partial<RelicEffect> | undefined;
    if (count >= 3 && setDef.bonuses?.[3]) {
      tierBonus = setDef.bonuses[3];
    } else if (count >= 2 && setDef.bonuses?.[2]) {
      tierBonus = setDef.bonuses[2];
    }

    if (tierBonus) addEffectInto(combined, tierBonus);
  }

  return combined;
}
