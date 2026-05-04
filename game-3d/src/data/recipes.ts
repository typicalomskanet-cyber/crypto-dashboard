import type { RecipeDef } from "../types";

export const RECIPES: RecipeDef[] = [
  // Iron tier — available from level 1
  {
    id: "r_short_sword",
    result: "wpn_short_sword",
    resultQty: 1,
    inputs: [{ itemId: "scrap_iron", qty: 3 }],
    goldCost: 15,
    minLevel: 1,
  },
  {
    id: "r_axe_dull",
    result: "wpn_axe_dull",
    resultQty: 1,
    inputs: [{ itemId: "scrap_iron", qty: 4 }],
    goldCost: 18,
    minLevel: 1,
  },
  {
    id: "r_bow_short",
    result: "wpn_bow_short",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_iron", qty: 2 },
      { itemId: "hide_rough", qty: 2 },
    ],
    goldCost: 22,
    minLevel: 1,
  },
  {
    id: "r_dagger_pair",
    result: "wpn_dagger_pair",
    resultQty: 1,
    inputs: [{ itemId: "scrap_iron", qty: 4 }],
    goldCost: 22,
    minLevel: 1,
  },
  {
    id: "r_hammer_apprentice",
    result: "wpn_hammer_apprentice",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_iron", qty: 3 },
      { itemId: "rune_chip", qty: 1 },
    ],
    goldCost: 24,
    minLevel: 1,
  },
  {
    id: "r_staff_charred",
    result: "wpn_staff_charred",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_iron", qty: 1 },
      { itemId: "herb_red", qty: 2 },
      { itemId: "rune_chip", qty: 1 },
    ],
    goldCost: 26,
    minLevel: 1,
  },
  {
    id: "r_arm_cloth",
    result: "arm_cloth",
    resultQty: 1,
    inputs: [{ itemId: "hide_rough", qty: 4 }],
    goldCost: 25,
    minLevel: 1,
  },
  {
    id: "r_arm_leather",
    result: "arm_leather",
    resultQty: 1,
    inputs: [{ itemId: "hide_rough", qty: 5 }],
    goldCost: 30,
    minLevel: 1,
  },

  // Steel tier — level 5+
  {
    id: "r_long_sword",
    result: "wpn_long_sword",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_steel", qty: 4 },
      { itemId: "rune_chip", qty: 1 },
    ],
    goldCost: 80,
    minLevel: 5,
  },
  {
    id: "r_yew_bow",
    result: "wpn_yew_bow",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_steel", qty: 2 },
      { itemId: "hide_thick", qty: 3 },
    ],
    goldCost: 120,
    minLevel: 5,
  },
  {
    id: "r_arm_chain",
    result: "arm_chain",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_steel", qty: 6 },
      { itemId: "hide_thick", qty: 2 },
    ],
    goldCost: 150,
    minLevel: 5,
  },
  {
    id: "r_helm_steel",
    result: "helm_steel",
    resultQty: 1,
    inputs: [{ itemId: "scrap_steel", qty: 4 }],
    goldCost: 90,
    minLevel: 5,
  },

  // Silver tier — level 10+
  {
    id: "r_arm_plate",
    result: "arm_plate",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_silver", qty: 4 },
      { itemId: "scrap_steel", qty: 4 },
      { itemId: "hide_drake", qty: 1 },
    ],
    goldCost: 380,
    minLevel: 10,
  },
  {
    id: "r_silver_dagger",
    result: "wpn_silver_dagger",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_silver", qty: 3 },
      { itemId: "rune_glyph", qty: 1 },
    ],
    goldCost: 250,
    minLevel: 10,
  },
  {
    id: "r_rune_hammer",
    result: "wpn_rune_hammer",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_silver", qty: 2 },
      { itemId: "scrap_steel", qty: 3 },
      { itemId: "rune_glyph", qty: 2 },
    ],
    goldCost: 280,
    minLevel: 10,
  },

  // Mithril tier — level 15+
  {
    id: "r_great_axe",
    result: "wpn_great_axe",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_mithril", qty: 2 },
      { itemId: "scrap_silver", qty: 4 },
      { itemId: "hide_drake", qty: 2 },
    ],
    goldCost: 600,
    minLevel: 15,
  },
  {
    id: "r_obsidian_staff",
    result: "wpn_obsidian_staff",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_mithril", qty: 1 },
      { itemId: "rune_glyph", qty: 3 },
      { itemId: "dark_essence", qty: 1 },
    ],
    goldCost: 700,
    minLevel: 15,
  },
  {
    id: "r_arm_dread",
    result: "arm_dread",
    resultQty: 1,
    inputs: [
      { itemId: "scrap_mithril", qty: 2 },
      { itemId: "dark_essence", qty: 2 },
      { itemId: "hide_drake", qty: 3 },
    ],
    goldCost: 1100,
    minLevel: 18,
  },
];
