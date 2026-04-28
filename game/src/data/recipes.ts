import type { Recipe } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'r_long_sword',
    name: 'Forge Long Sword',
    result: { itemId: 'wpn_long_sword', count: 1 },
    inputs: [
      { itemId: 'mat_iron', count: 4 },
      { itemId: 'mat_wood', count: 1 },
    ],
    requiredLevel: 3,
  },
  {
    id: 'r_war_axe',
    name: 'Forge War Axe',
    result: { itemId: 'wpn_war_axe', count: 1 },
    inputs: [
      { itemId: 'mat_iron', count: 5 },
      { itemId: 'mat_wood', count: 2 },
    ],
    requiredLevel: 4,
  },
  {
    id: 'r_chain_legs',
    name: 'Forge Chain Greaves',
    result: { itemId: 'arm_chain_legs', count: 1 },
    inputs: [
      { itemId: 'mat_iron', count: 3 },
      { itemId: 'mat_leather', count: 2 },
    ],
    requiredLevel: 3,
  },
  {
    id: 'r_ring_vigor',
    name: 'Enchant Ring of Vigor',
    result: { itemId: 'acc_ring_vigor', count: 1 },
    inputs: [
      { itemId: 'mat_iron', count: 1 },
      { itemId: 'mat_mana', count: 1 },
    ],
    requiredLevel: 2,
  },
  {
    id: 'r_amulet_focus',
    name: 'Enchant Amulet of Focus',
    result: { itemId: 'acc_amulet_focus', count: 1 },
    inputs: [
      { itemId: 'mat_leather', count: 1 },
      { itemId: 'mat_mana', count: 2 },
    ],
    requiredLevel: 2,
  },
  {
    id: 'r_potion_hp',
    name: 'Brew Healing Draught',
    result: { itemId: 'potion_hp_s', count: 3 },
    inputs: [{ itemId: 'mat_leather', count: 1 }],
    requiredLevel: 1,
  },
];
