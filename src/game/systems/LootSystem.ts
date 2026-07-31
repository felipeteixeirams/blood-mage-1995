import { LootItem, ItemRarity, ItemType } from '../../types/game';

const COMMON_NAMES = ['Rusted Ring', 'Leather Vest', 'Dull Dagger', 'Iron Charm'];
const RARE_NAMES = ['Bloodstone Amulet', 'Steel Broadsword', 'Vampiric Cloak', 'Crimson Ring'];
const EPIC_NAMES = ['Crown of the Abyss', 'Heart of the Bloodmage', 'Soul Reaver', 'Abyssal Armor'];

export class LootSystem {
  public static rollLootChance(): boolean {
    // 20% chance to drop loot
    return Math.random() < 0.2;
  }

  public static generateLoot(floorDepth: number): LootItem {
    const roll = Math.random();
    let rarity: ItemRarity = 'common';
    let nameList = COMMON_NAMES;

    if (roll > 0.95) {
      rarity = 'epic';
      nameList = EPIC_NAMES;
    } else if (roll > 0.7) {
      rarity = 'rare';
      nameList = RARE_NAMES;
    }

    const typeRoll = Math.random();
    let type: ItemType = 'relic';
    if (typeRoll < 0.33) type = 'weapon';
    else if (typeRoll < 0.66) type = 'armor';

    const name = nameList[Math.floor(Math.random() * nameList.length)];
    const id = `loot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const stats: any = {};
    const multiplier = rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1;
    const scaling = 1 + floorDepth * 0.1; // Scales slightly with depth

    if (type === 'weapon') {
      stats.damageMultiplier = 0.1 * multiplier * scaling;
      if (rarity === 'epic') stats.lifestealBonus = 0.05;
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
