export type RaceId = "human" | "highElf" | "darkElf" | "dwarf" | "orc";
export type ClassId =
  | "knight"
  | "ranger"
  | "shadow"
  | "berserker"
  | "runeSmith"
  | "warlock";

export type Slot =
  | "weapon"
  | "armor"
  | "helm"
  | "gloves"
  | "boots"
  | "ring"
  | "amulet";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface ItemDef {
  id: string;
  name: string;
  icon: string; // emoji glyph used in UI
  slot?: Slot; // undefined for materials/consumables
  rarity: Rarity;
  /** Equip stat bonuses */
  stats?: { atk?: number; def?: number; hp?: number; mp?: number; crit?: number };
  /** classes allowed to equip; undefined = any */
  classes?: ClassId[];
  /** crafting material? */
  material?: boolean;
  /** vendor sell price */
  price: number;
}

export interface InventoryStack {
  itemId: string;
  qty: number;
}

export interface Equipment {
  weapon?: string;
  armor?: string;
  helm?: string;
  gloves?: string;
  boots?: string;
  ring?: string;
  amulet?: string;
}

export interface RecipeDef {
  id: string;
  result: string; // item id
  resultQty: number;
  inputs: { itemId: string; qty: number }[];
  goldCost: number;
  minLevel: number;
}

export interface LootboxDef {
  id: string;
  name: string;
  icon: string;
  cost: number;
  pool: { itemId: string; weight: number; qty?: number }[];
}

export interface MobDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  atk: number;
  xp: number;
  goldDrop: [number, number]; // min/max
  loot: { itemId: string; chance: number; qty?: number }[];
  color: string; // body tint
  scale?: number;
  bossy?: boolean;
}

export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  cost: number;
  size: 1 | 2 | 3; // tile size (NxN)
  color: string;
  description: string;
}

export interface PlayerStats {
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  atk: number;
  def: number;
  crit: number;
}

export interface Player {
  name: string;
  race: RaceId;
  cls: ClassId;
  level: number;
  xp: number;
  gold: number;
  stats: PlayerStats;
  pos: [number, number, number];
  rotY: number;
  inventory: InventoryStack[];
  equipment: Equipment;
  unlockedRecipes: string[];
  unlockedClasses: ClassId[];
  /** placed buildings on the city tile grid (only after lvl 10) */
  city: PlacedBuilding[];
}

export interface PlacedBuilding {
  defId: string;
  /** tile coords in [-CITY_HALF, CITY_HALF) */
  tx: number;
  tz: number;
  /** y rotation in 90deg steps */
  rot: 0 | 1 | 2 | 3;
}

export type Screen =
  | "raceSelect"
  | "world"
  | "city"
  | "inventory"
  | "crafting"
  | "lootboxes";

/** XP needed to reach level n+1 from level n */
export function xpForLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.55) + 40);
}
