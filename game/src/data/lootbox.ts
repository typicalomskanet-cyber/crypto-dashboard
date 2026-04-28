import type { LootboxTier } from '../types';

// Transparent gacha drop rates. Pity counter guarantees an epic+ drop after N
// consecutive opens without one.
export const LOOTBOXES: LootboxTier[] = [
  {
    id: 'box_wooden',
    name: 'Wooden Chest',
    cost: 100,
    pity: 20,
    drops: [
      { itemId: 'mat_wood', weight: 40 },
      { itemId: 'mat_iron', weight: 25 },
      { itemId: 'mat_leather', weight: 20 },
      { itemId: 'potion_hp_s', weight: 8 },
      { itemId: 'mat_mana', weight: 5 },
      { itemId: 'acc_ring_vigor', weight: 2 }, // uncommon
    ],
  },
  {
    id: 'box_steel',
    name: 'Steel Reliquary',
    cost: 500,
    pity: 10,
    drops: [
      { itemId: 'mat_iron', weight: 30 },
      { itemId: 'mat_mana', weight: 20 },
      { itemId: 'wpn_long_sword', weight: 10 },
      { itemId: 'wpn_hunter_bow', weight: 10 },
      { itemId: 'arm_chain_legs', weight: 10 },
      { itemId: 'acc_amulet_focus', weight: 10 },
      { itemId: 'mat_shadow', weight: 8 },
      { itemId: 'wpn_devil_blade', weight: 2 }, // legendary
    ],
  },
];

export function rarityRank(rarity: string): number {
  switch (rarity) {
    case 'common':
      return 0;
    case 'uncommon':
      return 1;
    case 'rare':
      return 2;
    case 'epic':
      return 3;
    case 'legendary':
      return 4;
    default:
      return 0;
  }
}

export function getLootboxTier(id: string): LootboxTier | undefined {
  return LOOTBOXES.find((b) => b.id === id);
}
