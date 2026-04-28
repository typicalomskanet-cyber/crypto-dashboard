// Maps an item id to a public-path SVG icon (game-icons.net set in
// /public/icons). Falls back to a generic icon if no mapping is found.

const MAP: Record<string, string> = {
  // Consumables
  potion_hp_s: 'lorc_round-bottom-flask',
  potion_mp_s: 'lorc_potion-ball',

  // Materials
  mat_iron: 'lorc_anvil',
  mat_wood: 'lorc_wood-axe',
  mat_leather: 'lorc_leather-vest',
  mat_mana: 'lorc_crystal-cluster',
  mat_shadow: 'lorc_skull-bolt',

  // Weapons
  wpn_short_sword: 'lorc_pointy-sword',
  wpn_long_sword: 'lorc_winged-sword',
  wpn_war_axe: 'lorc_battle-axe',
  wpn_staff_apprentice: 'lorc_wizard-staff',
  wpn_hunter_bow: 'lorc_pocket-bow',
  wpn_devil_blade: 'lorc_dripping-blade',

  // Armour / shield
  off_wood_shield: 'lorc_wooden-sign',
  arm_leather_hood: 'lorc_curly-mask',
  arm_leather_vest: 'lorc_leather-vest',
  arm_chain_legs: 'lorc_visored-helm',
  arm_leather_boots: 'lorc_boot-prints',

  // Accessories
  acc_ring_vigor: 'lorc_holy-symbol',
  acc_amulet_focus: 'lorc_orb-direction',
};

export function iconFor(itemId: string): string {
  const slug = MAP[itemId] ?? 'lorc_skull-crossed-bones';
  return `./icons/${slug}.svg`;
}

// Building -> icon
const BUILDING_MAP: Record<string, string> = {
  bld_house: 'delapouite_house',
  bld_barracks: 'delapouite_castle',
  bld_market: 'delapouite_farm-tractor',
  bld_smithy: 'lorc_anvil',
  bld_arcane: 'lorc_wizard-staff',
  bld_tower: 'delapouite_castle',
};
export function buildingIcon(id: string): string {
  const slug = BUILDING_MAP[id] ?? 'delapouite_house';
  return `./icons/${slug}.svg`;
}

// Skill -> icon (best-effort)
const SKILL_KEYWORD_MAP: { match: RegExp; slug: string }[] = [
  { match: /(slash|sword|strike|cleave)/i, slug: 'lorc_sword-clash' },
  { match: /(shadow|dark|void)/i, slug: 'lorc_spectre' },
  { match: /(fire|flame|burn|inferno)/i, slug: 'lorc_fire-bowl' },
  { match: /(frost|ice|snow|cold)/i, slug: 'lorc_icicles-aura' },
  { match: /(arrow|bow|shot)/i, slug: 'lorc_high-shot' },
  { match: /(holy|light|priest|prayer)/i, slug: 'lorc_holy-symbol' },
  { match: /(arcane|mana|magic|spell)/i, slug: 'lorc_magic-swirl' },
  { match: /(axe|cleav)/i, slug: 'lorc_battle-axe' },
];
export function skillIcon(skillId: string, name?: string): string {
  const text = `${skillId} ${name ?? ''}`;
  for (const m of SKILL_KEYWORD_MAP) {
    if (m.match.test(text)) return `./icons/${m.slug}.svg`;
  }
  return './icons/lorc_crossed-swords.svg';
}

// Lootbox tiers
export function lootboxIcon(): string {
  return './icons/lorc_skull-crossed-bones.svg';
}
