import type { EnemyDef } from '../types';

export const ENEMIES: EnemyDef[] = [
  {
    id: 'e_goblin',
    name: 'Goblin Scout',
    level: 1,
    color: '#6fa85c',
    stats: {
      hp: 60,
      mp: 0,
      atk: 6,
      def: 3,
      matk: 0,
      mdef: 1,
      crit: 0.02,
      speed: 2.5,
    },
    xpReward: 30,
    lootTable: [
      { itemId: 'mat_leather', chance: 0.7, min: 1, max: 2 },
      { itemId: 'mat_wood', chance: 0.4, min: 1, max: 3 },
      { itemId: 'potion_hp_s', chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: 'e_wolf',
    name: 'Dire Wolf',
    level: 3,
    color: '#5a5a5a',
    stats: {
      hp: 110,
      mp: 0,
      atk: 11,
      def: 5,
      matk: 0,
      mdef: 2,
      crit: 0.05,
      speed: 3.2,
    },
    xpReward: 70,
    lootTable: [
      { itemId: 'mat_leather', chance: 0.85, min: 1, max: 3 },
      { itemId: 'mat_iron', chance: 0.25, min: 1, max: 1 },
    ],
  },
  {
    id: 'e_orc_raider',
    name: 'Orcish Raider',
    level: 5,
    color: '#3e6a28',
    stats: {
      hp: 180,
      mp: 20,
      atk: 16,
      def: 8,
      matk: 0,
      mdef: 4,
      crit: 0.04,
      speed: 2.8,
    },
    xpReward: 140,
    lootTable: [
      { itemId: 'mat_iron', chance: 0.8, min: 1, max: 3 },
      { itemId: 'mat_mana', chance: 0.15, min: 1, max: 1 },
      { itemId: 'wpn_short_sword', chance: 0.1, min: 1, max: 1 },
    ],
  },
  {
    id: 'e_shade',
    name: 'Shadow Wraith',
    level: 8,
    color: '#5a2a8a',
    stats: {
      hp: 260,
      mp: 60,
      atk: 18,
      def: 6,
      matk: 20,
      mdef: 10,
      crit: 0.07,
      speed: 3.0,
    },
    xpReward: 260,
    lootTable: [
      { itemId: 'mat_shadow', chance: 0.6, min: 1, max: 1 },
      { itemId: 'mat_mana', chance: 0.5, min: 1, max: 2 },
      { itemId: 'potion_mp_s', chance: 0.3, min: 1, max: 1 },
    ],
  },
];

export function getEnemy(id: string): EnemyDef | undefined {
  return ENEMIES.find((e) => e.id === id);
}
