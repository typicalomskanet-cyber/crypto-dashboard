import type { PlayerState, StatBlock, ClassDef, EquipmentItem } from '../types';
import { ZERO_STATS } from '../types';
import { getClass } from '../data/races';
import { getItem } from '../data/items';
import { BUILDINGS } from '../data/buildings';

export function xpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

export function levelStats(cls: ClassDef, level: number): StatBlock {
  const l = Math.max(1, level) - 1;
  return {
    hp: cls.baseStats.hp + cls.perLevel.hp * l,
    mp: cls.baseStats.mp + cls.perLevel.mp * l,
    atk: cls.baseStats.atk + cls.perLevel.atk * l,
    def: cls.baseStats.def + cls.perLevel.def * l,
    matk: cls.baseStats.matk + cls.perLevel.matk * l,
    mdef: cls.baseStats.mdef + cls.perLevel.mdef * l,
    crit: cls.baseStats.crit + cls.perLevel.crit * l,
    speed: cls.baseStats.speed + cls.perLevel.speed * l,
  };
}

function addStats(a: StatBlock, b: Partial<StatBlock>): StatBlock {
  return {
    hp: a.hp + (b.hp ?? 0),
    mp: a.mp + (b.mp ?? 0),
    atk: a.atk + (b.atk ?? 0),
    def: a.def + (b.def ?? 0),
    matk: a.matk + (b.matk ?? 0),
    mdef: a.mdef + (b.mdef ?? 0),
    crit: a.crit + (b.crit ?? 0),
    speed: a.speed + (b.speed ?? 0),
  };
}

export function totalStats(p: PlayerState): StatBlock {
  const cls = getClass(p.classId);
  let s: StatBlock = cls ? levelStats(cls, p.level) : { ...ZERO_STATS };
  for (const equippedId of Object.values(p.equipped)) {
    if (!equippedId) continue;
    const it = getItem(equippedId);
    if (it && it.kind === 'equipment') {
      s = addStats(s, (it as EquipmentItem).stats);
    }
  }
  // City buffs: each building applies its passive.
  for (const placed of p.city) {
    const b = BUILDINGS.find((x) => x.id === placed.buildingId);
    if (b) s = addStats(s, b.providesBuff);
  }
  return s;
}
