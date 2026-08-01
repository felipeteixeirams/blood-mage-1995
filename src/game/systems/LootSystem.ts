import { LootItem, ItemRarity, ItemType } from '../../types/game';

const COMMON_NAMES = ['Anel Enferrujado', 'Colete de Couro', 'Adaga Cega', 'Amuleto de Ferro'];
const RARE_NAMES = ['Amuleto de Sangue', 'Espada de Aço', 'Manto Vampírico', 'Anel Carmesim'];
const EPIC_NAMES = ['Coroa do Abismo', 'Coração de Mago', 'Ceifador de Almas', 'Armadura Abissal'];
const LEGENDARY_NAMES = [
  'Ceifadora de Bloodmoon',
  'Couraça de Arconte',
  'Cetro do Senhor das Sombras',
  'Lâmina Bebedora de Almas',
  'Bastião Demoníaco',
  'Mordida de Espectro',
  'Gravebane',
  'Anel do Apocalipse'
];

export class LootSystem {
  public static rollLootChance(): boolean {
    // 20% chance to drop loot
    return Math.random() < 0.2;
  }

  public static generateLoot(floorDepth: number): LootItem {
    const roll = Math.random();
    let rarity: ItemRarity = 'common';
    let nameList = COMMON_NAMES;

    if (roll > 0.98) {
      rarity = 'legendary';
      nameList = LEGENDARY_NAMES;
    } else if (roll > 0.90) {
      rarity = 'epic';
      nameList = EPIC_NAMES;
    } else if (roll > 0.70) {
      rarity = 'rare';
      nameList = RARE_NAMES;
    }

    return LootSystem.createItemOfRarity(rarity, nameList, floorDepth);
  }

  public static generateBossChestLoot(floorDepth: number): LootItem {
    // Boss chest always drops EPIC or LEGENDARY
    const roll = Math.random();
    let rarity: ItemRarity = 'epic';
    let nameList = EPIC_NAMES;

    if (roll > 0.60) {
      rarity = 'legendary';
      nameList = LEGENDARY_NAMES;
    }

    return LootSystem.createItemOfRarity(rarity, nameList, floorDepth);
  }

  private static createItemOfRarity(rarity: ItemRarity, nameList: string[], floorDepth: number): LootItem {
    const typeRoll = Math.random();
    let type: ItemType = 'relic';
    if (typeRoll < 0.33) type = 'weapon';
    else if (typeRoll < 0.66) type = 'armor';

    const name = nameList[Math.floor(Math.random() * nameList.length)];
    const id = `loot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const stats: any = {};
    const multiplier = rarity === 'legendary' ? 4.5 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1;
    const scaling = 1 + floorDepth * 0.1; // Scales slightly with depth

    if (type === 'weapon') {
      stats.damageMultiplier = 0.1 * multiplier * scaling;
      if (rarity === 'epic' || rarity === 'legendary') {
        stats.lifestealBonus = 0.05 * (rarity === 'legendary' ? 1.5 : 1.0);
      }
    } else if (type === 'armor') {
      stats.maxHpBonus = 20 * multiplier * scaling;
    } else if (type === 'relic') {
      stats.speedBonus = 5 * multiplier * scaling;
      stats.maxHpBonus = 10 * multiplier * scaling;
    }

    return {
      id,
      name,
      type,
      rarity,
      stats
    };
  }
}
