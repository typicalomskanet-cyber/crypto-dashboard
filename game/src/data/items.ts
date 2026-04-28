import type { Item } from '../types';

// Item catalog. Kept small but covers each slot, materials, and consumables.
export const ITEMS: Record<string, Item> = {
  // --- Consumables ---
  potion_hp_s: {
    id: 'potion_hp_s',
    kind: 'consumable',
    name: 'Minor Healing Draught',
    rarity: 'common',
    restoreHp: 80,
    icon: '🧪',
  },
  potion_mp_s: {
    id: 'potion_mp_s',
    kind: 'consumable',
    name: 'Minor Mana Draught',
    rarity: 'common',
    restoreMp: 60,
    icon: '🔮',
  },

  // --- Materials ---
  mat_iron: {
    id: 'mat_iron',
    kind: 'material',
    name: 'Iron Ingot',
    rarity: 'common',
    icon: '🪙',
  },
  mat_wood: {
    id: 'mat_wood',
    kind: 'material',
    name: 'Oak Plank',
    rarity: 'common',
    icon: '🪵',
  },
  mat_leather: {
    id: 'mat_leather',
    kind: 'material',
    name: 'Tanned Hide',
    rarity: 'common',
    icon: '🧵',
  },
  mat_mana: {
    id: 'mat_mana',
    kind: 'material',
    name: 'Mana Shard',
    rarity: 'uncommon',
    icon: '💎',
  },
  mat_shadow: {
    id: 'mat_shadow',
    kind: 'material',
    name: 'Shadow Essence',
    rarity: 'rare',
    icon: '🕳️',
  },

  // --- Weapons ---
  wpn_short_sword: {
    id: 'wpn_short_sword',
    kind: 'equipment',
    name: 'Short Sword',
    slot: 'weapon',
    rarity: 'common',
    stats: { atk: 8 },
    levelReq: 1,
    icon: '🗡️',
  },
  wpn_long_sword: {
    id: 'wpn_long_sword',
    kind: 'equipment',
    name: 'Long Sword',
    slot: 'weapon',
    rarity: 'uncommon',
    stats: { atk: 18, crit: 0.02 },
    levelReq: 5,
    icon: '⚔️',
  },
  wpn_war_axe: {
    id: 'wpn_war_axe',
    kind: 'equipment',
    name: 'War Axe',
    slot: 'weapon',
    rarity: 'uncommon',
    stats: { atk: 22 },
    levelReq: 5,
    icon: '🪓',
  },
  wpn_staff_apprentice: {
    id: 'wpn_staff_apprentice',
    kind: 'equipment',
    name: "Apprentice's Staff",
    slot: 'weapon',
    rarity: 'common',
    stats: { matk: 10, mp: 20 },
    levelReq: 1,
    icon: '🪄',
  },
  wpn_hunter_bow: {
    id: 'wpn_hunter_bow',
    kind: 'equipment',
    name: "Hunter's Bow",
    slot: 'weapon',
    rarity: 'common',
    stats: { atk: 9, crit: 0.03 },
    levelReq: 1,
    icon: '🏹',
  },
  wpn_devil_blade: {
    id: 'wpn_devil_blade',
    kind: 'equipment',
    name: 'Devil Blade of Oblivion',
    slot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 60, crit: 0.1, matk: 20 },
    levelReq: 15,
    icon: '🔥',
  },

  // --- Offhand ---
  off_wood_shield: {
    id: 'off_wood_shield',
    kind: 'equipment',
    name: 'Wooden Shield',
    slot: 'offhand',
    rarity: 'common',
    stats: { def: 6 },
    levelReq: 1,
    icon: '🛡️',
  },

  // --- Armor ---
  arm_leather_hood: {
    id: 'arm_leather_hood',
    kind: 'equipment',
    name: 'Leather Hood',
    slot: 'head',
    rarity: 'common',
    stats: { def: 3, mdef: 2 },
    levelReq: 1,
    icon: '🎩',
  },
  arm_leather_vest: {
    id: 'arm_leather_vest',
    kind: 'equipment',
    name: 'Leather Vest',
    slot: 'chest',
    rarity: 'common',
    stats: { def: 8 },
    levelReq: 1,
    icon: '🦺',
  },
  arm_chain_legs: {
    id: 'arm_chain_legs',
    kind: 'equipment',
    name: 'Chain Greaves',
    slot: 'legs',
    rarity: 'uncommon',
    stats: { def: 10 },
    levelReq: 5,
    icon: '👖',
  },
  arm_leather_boots: {
    id: 'arm_leather_boots',
    kind: 'equipment',
    name: 'Leather Boots',
    slot: 'feet',
    rarity: 'common',
    stats: { def: 2, speed: 0.2 },
    levelReq: 1,
    icon: '🥾',
  },

  // --- Accessories ---
  acc_ring_vigor: {
    id: 'acc_ring_vigor',
    kind: 'equipment',
    name: 'Ring of Vigor',
    slot: 'ring',
    rarity: 'uncommon',
    stats: { hp: 30 },
    levelReq: 3,
    icon: '💍',
  },
  acc_amulet_focus: {
    id: 'acc_amulet_focus',
    kind: 'equipment',
    name: 'Amulet of Focus',
    slot: 'amulet',
    rarity: 'uncommon',
    stats: { mp: 30, matk: 4 },
    levelReq: 3,
    icon: '📿',
  },
};

export function getItem(id: string): Item | undefined {
  return ITEMS[id];
}
