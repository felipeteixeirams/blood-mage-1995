import { LootItem, ItemRarity, ItemType } from '../../types/game';
import { telemetry } from '../../utils/telemetry';

const COMMON_NAMES: Record<ItemType, string[]> = {
  weapon: ['Adaga Enferrujada', 'Lâmina de Cobre', 'Glaive Rachada'],
  armor: ['Traje de Couro Surrado', 'Manta de Pano Escuro', 'Cota de Ferro Leve'],
  relic: ['Anel de Pedra Sangrenta', 'Amuleto de Osso Pequeno', 'Selo de Bronze Tarnado'],
};

const RARE_NAMES: Record<ItemType, string[]> = {
  weapon: ['Espada do Necromante', 'Foice Vampírica', 'Espada Larga do Mártir'],
  armor: ['Manto de Seda Macabra', 'Armadura Plateada de Sangue', 'Garbos do Vampiro'],
  relic: ['Amuleto de Sangue Concentrado', 'Anel de Rubi Abissal', 'Fragmento de Alma Pulsante'],
};

const EPIC_NAMES: Record<ItemType, string[]> = {
  weapon: ['Devoradora de Almas', 'Foice Sacrificial de Carmim', 'Corta-Veias da Escuridão'],
  armor: ['Coraça do Senhor Abissal', 'Manto do Mártir Supremo', 'Vestes do Hemomante'],
  relic: ['Coração do Hemomante', 'Coroa do Abismo Sombrio', 'Relíquia da Morte Eterna'],
};

const LEGENDARY_NAMES: Record<ItemType, string[]> = {
  weapon: ['A Morte Carmim (Lendária)', 'Lâmina Primordial de Bloodmage', 'Ceifadora de Almas de Vlad'],
  armor: ['Marmota de Sangue de Dragão', 'Armadura Imortal dos Sacrificados', 'Garbos de Sanguis Rex'],
  relic: ['Orb da Imortalidade Sanguínea', 'Relíquia do Caos Abissal', 'Coração Pulsante do Dragão'],
};

export class LootSystem {
  public static rollLootChance(): boolean {
    // 25% chance to drop loot on monster kill
    return Math.random() < 0.25;
  }

  public static generateLoot(floorDepth: number, isChest: boolean = false): LootItem {
    const roll = Math.random();
    let rarity: ItemRarity = 'common';

    if (isChest) {
      if (roll > 0.85) rarity = 'legendary';
      else if (roll > 0.45) rarity = 'epic';
      else rarity = 'rare';
    } else {
      if (roll > 0.96) rarity = 'legendary';
      else if (roll > 0.82) rarity = 'epic';
      else if (roll > 0.55) rarity = 'rare';
    }

    const typeRoll = Math.random();
    let type: ItemType = 'relic';
    if (typeRoll < 0.35) type = 'weapon';
    else if (typeRoll < 0.70) type = 'armor';

    let nameList = COMMON_NAMES[type];
    if (rarity === 'legendary') nameList = LEGENDARY_NAMES[type];
    else if (rarity === 'epic') nameList = EPIC_NAMES[type];
    else if (rarity === 'rare') nameList = RARE_NAMES[type];

    const name = nameList[Math.floor(Math.random() * nameList.length)];
    const id = `loot_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const mult = rarity === 'legendary' ? 4 : rarity === 'epic' ? 2.5 : rarity === 'rare' ? 1.6 : 1.0;
    const scaling = 1 + (floorDepth - 1) * 0.12;

    const stats: any = {};
    let description = '';

    if (type === 'weapon') {
      stats.damageMultiplier = parseFloat((0.08 * mult * scaling).toFixed(2));
      stats.critChanceBonus = parseFloat((0.03 * mult).toFixed(2));
      if (rarity === 'legendary' || rarity === 'epic') {
        stats.lifestealBonus = parseFloat((0.02 * mult).toFixed(2));
      }
      description = `Aumenta o Dano em +${Math.round((stats.damageMultiplier || 0) * 100)}% e Crítico em +${Math.round((stats.critChanceBonus || 0) * 100)}%.`;
    } else if (type === 'armor') {
      stats.maxHpBonus = Math.round(15 * mult * scaling);
      stats.hpRegenBonus = parseFloat((0.2 * mult).toFixed(1));
      description = `Concede +${stats.maxHpBonus} HP Máximo e +${stats.hpRegenBonus} HP/s de regeneração.`;
    } else if (type === 'relic') {
      stats.speedBonus = Math.round(4 * mult * scaling);
      stats.cooldownReductionBonus = parseFloat((0.02 * mult).toFixed(2));
      stats.maxHpBonus = Math.round(10 * mult * scaling);
      description = `Aumenta Velocidade, reduz Cooldowns em -${Math.round((stats.cooldownReductionBonus || 0) * 100)}% e +${stats.maxHpBonus} HP.`;
    }

    telemetry.trackEvent('loot_generated', { name, type, rarity, isChest });

    return {
      id,
      name,
      type,
      rarity,
      description,
      stats
    };
  }
}

