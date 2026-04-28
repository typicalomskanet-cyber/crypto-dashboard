// Shared domain types for Chronicle of Devil Gods.

export const RACES = ['human', 'elf', 'darkElf', 'dwarf', 'orc'] as const;
export type RaceId = (typeof RACES)[number];

export type Element = 'physical' | 'fire' | 'ice' | 'shadow' | 'holy' | 'nature';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'legs'
  | 'feet'
  | 'ring'
  | 'amulet';

export interface StatBlock {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  crit: number; // 0..1
  speed: number;
}

export const ZERO_STATS: StatBlock = {
  hp: 0,
  mp: 0,
  atk: 0,
  def: 0,
  matk: 0,
  mdef: 0,
  crit: 0,
  speed: 0,
};

export interface EquipmentItem {
  id: string;
  kind: 'equipment';
  name: string;
  slot: EquipSlot;
  rarity: ItemRarity;
  stats: Partial<StatBlock>;
  levelReq: number;
  icon: string; // emoji glyph used in UI
}

export interface ConsumableItem {
  id: string;
  kind: 'consumable';
  name: string;
  rarity: ItemRarity;
  restoreHp?: number;
  restoreMp?: number;
  icon: string;
}

export interface MaterialItem {
  id: string;
  kind: 'material';
  name: string;
  rarity: ItemRarity;
  icon: string;
}

export type Item = EquipmentItem | ConsumableItem | MaterialItem;

export interface InventoryStack {
  itemId: string;
  count: number;
}

export interface ClassDef {
  id: string;
  raceId: RaceId;
  name: string;
  role: 'fighter' | 'rogue' | 'mage' | 'support';
  baseStats: StatBlock;
  perLevel: StatBlock;
  skills: SkillDef[];
}

export interface SkillDef {
  id: string;
  name: string;
  mpCost: number;
  cooldown: number; // seconds
  damageMul: number; // multiplier on atk or matk
  element: Element;
  kind: 'melee' | 'ranged' | 'spell' | 'buff';
  description: string;
}

export interface RaceDef {
  id: RaceId;
  name: string;
  lore: string;
  colorPrimary: string;
  colorSecondary: string;
  colorSkin: string;
  height: number; // 0.8..1.2 multiplier
  build: 'slim' | 'normal' | 'stocky';
  classes: ClassDef[];
}

export interface EnemyDef {
  id: string;
  name: string;
  level: number;
  stats: StatBlock;
  color: string;
  xpReward: number;
  lootTable: LootEntry[];
}

export interface LootEntry {
  itemId: string;
  chance: number; // 0..1
  min: number;
  max: number;
}

export interface Recipe {
  id: string;
  name: string;
  result: { itemId: string; count: number };
  inputs: InventoryStack[];
  requiredLevel: number;
}

export interface LootboxTier {
  id: string;
  name: string;
  cost: number; // soft currency
  pity: number; // after N opens without epic+, guarantee epic+
  drops: { itemId: string; weight: number }[];
}

export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  color: string;
  size: [number, number]; // tiles
  cost: InventoryStack[];
  providesBuff: Partial<StatBlock>;
}

export interface PlacedBuilding {
  buildingId: string;
  x: number;
  y: number;
}

export interface PlayerState {
  raceId: RaceId;
  classId: string;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  pos: { x: number; z: number };
  inventory: InventoryStack[];
  equipped: Partial<Record<EquipSlot, string>>;
  pityCounter: number;
  city: PlacedBuilding[];
}
