import type { StatBlock, SkillDef, Element } from '../types';
import { rand } from '../utils/rng';

export interface DamageResult {
  amount: number;
  crit: boolean;
  element: Element;
}

function resistFor(element: Element, def: StatBlock): number {
  // Physical uses .def, everything else uses .mdef.
  return element === 'physical' ? def.def : def.mdef;
}

function basePower(element: Element, atk: StatBlock): number {
  return element === 'physical' ? atk.atk : atk.matk;
}

export function computeDamage(
  attacker: StatBlock,
  defender: StatBlock,
  skill: SkillDef | null,
  rng: () => number = rand,
): DamageResult {
  const element: Element = skill?.element ?? 'physical';
  const mul = skill?.damageMul ?? 1;
  const power = basePower(element, attacker) * mul;
  const mitigation = resistFor(element, defender);
  const raw = power * (100 / (100 + Math.max(0, mitigation)));
  const variance = 0.85 + rng() * 0.3; // ±15%
  let dmg = raw * variance;
  const crit = rng() < attacker.crit;
  if (crit) dmg *= 1.8;
  return { amount: Math.max(1, Math.round(dmg)), crit, element };
}

export function autoAttackInterval(speed: number): number {
  // Attacks per second scale with speed. Floor ≥ 1 attack / 2s, ceil ≤ 5/s.
  const aps = Math.min(5, Math.max(0.5, speed / 3));
  return 1 / aps;
}
