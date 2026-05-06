import type { ItemDef } from "../types";

// Materials (no slot, stackable)
const M = (
  id: string,
  name: string,
  icon: string,
  rarity: ItemDef["rarity"],
  price: number,
): ItemDef => ({ id, name, icon, rarity, price, material: true });

// Equipment factory
const E = (
  id: string,
  name: string,
  icon: string,
  slot: ItemDef["slot"],
  rarity: ItemDef["rarity"],
  stats: ItemDef["stats"],
  price: number,
  classes?: ItemDef["classes"],
): ItemDef => ({ id, name, icon, slot, rarity, stats, price, classes });

export const ITEMS: ItemDef[] = [
  // === MATERIALS ===
  M("scrap_iron", "Scrap Iron", "🪨", "common", 4),
  M("scrap_steel", "Steel Ingot", "⛓️", "uncommon", 14),
  M("scrap_silver", "Silvered Ingot", "🥈", "rare", 38),
  M("scrap_mithril", "Mithril Shard", "✨", "epic", 95),
  M("hide_rough", "Rough Hide", "🪶", "common", 3),
  M("hide_thick", "Thick Hide", "🦬", "uncommon", 11),
  M("hide_drake", "Drake Scale", "🐉", "rare", 42),
  M("herb_blue", "Frost Herb", "🌿", "common", 5),
  M("herb_red", "Bloodroot", "🌹", "uncommon", 12),
  M("rune_chip", "Rune Chip", "🔻", "uncommon", 18),
  M("rune_glyph", "Soul Glyph", "🔥", "rare", 55),
  M("dark_essence", "Dark Essence", "🕳️", "epic", 130),

  // === STARTING WEAPONS (per archetype) ===
  E("wpn_short_sword", "Short Sword", "🗡️", "weapon", "common", { atk: 4 }, 25),
  E("wpn_axe_dull", "Iron Hatchet", "🪓", "weapon", "common", { atk: 5 }, 28),
  E("wpn_bow_short", "Hunter's Bow", "🏹", "weapon", "common", { atk: 4, crit: 2 }, 30),
  E("wpn_dagger_pair", "Twin Daggers", "🔪", "weapon", "common", { atk: 3, crit: 4 }, 32),
  E("wpn_hammer_apprentice", "Apprentice Hammer", "🔨", "weapon", "common", { atk: 4, mp: 5 }, 30),
  E("wpn_staff_charred", "Charred Staff", "🪄", "weapon", "common", { atk: 4, mp: 8 }, 34),

  // === MID-TIER WEAPONS ===
  E("wpn_long_sword", "Knight's Longsword", "⚔️", "weapon", "uncommon", { atk: 9, def: 1 }, 130, ["knight", "berserker"]),
  E("wpn_great_axe", "Bonecleaver", "🪓", "weapon", "rare", { atk: 14, crit: 3 }, 380, ["berserker"]),
  E("wpn_yew_bow", "Yewheart Longbow", "🏹", "weapon", "uncommon", { atk: 10, crit: 4 }, 180, ["ranger"]),
  E("wpn_silver_dagger", "Silver Fangs", "🔪", "weapon", "rare", { atk: 9, crit: 8 }, 360, ["shadow"]),
  E("wpn_rune_hammer", "Glyphed Hammer", "🔨", "weapon", "rare", { atk: 11, mp: 15 }, 400, ["runeSmith"]),
  E("wpn_obsidian_staff", "Obsidian Staff", "🔱", "weapon", "rare", { atk: 12, mp: 20, crit: 3 }, 420, ["warlock"]),

  // === ARMOR ===
  E("arm_cloth", "Initiate Robe", "👘", "armor", "common", { def: 3, mp: 8 }, 40),
  E("arm_leather", "Leather Vest", "🎽", "armor", "common", { def: 5, hp: 10 }, 50),
  E("arm_chain", "Chain Hauberk", "🛡️", "armor", "uncommon", { def: 11, hp: 25 }, 220),
  E("arm_plate", "Plated Cuirass", "🦾", "armor", "rare", { def: 18, hp: 60 }, 600),
  E("arm_dread", "Dreadweave Robe", "🕸️", "armor", "epic", { def: 22, mp: 50, crit: 4 }, 1400),

  // === HELM ===
  E("helm_hood", "Wanderer's Hood", "🪖", "helm", "common", { def: 2, mp: 4 }, 22),
  E("helm_steel", "Steel Helm", "⛑️", "helm", "uncommon", { def: 6, hp: 15 }, 120),
  E("helm_horned", "Horned Coronet", "👹", "helm", "rare", { def: 9, atk: 3, crit: 2 }, 320),

  // === GLOVES ===
  E("glove_cloth", "Linen Wraps", "🧤", "gloves", "common", { def: 1, atk: 1 }, 18),
  E("glove_chain", "Mailed Gauntlets", "🪮", "gloves", "uncommon", { def: 4, hp: 10 }, 110),
  E("glove_rune", "Rune-etched Vambraces", "✋", "gloves", "rare", { def: 5, atk: 4, mp: 10 }, 340),

  // === BOOTS ===
  E("boots_traveler", "Traveler's Boots", "🥾", "boots", "common", { def: 1, hp: 8 }, 18),
  E("boots_swift", "Swift Striders", "👢", "boots", "uncommon", { def: 3, crit: 3 }, 130),
  E("boots_dread", "Dread-shod Greaves", "🦶", "boots", "rare", { def: 6, hp: 20, crit: 2 }, 320),

  // === RING ===
  E("ring_iron", "Iron Band", "💍", "ring", "common", { atk: 1, hp: 4 }, 15),
  E("ring_silver", "Silver Sigil", "💍", "ring", "uncommon", { atk: 3, mp: 6 }, 90),
  E("ring_skull", "Skull-set Ring", "💀", "ring", "rare", { atk: 5, crit: 3, mp: 10 }, 280),
  E("ring_void", "Voidstone Ring", "🌑", "ring", "epic", { atk: 8, crit: 5, mp: 20 }, 750),

  // === AMULET ===
  E("amu_charm", "Bone Charm", "🦴", "amulet", "common", { hp: 10 }, 15),
  E("amu_glyph", "Glyph Pendant", "🔮", "amulet", "uncommon", { mp: 12, def: 2 }, 100),
  E("amu_drake", "Drake-tooth Amulet", "🦷", "amulet", "rare", { hp: 30, atk: 4 }, 290),
  E("amu_shadow", "Shadow Heart", "🖤", "amulet", "epic", { hp: 40, crit: 6, mp: 20 }, 800),

  // === CONSUMABLES ===
  // HP / MP potions (Diablo-style) — used via hotkeys 5/6
  {
    id: "pot_heal_minor", name: "Minor Heal Potion", icon: "🧴",
    rarity: "common", price: 30, consumable: "hp_potion", amount: 60, cooldown: 6,
  },
  {
    id: "pot_heal_major", name: "Major Heal Potion", icon: "💉",
    rarity: "uncommon", price: 90, consumable: "hp_potion", amount: 160, cooldown: 8,
  },
  {
    id: "pot_mana_minor", name: "Minor Mana Potion", icon: "💧",
    rarity: "common", price: 28, consumable: "mp_potion", amount: 40, cooldown: 6,
  },
  {
    id: "pot_mana_major", name: "Major Mana Potion", icon: "🔵",
    rarity: "uncommon", price: 80, consumable: "mp_potion", amount: 100, cooldown: 8,
  },
  // Soulshots / Spirit Shots (Lineage 2-style) — toggle on, deplete per attack
  {
    id: "soulshot", name: "Soulshot", icon: "🔥",
    rarity: "common", price: 5, consumable: "soulshot", amount: 50, // +50% atk dmg
  },
  {
    id: "spirit_shot", name: "Spirit Shot", icon: "💎",
    rarity: "common", price: 7, consumable: "spirit_shot", amount: 50, // +50% spell dmg
  },
  {
    id: "soulshot_grade_b", name: "Blessed Soulshot", icon: "🌋",
    rarity: "uncommon", price: 15, consumable: "soulshot", amount: 100,
  },
  {
    id: "spirit_shot_grade_b", name: "Blessed Spirit Shot", icon: "✨",
    rarity: "uncommon", price: 20, consumable: "spirit_shot", amount: 100,
  },
  // Enchant scrolls — used in the Forge Enchant tab
  {
    id: "scroll_enchant_weapon", name: "Scroll of Enchant Weapon", icon: "📜",
    rarity: "rare", price: 250,
  },
  {
    id: "scroll_enchant_armor", name: "Scroll of Enchant Armor", icon: "📃",
    rarity: "rare", price: 200,
  },
];

export const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));

export const RARITY_COLOR: Record<string, string> = {
  common: "#a4a8b8",
  uncommon: "#3ed35e",
  rare: "#54a8ff",
  epic: "#c062ff",
  legendary: "#ffb340",
};
