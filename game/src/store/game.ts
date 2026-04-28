import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlayerState,
  RaceId,
  EquipSlot,
  InventoryStack,
  SkillDef,
  LootboxTier,
  Recipe,
  PlacedBuilding,
  StatBlock,
  Item,
} from '../types';
import { ZERO_STATS } from '../types';
import { getClass } from '../data/races';
import { getItem, ITEMS } from '../data/items';
import { ENEMIES, getEnemy } from '../data/enemies';
import { RECIPES } from '../data/recipes';
import { LOOTBOXES, rarityRank } from '../data/lootbox';
import { getBuilding, CITY_GRID_SIZE } from '../data/buildings';
import { computeDamage } from '../game/combat';
import { levelStats, totalStats, xpToNext } from '../game/stats';
import { pickWeighted, randRange } from '../utils/rng';

export type Screen =
  | 'title'
  | 'raceSelect'
  | 'world'
  | 'inventory'
  | 'crafting'
  | 'lootboxes'
  | 'city';

export interface CombatState {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyDefId: string;
  playerAtkTimer: number;
  enemyAtkTimer: number;
  skillCooldowns: Record<string, number>;
  log: CombatLogLine[];
}

export interface CombatLogLine {
  text: string;
  kind: 'player' | 'enemy' | 'system' | 'crit' | 'loot';
  ts: number;
}

export interface FloatingText {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  born: number;
}

export interface GameState {
  screen: Screen;
  player: PlayerState | null;
  combat: CombatState | null;
  floatingTexts: FloatingText[];
  lastTick: number;
  tickRaf: number | null;
  selectedRace: RaceId | null;
  selectedClassId: string | null;

  // actions
  setScreen: (s: Screen) => void;
  selectRace: (r: RaceId) => void;
  selectClass: (id: string) => void;
  startGame: () => void;
  resetAll: () => void;

  movePlayer: (x: number, z: number) => void;

  engageEnemy: (enemyId: string) => void;
  disengage: () => void;
  tick: (dt: number) => void;
  castSkill: (skillId: string) => void;
  consumeItem: (itemId: string) => void;

  equip: (itemId: string) => void;
  unequip: (slot: EquipSlot) => void;

  craft: (recipeId: string) => void;
  openLootbox: (tierId: string) => { itemId: string } | null;

  placeBuilding: (buildingId: string, x: number, y: number) => boolean;
  removeBuildingAt: (x: number, y: number) => void;

  addLog: (line: Omit<CombatLogLine, 'ts'>) => void;
  addFloatingText: (text: string, color: string, x: number, y: number) => void;
}

function createPlayer(raceId: RaceId, classId: string): PlayerState {
  const cls = getClass(classId);
  const base = cls ? levelStats(cls, 1) : { ...ZERO_STATS };
  return {
    raceId,
    classId,
    level: 1,
    xp: 0,
    hp: base.hp,
    mp: base.mp,
    gold: 500,
    pos: { x: 0, z: 0 },
    inventory: [
      { itemId: 'potion_hp_s', count: 5 },
      { itemId: 'potion_mp_s', count: 3 },
      { itemId: 'mat_iron', count: 3 },
      { itemId: 'mat_wood', count: 3 },
      { itemId: 'mat_leather', count: 2 },
    ],
    equipped: {},
    pityCounter: 0,
    city: [],
  };
}

function hasItems(inv: InventoryStack[], needs: InventoryStack[]): boolean {
  for (const n of needs) {
    const s = inv.find((i) => i.itemId === n.itemId);
    if (!s || s.count < n.count) return false;
  }
  return true;
}

function consumeItems(inv: InventoryStack[], needs: InventoryStack[]): InventoryStack[] {
  const next = inv.map((s) => ({ ...s }));
  for (const n of needs) {
    const s = next.find((i) => i.itemId === n.itemId);
    if (!s) continue;
    s.count -= n.count;
  }
  return next.filter((s) => s.count > 0);
}

function addItem(inv: InventoryStack[], itemId: string, count: number): InventoryStack[] {
  const next = inv.map((s) => ({ ...s }));
  const s = next.find((i) => i.itemId === itemId);
  if (s) {
    s.count += count;
  } else {
    next.push({ itemId, count });
  }
  return next;
}

let floatingTextId = 1;

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'title',
      player: null,
      combat: null,
      floatingTexts: [],
      lastTick: 0,
      tickRaf: null,
      selectedRace: null,
      selectedClassId: null,

      setScreen: (s) => set({ screen: s }),

      selectRace: (r) => set({ selectedRace: r, selectedClassId: null }),
      selectClass: (id) => set({ selectedClassId: id }),

      startGame: () => {
        const { selectedRace, selectedClassId } = get();
        if (!selectedRace || !selectedClassId) return;
        set({
          player: createPlayer(selectedRace, selectedClassId),
          combat: null,
          screen: 'world',
        });
      },

      resetAll: () =>
        set({
          player: null,
          combat: null,
          screen: 'title',
          selectedRace: null,
          selectedClassId: null,
          floatingTexts: [],
        }),

      movePlayer: (x, z) => {
        const p = get().player;
        if (!p) return;
        set({ player: { ...p, pos: { x, z } } });
      },

      engageEnemy: (enemyId) => {
        const p = get().player;
        if (!p) return;
        const def = getEnemy(enemyId);
        if (!def) return;
        // Scale enemy HP slightly with difficulty.
        const hp = Math.round(def.stats.hp);
        set({
          combat: {
            enemyId: def.id + '_' + Date.now(),
            enemyDefId: def.id,
            enemyHp: hp,
            enemyMaxHp: hp,
            playerAtkTimer: 0,
            enemyAtkTimer: 0.5,
            skillCooldowns: {},
            log: [
              {
                text: `A ${def.name} (Lv.${def.level}) appears!`,
                kind: 'system',
                ts: Date.now(),
              },
            ],
          },
        });
      },

      disengage: () => set({ combat: null }),

      tick: (dt) => {
        const state = get();
        const p = state.player;
        const c = state.combat;
        // Expire floating texts older than 1s
        const now = Date.now();
        const ft = state.floatingTexts.filter((t) => now - t.born < 1000);
        if (ft.length !== state.floatingTexts.length) set({ floatingTexts: ft });

        if (!p || !c) return;
        const def = getEnemy(c.enemyDefId);
        if (!def) return;

        const pStats = totalStats(p);
        // Countdown cooldowns
        const cds: Record<string, number> = {};
        for (const [k, v] of Object.entries(c.skillCooldowns)) {
          const nv = v - dt;
          if (nv > 0) cds[k] = nv;
        }

        let enemyHp = c.enemyHp;
        let playerHp = p.hp;
        const playerMp = p.mp;
        let playerAtkTimer = c.playerAtkTimer - dt;
        let enemyAtkTimer = c.enemyAtkTimer - dt;
        const newLog = [...c.log];
        let xpGain = 0;
        const pityCounter = p.pityCounter;
        const loot: InventoryStack[] = [];
        let level = p.level;
        let xp = p.xp;
        let gold = p.gold;

        // Auto-attack rates.
        const pInterval = 1 / Math.max(0.3, pStats.speed / 3);
        const eInterval = 1 / Math.max(0.3, def.stats.speed / 3);

        if (playerAtkTimer <= 0 && enemyHp > 0) {
          const dmg = computeDamage(pStats, def.stats, null);
          enemyHp -= dmg.amount;
          get().addFloatingText(
            String(dmg.amount),
            dmg.crit ? '#ffd84d' : '#ffffff',
            0,
            0,
          );
          newLog.push({
            text: `You hit ${def.name} for ${dmg.amount}${dmg.crit ? ' (crit!)' : ''}.`,
            kind: dmg.crit ? 'crit' : 'player',
            ts: now,
          });
          playerAtkTimer = pInterval;
        }

        if (enemyHp <= 0) {
          newLog.push({
            text: `${def.name} defeated! +${def.xpReward} XP`,
            kind: 'system',
            ts: now,
          });
          xpGain += def.xpReward;
          gold += 5 * def.level + randRange(0, 5);
          for (const entry of def.lootTable) {
            if (Math.random() < entry.chance) {
              const qty = randRange(entry.min, entry.max);
              loot.push({ itemId: entry.itemId, count: qty });
              newLog.push({
                text: `Loot: ${qty} × ${ITEMS[entry.itemId]?.name ?? entry.itemId}`,
                kind: 'loot',
                ts: now,
              });
            }
          }
          // Merge loot into inventory.
          let inv = p.inventory;
          for (const l of loot) inv = addItem(inv, l.itemId, l.count);
          xp += xpGain;
          while (xp >= xpToNext(level) && level < 99) {
            xp -= xpToNext(level);
            level += 1;
            newLog.push({
              text: `Level up! You are now level ${level}.`,
              kind: 'system',
              ts: now,
            });
          }
          const cls = getClass(p.classId);
          const lvlStats = cls ? levelStats(cls, level) : pStats;
          set({
            player: {
              ...p,
              hp: Math.min(totalStatsWith(p, lvlStats).hp, playerHp),
              mp: playerMp,
              xp,
              level,
              gold,
              inventory: inv,
              pityCounter,
            },
            combat: null,
          });
          return;
        }

        if (enemyAtkTimer <= 0 && playerHp > 0) {
          const dmg = computeDamage(def.stats, pStats, null);
          playerHp -= dmg.amount;
          get().addFloatingText(
            '-' + dmg.amount,
            dmg.crit ? '#ff6060' : '#ff9090',
            0.4,
            0.6,
          );
          newLog.push({
            text: `${def.name} hits you for ${dmg.amount}${dmg.crit ? ' (crit!)' : ''}.`,
            kind: dmg.crit ? 'crit' : 'enemy',
            ts: now,
          });
          enemyAtkTimer = eInterval;
        }

        if (playerHp <= 0) {
          newLog.push({
            text: `You have fallen. Respawning at the starting shrine.`,
            kind: 'system',
            ts: now,
          });
          const cls = getClass(p.classId);
          const lvlStats = cls ? levelStats(cls, p.level) : pStats;
          set({
            player: {
              ...p,
              hp: Math.round(lvlStats.hp * 0.5),
              mp: Math.round(lvlStats.mp * 0.5),
              pos: { x: 0, z: 0 },
            },
            combat: null,
          });
          return;
        }

        set({
          player: { ...p, hp: playerHp, mp: playerMp },
          combat: {
            ...c,
            enemyHp,
            playerAtkTimer,
            enemyAtkTimer,
            skillCooldowns: cds,
            log: newLog.slice(-30),
          },
        });
      },

      castSkill: (skillId) => {
        const state = get();
        const p = state.player;
        const c = state.combat;
        if (!p || !c) return;
        const cls = getClass(p.classId);
        if (!cls) return;
        const skill: SkillDef | undefined = cls.skills.find((s) => s.id === skillId);
        if (!skill) return;
        if ((c.skillCooldowns[skillId] ?? 0) > 0) return;
        if (p.mp < skill.mpCost) return;
        const def = getEnemy(c.enemyDefId);
        if (!def) return;
        const pStats = totalStats(p);
        const dmg = computeDamage(pStats, def.stats, skill);
        const enemyHp = c.enemyHp - dmg.amount;
        state.addFloatingText(
          String(dmg.amount),
          dmg.crit ? '#ffd84d' : '#a0e0ff',
          0,
          0,
        );
        set({
          player: { ...p, mp: p.mp - skill.mpCost },
          combat: {
            ...c,
            enemyHp,
            skillCooldowns: { ...c.skillCooldowns, [skillId]: skill.cooldown },
            log: [
              ...c.log,
              {
                text: `You cast ${skill.name} for ${dmg.amount}${dmg.crit ? ' (crit!)' : ''}.`,
                kind: (dmg.crit ? 'crit' : 'player') as CombatLogLine['kind'],
                ts: Date.now(),
              },
            ].slice(-30),
          },
        });
      },

      consumeItem: (itemId) => {
        const p = get().player;
        if (!p) return;
        const it = getItem(itemId);
        if (!it || it.kind !== 'consumable') return;
        const stack = p.inventory.find((s) => s.itemId === itemId);
        if (!stack || stack.count < 1) return;
        const cls = getClass(p.classId);
        const stats = cls ? totalStats(p) : null;
        const maxHp = stats?.hp ?? p.hp;
        const maxMp = stats?.mp ?? p.mp;
        const hp = Math.min(maxHp, p.hp + (it.restoreHp ?? 0));
        const mp = Math.min(maxMp, p.mp + (it.restoreMp ?? 0));
        set({
          player: {
            ...p,
            hp,
            mp,
            inventory: consumeItems(p.inventory, [{ itemId, count: 1 }]),
          },
        });
      },

      equip: (itemId) => {
        const p = get().player;
        if (!p) return;
        const it = getItem(itemId);
        if (!it || it.kind !== 'equipment') return;
        if (it.levelReq > p.level) return;
        const prev = p.equipped[it.slot];
        const equipped = { ...p.equipped, [it.slot]: itemId };
        // Remove one from inventory, put previous back.
        let inv = consumeItems(p.inventory, [{ itemId, count: 1 }]);
        if (prev) inv = addItem(inv, prev, 1);
        set({ player: { ...p, equipped, inventory: inv } });
      },

      unequip: (slot) => {
        const p = get().player;
        if (!p) return;
        const prev = p.equipped[slot];
        if (!prev) return;
        const equipped = { ...p.equipped };
        delete equipped[slot];
        const inv = addItem(p.inventory, prev, 1);
        set({ player: { ...p, equipped, inventory: inv } });
      },

      craft: (recipeId) => {
        const p = get().player;
        if (!p) return;
        const r: Recipe | undefined = RECIPES.find((x) => x.id === recipeId);
        if (!r) return;
        if (p.level < r.requiredLevel) return;
        if (!hasItems(p.inventory, r.inputs)) return;
        let inv = consumeItems(p.inventory, r.inputs);
        inv = addItem(inv, r.result.itemId, r.result.count);
        set({ player: { ...p, inventory: inv } });
      },

      openLootbox: (tierId) => {
        const p = get().player;
        if (!p) return null;
        const tier: LootboxTier | undefined = LOOTBOXES.find((t) => t.id === tierId);
        if (!tier) return null;
        if (p.gold < tier.cost) return null;

        const roll = pickWeighted(
          tier.drops.map((d) => ({ value: d.itemId, weight: d.weight })),
        );
        let itemId = roll;
        // Pity: if counter exceeds tier.pity and rolled item < epic, upgrade.
        const rolled = ITEMS[roll];
        const pityTriggered =
          p.pityCounter + 1 >= tier.pity && rarityRank(rolled.rarity) < 3;
        if (pityTriggered) {
          // Pick highest-rarity item in tier.
          const best = tier.drops
            .map((d) => ({ id: d.itemId, r: rarityRank(ITEMS[d.itemId].rarity) }))
            .sort((a, b) => b.r - a.r)[0];
          if (best) itemId = best.id;
        }
        const pity = pityTriggered || rarityRank(ITEMS[itemId].rarity) >= 3 ? 0 : p.pityCounter + 1;
        const inv = addItem(p.inventory, itemId, 1);
        set({
          player: { ...p, gold: p.gold - tier.cost, inventory: inv, pityCounter: pity },
        });
        return { itemId };
      },

      placeBuilding: (buildingId, x, y) => {
        const p = get().player;
        if (!p) return false;
        if (p.level < 10) return false;
        const b = getBuilding(buildingId);
        if (!b) return false;
        // Bounds check
        if (x < 0 || y < 0 || x + b.size[0] > CITY_GRID_SIZE || y + b.size[1] > CITY_GRID_SIZE)
          return false;
        // Overlap check
        for (const placed of p.city) {
          const pb = getBuilding(placed.buildingId);
          if (!pb) continue;
          const ax1 = placed.x;
          const ay1 = placed.y;
          const ax2 = placed.x + pb.size[0];
          const ay2 = placed.y + pb.size[1];
          const bx1 = x;
          const by1 = y;
          const bx2 = x + b.size[0];
          const by2 = y + b.size[1];
          const overlap = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
          if (overlap) return false;
        }
        if (!hasItems(p.inventory, b.cost)) return false;
        const inv = consumeItems(p.inventory, b.cost);
        const placed: PlacedBuilding = { buildingId, x, y };
        set({ player: { ...p, inventory: inv, city: [...p.city, placed] } });
        return true;
      },

      removeBuildingAt: (x, y) => {
        const p = get().player;
        if (!p) return;
        const idx = p.city.findIndex((placed) => {
          const b = getBuilding(placed.buildingId);
          if (!b) return false;
          return (
            x >= placed.x &&
            x < placed.x + b.size[0] &&
            y >= placed.y &&
            y < placed.y + b.size[1]
          );
        });
        if (idx < 0) return;
        const city = p.city.filter((_, i) => i !== idx);
        set({ player: { ...p, city } });
      },

      addLog: (line) => {
        const c = get().combat;
        if (!c) return;
        set({ combat: { ...c, log: [...c.log, { ...line, ts: Date.now() }].slice(-30) } });
      },

      addFloatingText: (text, color, x, y) => {
        const id = floatingTextId++;
        const ft: FloatingText = { id, text, color, x, y, born: Date.now() };
        set((s) => ({ floatingTexts: [...s.floatingTexts, ft].slice(-10) }));
      },
    }),
    {
      name: 'codg-save-v1',
      partialize: (s) => ({
        player: s.player,
        selectedRace: s.selectedRace,
        selectedClassId: s.selectedClassId,
        screen: s.screen === 'title' ? 'title' : s.player ? 'world' : 'title',
      }),
    },
  ),
);

// Helper needed inside the store: compute total stats with overriden class stats.
function totalStatsWith(p: PlayerState, classStats: StatBlock): StatBlock {
  // Start from passed-in class stats (already leveled), add equipment + buildings.
  let s = { ...classStats };
  for (const id of Object.values(p.equipped)) {
    if (!id) continue;
    const it: Item | undefined = getItem(id);
    if (it && it.kind === 'equipment') {
      s = {
        hp: s.hp + (it.stats.hp ?? 0),
        mp: s.mp + (it.stats.mp ?? 0),
        atk: s.atk + (it.stats.atk ?? 0),
        def: s.def + (it.stats.def ?? 0),
        matk: s.matk + (it.stats.matk ?? 0),
        mdef: s.mdef + (it.stats.mdef ?? 0),
        crit: s.crit + (it.stats.crit ?? 0),
        speed: s.speed + (it.stats.speed ?? 0),
      };
    }
  }
  for (const placed of p.city) {
    const b = getBuilding(placed.buildingId);
    if (!b) continue;
    s = {
      hp: s.hp + (b.providesBuff.hp ?? 0),
      mp: s.mp + (b.providesBuff.mp ?? 0),
      atk: s.atk + (b.providesBuff.atk ?? 0),
      def: s.def + (b.providesBuff.def ?? 0),
      matk: s.matk + (b.providesBuff.matk ?? 0),
      mdef: s.mdef + (b.providesBuff.mdef ?? 0),
      crit: s.crit + (b.providesBuff.crit ?? 0),
      speed: s.speed + (b.providesBuff.speed ?? 0),
    };
  }
  return s;
}

export const ENEMIES_ALL = ENEMIES;
