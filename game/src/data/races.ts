import type { RaceDef, ClassDef, SkillDef, StatBlock } from '../types';

// Base progression used as a fallback.
const base: StatBlock = {
  hp: 100,
  mp: 40,
  atk: 10,
  def: 6,
  matk: 6,
  mdef: 5,
  crit: 0.05,
  speed: 3.2,
};
const growth: StatBlock = {
  hp: 18,
  mp: 8,
  atk: 2.2,
  def: 1.4,
  matk: 1.2,
  mdef: 1,
  crit: 0.003,
  speed: 0.02,
};

function mk(
  mods: Partial<StatBlock>,
  modsGrowth: Partial<StatBlock> = {},
): { baseStats: StatBlock; perLevel: StatBlock } {
  return {
    baseStats: { ...base, ...mods },
    perLevel: { ...growth, ...modsGrowth },
  };
}

const skillSlash: SkillDef = {
  id: 'sk_slash',
  name: 'Power Slash',
  mpCost: 8,
  cooldown: 3,
  damageMul: 1.8,
  element: 'physical',
  kind: 'melee',
  description: 'A heavy slash dealing 180% weapon damage.',
};
const skillCleave: SkillDef = {
  id: 'sk_cleave',
  name: 'Cleave',
  mpCost: 10,
  cooldown: 4,
  damageMul: 1.5,
  element: 'physical',
  kind: 'melee',
  description: 'Wide arc attack hitting the target for 150% damage.',
};
const skillShadowStep: SkillDef = {
  id: 'sk_shadowstep',
  name: 'Shadow Strike',
  mpCost: 14,
  cooldown: 6,
  damageMul: 2.4,
  element: 'shadow',
  kind: 'melee',
  description: 'Teleport-style strike dealing 240% damage.',
};
const skillArrowVolley: SkillDef = {
  id: 'sk_volley',
  name: 'Piercing Arrow',
  mpCost: 10,
  cooldown: 4,
  damageMul: 2.0,
  element: 'physical',
  kind: 'ranged',
  description: 'Pierces enemy armor for 200% damage.',
};
const skillFireball: SkillDef = {
  id: 'sk_fireball',
  name: 'Fireball',
  mpCost: 18,
  cooldown: 5,
  damageMul: 2.2,
  element: 'fire',
  kind: 'spell',
  description: 'Hurls a fiery orb for 220% magic damage.',
};
const skillFrost: SkillDef = {
  id: 'sk_frost',
  name: 'Frost Lance',
  mpCost: 16,
  cooldown: 5,
  damageMul: 2.0,
  element: 'ice',
  kind: 'spell',
  description: 'Impales with ice, 200% magic damage.',
};
const skillEarthStrike: SkillDef = {
  id: 'sk_earth',
  name: 'Earth Smash',
  mpCost: 12,
  cooldown: 5,
  damageMul: 2.1,
  element: 'physical',
  kind: 'melee',
  description: 'A mighty smash dealing 210% damage.',
};
const skillHolyLight: SkillDef = {
  id: 'sk_holy',
  name: 'Holy Light',
  mpCost: 15,
  cooldown: 6,
  damageMul: 1.8,
  element: 'holy',
  kind: 'spell',
  description: 'A radiant burst dealing 180% magic damage.',
};

function cls(
  raceId: RaceDef['id'],
  id: string,
  name: string,
  role: ClassDef['role'],
  mods: Partial<StatBlock>,
  skills: SkillDef[],
  modsGrowth: Partial<StatBlock> = {},
): ClassDef {
  const s = mk(mods, modsGrowth);
  return { id, raceId, name, role, baseStats: s.baseStats, perLevel: s.perLevel, skills };
}

export const RACE_DEFS: RaceDef[] = [
  {
    id: 'human',
    name: 'Human',
    lore:
      'Adaptable, resourceful, ambitious. Humans stand at the balanced center of the realm — strong at no single thing, yet denied nothing.',
    colorPrimary: '#c9a66b',
    colorSecondary: '#6b4a2b',
    colorSkin: '#e8c6a4',
    height: 1.0,
    build: 'normal',
    classes: [
      cls(
        'human',
        'human_knight',
        'Knight',
        'fighter',
        { hp: 120, def: 10, atk: 11 },
        [skillSlash, skillCleave],
      ),
      cls(
        'human',
        'human_mage',
        'Wizard',
        'mage',
        { hp: 80, mp: 80, matk: 14, mdef: 8 },
        [skillFireball, skillFrost],
      ),
    ],
  },
  {
    id: 'elf',
    name: 'Elf',
    lore:
      'Graceful children of the forests, masters of wind and wood. Their arrows sing before they strike.',
    colorPrimary: '#a8e6a1',
    colorSecondary: '#2f6d3c',
    colorSkin: '#f3e0c7',
    height: 1.05,
    build: 'slim',
    classes: [
      cls(
        'elf',
        'elf_ranger',
        'Ranger',
        'rogue',
        { hp: 95, atk: 12, crit: 0.08, speed: 3.4 },
        [skillArrowVolley, skillSlash],
        { speed: 0.03 },
      ),
      cls(
        'elf',
        'elf_druid',
        'Druid',
        'mage',
        { hp: 90, mp: 70, matk: 12, mdef: 9 },
        [skillHolyLight, skillFrost],
      ),
    ],
  },
  {
    id: 'darkElf',
    name: 'Dark Elf',
    lore:
      'Exiles of the sunlit glades, sworn to shadow and poisoned steel. They strike unseen and leave no witnesses.',
    colorPrimary: '#8a5cf6',
    colorSecondary: '#2a1740',
    colorSkin: '#5a3f6b',
    height: 1.02,
    build: 'slim',
    classes: [
      cls(
        'darkElf',
        'de_assassin',
        'Assassin',
        'rogue',
        { hp: 90, atk: 14, crit: 0.12, speed: 3.5 },
        [skillShadowStep, skillSlash],
        { crit: 0.006 },
      ),
      cls(
        'darkElf',
        'de_sorcerer',
        'Shadow Sorcerer',
        'mage',
        { hp: 80, mp: 90, matk: 16, mdef: 7 },
        [skillFireball, skillShadowStep],
      ),
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    lore:
      'Carved from mountain stone, loyal as iron and stubborn as winter. Their forges outshine the stars.',
    colorPrimary: '#d48d4a',
    colorSecondary: '#5a3220',
    colorSkin: '#f0c89c',
    height: 0.85,
    build: 'stocky',
    classes: [
      cls(
        'dwarf',
        'dw_warrior',
        'Mountain Warrior',
        'fighter',
        { hp: 140, def: 12, atk: 10, speed: 3.0 },
        [skillEarthStrike, skillCleave],
        { hp: 22 },
      ),
      cls(
        'dwarf',
        'dw_artisan',
        'Artisan',
        'support',
        { hp: 110, def: 9, atk: 9, mdef: 7 },
        [skillCleave, skillHolyLight],
      ),
    ],
  },
  {
    id: 'orc',
    name: 'Orc',
    lore:
      'Children of thunder and war. Where orcs march, the earth remembers their passing for a hundred years.',
    colorPrimary: '#6fa85c',
    colorSecondary: '#2d3b1d',
    colorSkin: '#8fb76b',
    height: 1.12,
    build: 'stocky',
    classes: [
      cls(
        'orc',
        'orc_berserker',
        'Berserker',
        'fighter',
        { hp: 135, atk: 14, def: 7, speed: 3.3 },
        [skillCleave, skillSlash],
        { atk: 2.6 },
      ),
      cls(
        'orc',
        'orc_shaman',
        'Shaman',
        'support',
        { hp: 105, mp: 70, matk: 12, mdef: 8 },
        [skillEarthStrike, skillHolyLight],
      ),
    ],
  },
];

export function getRace(id: string): RaceDef | undefined {
  return RACE_DEFS.find((r) => r.id === id);
}

export function getClass(id: string): ClassDef | undefined {
  for (const r of RACE_DEFS) {
    const c = r.classes.find((x) => x.id === id);
    if (c) return c;
  }
  return undefined;
}
