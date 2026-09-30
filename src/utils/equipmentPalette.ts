import { EquipmentSlots, ItemRarity } from '../types/game';

/**
 * Frente 7 (spec 11, 27/08) — Palette Swap procedural de equipamentos.
 *
 * Mesma paleta de cor por raridade já usada pro glow de itens no chão
 * (`LightingPolish.ts` — `addItemGlow`'s `glowConfigs`), reaproveitada aqui
 * pro tint do próprio personagem: cria uma associação visual consistente
 * ("aquele brilho roxo no chão é a mesma cor que meu personagem fica quando
 * equipo algo épico"), em vez de inventar uma paleta nova do zero.
 *
 * `common` propositalmente NÃO tinge nada (retorna `null`) — mesmo corte que
 * `LightingPolish` usa pro glow ("só rare+"), pra manter o personagem neutro
 * (ou na paleta cosmética escolhida manualmente em Configurações) enquanto
 * ele não estiver com equipamento notável.
 */
const RARITY_TINT: Partial<Record<ItemRarity, number>> = {
  rare: 0x3b82f6,
  epic: 0xa855f7,
  legendary: 0xf59e0b,
};

const RARITY_RANK: Record<ItemRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/**
 * Deriva o tint do personagem a partir da MAIOR raridade entre arma e
 * armadura equipadas. Relíquias ficam de fora de propósito — não são
 * renderizadas "vestidas" no sprite do jogador, então não faz sentido
 * tingi-lo por causa delas.
 */
export function getEquipmentRarityTint(equipment: EquipmentSlots | null | undefined): number | null {
  if (!equipment) return null;

  let best: ItemRarity | null = null;
  [equipment.weapon, equipment.armor].forEach((item) => {
    if (!item) return;
    if (!best || RARITY_RANK[item.rarity] > RARITY_RANK[best]) {
      best = item.rarity;
    }
  });

  if (!best || best === 'common') return null;
  return RARITY_TINT[best] ?? null;
}

/**
 * Emissor de partículas afixado (faíscas) — só para equipamento LENDÁRIO,
 * critério de "chamativo o bastante" consistente com `LightingPolish`'s
 * `addMonsterGlow` só acender em monstros de tier alto (`intensity >= 0.7`).
 * Rare/epic ficam só com o tint, sem partícula, pra não poluir a tela com
 * emissores toda vez que o jogador troca de equipamento intermediário.
 */
export function shouldEmitLegendarySparks(equipment: EquipmentSlots | null | undefined): boolean {
  if (!equipment) return false;
  return equipment.weapon?.rarity === 'legendary' || equipment.armor?.rarity === 'legendary';
}
