import type { ClassId } from "../types";

/**
 * Active combat skill (Diablo-style). Each class has 4 skills bound to keys 1..4.
 *
 * Skills work via the existing `cdg:attack` event but boost damage with `dmgMul`
 * and optionally trigger AoE / DoT / heal effects via `kind`.
 */
export interface SkillDef {
  id: string;
  name: string;
  /** Emoji icon for the skill bar. */
  icon: string;
  /** Mana cost. 0 = no cost. */
  mp: number;
  /** Cooldown in seconds. */
  cd: number;
  /** Damage multiplier vs base attack (1 = normal). */
  dmgMul: number;
  /** Single | aoe | self (heal/buff). */
  kind: "single" | "aoe" | "heal" | "buff";
  /** AoE radius in world units (for aoe kind). */
  radius?: number;
  /** Heal amount (for heal kind). */
  heal?: number;
  /** Buff atk multiplier and duration in seconds. */
  buffAtk?: number;
  buffDur?: number;
  desc: string;
}

export const SKILLS_BY_CLASS: Record<ClassId, SkillDef[]> = {
  knight: [
    {
      id: "kn_slash",
      name: "Power Strike",
      icon: "⚔️",
      mp: 0,
      cd: 0,
      dmgMul: 1.0,
      kind: "single",
      desc: "Basic sword strike. No cost.",
    },
    {
      id: "kn_bash",
      name: "Shield Bash",
      icon: "🛡️",
      mp: 8,
      cd: 4,
      dmgMul: 1.7,
      kind: "single",
      desc: "Heavy bash that deals +70% damage.",
    },
    {
      id: "kn_whirl",
      name: "Whirlwind",
      icon: "🌀",
      mp: 16,
      cd: 8,
      dmgMul: 1.4,
      kind: "aoe",
      radius: 3.5,
      desc: "Spin attack hitting all enemies in 3.5m.",
    },
    {
      id: "kn_cry",
      name: "Heroic Cry",
      icon: "📯",
      mp: 12,
      cd: 18,
      dmgMul: 0,
      kind: "buff",
      buffAtk: 1.4,
      buffDur: 8,
      desc: "+40% attack for 8s.",
    },
  ],
  ranger: [
    {
      id: "rg_shot",
      name: "Quick Shot",
      icon: "🏹",
      mp: 0,
      cd: 0,
      dmgMul: 1.0,
      kind: "single",
      desc: "Basic arrow.",
    },
    {
      id: "rg_pierce",
      name: "Piercing Shot",
      icon: "➹",
      mp: 10,
      cd: 5,
      dmgMul: 2.1,
      kind: "single",
      desc: "Heavy arrow, +110% damage.",
    },
    {
      id: "rg_volley",
      name: "Volley",
      icon: "🎯",
      mp: 18,
      cd: 10,
      dmgMul: 1.2,
      kind: "aoe",
      radius: 4.5,
      desc: "Rain arrows in a 4.5m circle.",
    },
    {
      id: "rg_focus",
      name: "Hunter's Focus",
      icon: "🦅",
      mp: 14,
      cd: 22,
      dmgMul: 0,
      kind: "buff",
      buffAtk: 1.5,
      buffDur: 10,
      desc: "+50% attack for 10s.",
    },
  ],
  shadow: [
    {
      id: "sh_strike",
      name: "Backstab",
      icon: "🗡️",
      mp: 0,
      cd: 0,
      dmgMul: 1.1,
      kind: "single",
      desc: "Quick dagger strike.",
    },
    {
      id: "sh_poison",
      name: "Venom Lash",
      icon: "🧪",
      mp: 12,
      cd: 6,
      dmgMul: 1.6,
      kind: "single",
      desc: "+60% damage with poison flavor.",
    },
    {
      id: "sh_smoke",
      name: "Smoke Detonation",
      icon: "💨",
      mp: 16,
      cd: 9,
      dmgMul: 1.3,
      kind: "aoe",
      radius: 3.2,
      desc: "Smoke bomb damages nearby foes.",
    },
    {
      id: "sh_focus",
      name: "Killing Edge",
      icon: "🌑",
      mp: 14,
      cd: 24,
      dmgMul: 0,
      kind: "buff",
      buffAtk: 1.6,
      buffDur: 6,
      desc: "+60% attack for 6s.",
    },
  ],
  berserker: [
    {
      id: "bk_chop",
      name: "Heavy Chop",
      icon: "🪓",
      mp: 0,
      cd: 0,
      dmgMul: 1.1,
      kind: "single",
      desc: "Massive axe chop.",
    },
    {
      id: "bk_rage",
      name: "Frenzy",
      icon: "💢",
      mp: 10,
      cd: 5,
      dmgMul: 1.9,
      kind: "single",
      desc: "Reckless +90% strike.",
    },
    {
      id: "bk_quake",
      name: "Earthshatter",
      icon: "🌋",
      mp: 20,
      cd: 12,
      dmgMul: 1.5,
      kind: "aoe",
      radius: 4.0,
      desc: "Slam the ground in a 4m circle.",
    },
    {
      id: "bk_warcry",
      name: "Bloodlust",
      icon: "🩸",
      mp: 12,
      cd: 20,
      dmgMul: 0,
      kind: "buff",
      buffAtk: 1.7,
      buffDur: 6,
      desc: "+70% attack for 6s.",
    },
  ],
  runeSmith: [
    {
      id: "rs_bolt",
      name: "Rune Bolt",
      icon: "🪄",
      mp: 4,
      cd: 0,
      dmgMul: 1.2,
      kind: "single",
      desc: "Magic bolt at range.",
    },
    {
      id: "rs_glyph",
      name: "Searing Glyph",
      icon: "✨",
      mp: 14,
      cd: 7,
      dmgMul: 1.8,
      kind: "single",
      desc: "+80% spell damage.",
    },
    {
      id: "rs_storm",
      name: "Glyph Storm",
      icon: "🌩️",
      mp: 22,
      cd: 11,
      dmgMul: 1.4,
      kind: "aoe",
      radius: 4.0,
      desc: "Lightning runes in a 4m circle.",
    },
    {
      id: "rs_mend",
      name: "Mending Rune",
      icon: "💚",
      mp: 18,
      cd: 14,
      dmgMul: 0,
      kind: "heal",
      heal: 80,
      desc: "Restore 80 HP instantly.",
    },
  ],
  warlock: [
    {
      id: "wl_bolt",
      name: "Shadow Bolt",
      icon: "🩻",
      mp: 4,
      cd: 0,
      dmgMul: 1.2,
      kind: "single",
      desc: "Cursed bolt of dark energy.",
    },
    {
      id: "wl_curse",
      name: "Soul Drain",
      icon: "💀",
      mp: 12,
      cd: 6,
      dmgMul: 1.6,
      kind: "single",
      desc: "Drains 60% damage as health.",
    },
    {
      id: "wl_void",
      name: "Voidstorm",
      icon: "🌀",
      mp: 24,
      cd: 13,
      dmgMul: 1.6,
      kind: "aoe",
      radius: 4.5,
      desc: "Tear reality in a 4.5m circle.",
    },
    {
      id: "wl_pact",
      name: "Dark Pact",
      icon: "🦇",
      mp: 14,
      cd: 25,
      dmgMul: 0,
      kind: "buff",
      buffAtk: 1.8,
      buffDur: 7,
      desc: "+80% attack for 7s.",
    },
  ],
};
