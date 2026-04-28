import type { BuildingDef } from '../types';

// City-building unlocked at level 10. Each building grants a small passive buff.
export const BUILDINGS: BuildingDef[] = [
  {
    id: 'bld_keep',
    name: 'Stone Keep',
    description: 'Your city core. Grants bonus HP.',
    color: '#8a8a8a',
    size: [2, 2],
    cost: [
      { itemId: 'mat_iron', count: 10 },
      { itemId: 'mat_wood', count: 10 },
    ],
    providesBuff: { hp: 50, def: 4 },
  },
  {
    id: 'bld_smithy',
    name: 'Smithy',
    description: 'Improves weapon forging. Bonus attack power.',
    color: '#c76f3a',
    size: [1, 1],
    cost: [
      { itemId: 'mat_iron', count: 6 },
      { itemId: 'mat_wood', count: 3 },
    ],
    providesBuff: { atk: 5 },
  },
  {
    id: 'bld_arcanum',
    name: 'Arcanum',
    description: 'Mystical library. Bonus magic power and mana.',
    color: '#7a5bd9',
    size: [1, 1],
    cost: [
      { itemId: 'mat_mana', count: 4 },
      { itemId: 'mat_wood', count: 4 },
    ],
    providesBuff: { matk: 4, mp: 20 },
  },
  {
    id: 'bld_barracks',
    name: 'Barracks',
    description: 'Train defenders. Bonus defense.',
    color: '#5d7a4a',
    size: [2, 1],
    cost: [
      { itemId: 'mat_iron', count: 4 },
      { itemId: 'mat_leather', count: 4 },
    ],
    providesBuff: { def: 6 },
  },
  {
    id: 'bld_shrine',
    name: 'Devil Shrine',
    description: 'Channel dark power. Crit chance bonus.',
    color: '#b02a4a',
    size: [1, 1],
    cost: [
      { itemId: 'mat_shadow', count: 2 },
      { itemId: 'mat_mana', count: 3 },
    ],
    providesBuff: { crit: 0.03 },
  },
];

export const CITY_GRID_SIZE = 10;

export function getBuilding(id: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
