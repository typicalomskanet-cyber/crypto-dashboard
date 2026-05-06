import type { RaceId, ClassId } from "../types";

export interface RaceDef {
  id: RaceId;
  name: string;
  tagline: string;
  description: string;
  /** body skin tint */
  skin: string;
  /** secondary tint (hair / cloak) */
  accent: string;
  /** scale modifier */
  scale: number;
  /** stat bonuses applied at character creation */
  bonus: { hp: number; mp: number; atk: number; def: number; crit: number };
  startingClasses: ClassId[];
  /** classes that unlock at level 20 */
  upgradeClasses: ClassId[];
}

export const RACES: RaceDef[] = [
  {
    id: "human",
    name: "Humans of Ardholm",
    tagline: "Versatile, brave, ambitious.",
    description:
      "Wandering kingdoms of mortals, balanced in body and mind. No special gift, no glaring weakness — anything is possible.",
    skin: "#e6c2a0",
    accent: "#5b6cff",
    scale: 1.0,
    bonus: { hp: 120, mp: 60, atk: 6, def: 5, crit: 4 },
    startingClasses: ["knight", "ranger"],
    upgradeClasses: ["warlock"],
  },
  {
    id: "highElf",
    name: "High Elves of Aelthar",
    tagline: "Graceful arcanists of the silver woods.",
    description:
      "Tall, agile, longer-lived than any mortal. Born with sympathy for the weave of mana — natural rangers and runesmiths.",
    skin: "#f0dfc8",
    accent: "#9ad6ff",
    scale: 1.05,
    bonus: { hp: 90, mp: 110, atk: 5, def: 4, crit: 7 },
    startingClasses: ["ranger", "runeSmith"],
    upgradeClasses: ["warlock"],
  },
  {
    id: "darkElf",
    name: "Dark Elves of Nyssara",
    tagline: "Exiled siblings; wielders of forbidden glyphs.",
    description:
      "Pale-skinned cousins of the high elves, hardened by life beneath stone. Quick blades and quicker spite.",
    skin: "#c2a3c8",
    accent: "#b056ff",
    scale: 1.0,
    bonus: { hp: 95, mp: 95, atk: 7, def: 4, crit: 8 },
    startingClasses: ["shadow", "warlock"],
    upgradeClasses: ["runeSmith"],
  },
  {
    id: "dwarf",
    name: "Dwarves of Karag-Tor",
    tagline: "Stone-born forgemasters.",
    description:
      "Stout, stubborn, deathlessly loyal. Every dwarf is born half a smith — they read iron the way bards read poetry.",
    skin: "#dca57a",
    accent: "#ffb547",
    scale: 0.85,
    bonus: { hp: 150, mp: 50, atk: 7, def: 9, crit: 3 },
    startingClasses: ["knight", "runeSmith"],
    upgradeClasses: ["berserker"],
  },
  {
    id: "orc",
    name: "Orcs of the Iron Tribes",
    tagline: "Bone, fang and total certainty.",
    description:
      "The Iron Tribes do not negotiate. Their warriors strike like falling pillars and shrug off wounds that would fell a man.",
    skin: "#7da66a",
    accent: "#ff5a3a",
    scale: 1.15,
    bonus: { hp: 170, mp: 30, atk: 9, def: 6, crit: 5 },
    startingClasses: ["berserker", "knight"],
    upgradeClasses: ["shadow"],
  },
];

export interface ClassDef {
  id: ClassId;
  name: string;
  desc: string;
  /** primary attack archetype, used for icon & weapon preference */
  archetype: "melee" | "ranged" | "magic" | "stealth";
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  baseMp: number;
  baseCrit: number;
}

export const CLASSES: ClassDef[] = [
  {
    id: "knight",
    name: "Knight",
    desc: "Sword-and-shield front-liner. High defence and HP.",
    archetype: "melee",
    baseAtk: 12,
    baseDef: 12,
    baseHp: 40,
    baseMp: 0,
    baseCrit: 2,
  },
  {
    id: "ranger",
    name: "Ranger",
    desc: "Longbow stalker. Hits at distance, hates being hit.",
    archetype: "ranged",
    baseAtk: 14,
    baseDef: 6,
    baseHp: 20,
    baseMp: 10,
    baseCrit: 8,
  },
  {
    id: "shadow",
    name: "Shadow",
    desc: "Twin-dagger killer. Critical strikes from behind.",
    archetype: "stealth",
    baseAtk: 13,
    baseDef: 5,
    baseHp: 20,
    baseMp: 10,
    baseCrit: 12,
  },
  {
    id: "berserker",
    name: "Berserker",
    desc: "Two-hand axe wielder. Damage scales with missing HP.",
    archetype: "melee",
    baseAtk: 18,
    baseDef: 7,
    baseHp: 50,
    baseMp: 0,
    baseCrit: 4,
  },
  {
    id: "runeSmith",
    name: "Rune Smith",
    desc: "Hammer + glyph caster. Heals allies, smites undead.",
    archetype: "magic",
    baseAtk: 9,
    baseDef: 9,
    baseHp: 30,
    baseMp: 30,
    baseCrit: 3,
  },
  {
    id: "warlock",
    name: "Warlock",
    desc: "Black-flame conjurer. Curses, drains, splash damage.",
    archetype: "magic",
    baseAtk: 11,
    baseDef: 4,
    baseHp: 15,
    baseMp: 40,
    baseCrit: 5,
  },
];
