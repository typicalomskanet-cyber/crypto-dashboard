import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import type {
  ClassId,
  Equipment,
  InventoryStack,
  Player,
  PlayerStats,
  RaceId,
  Slot,
  PlacedBuilding,
  Screen,
  ItemDef,
} from "./types";
import { xpForLevel } from "./types";
import { CLASSES, RACES } from "./data/races";
import { ITEM_BY_ID, ITEMS } from "./data/items";
import { RECIPES } from "./data/recipes";
import { LOOTBOXES } from "./data/lootboxes";
import { MOBS } from "./data/mobs";
import { BUILDINGS } from "./data/buildings";
import { Joystick } from "./ui/Joystick";
import {
  InventoryPanel,
  CraftingPanel,
  LootboxPanel,
  VendorPanel,
  EnchantPanel,
  ENCHANT_CHANCE,
} from "./ui/Panels";
import { SkillBar } from "./ui/SkillBar";
import { MiniMap } from "./ui/MiniMap";
import { SKILLS_BY_CLASS, type SkillDef } from "./data/skills";
import type { CameraMode, MobInstance } from "./three/World";

// Lazy-load heavy 3D modules so initial paint stays small.
const RaceSelect = lazy(() => import("./three/RaceSelect"));
const World = lazy(() => import("./three/World"));
const CityBuilder = lazy(() => import("./three/CityBuilder"));

const SAVE_KEY = "cdg3d_save_v1";

function buildPlayer(name: string, race: RaceId, cls: ClassId): Player {
  const r = RACES.find(x => x.id === race)!;
  const c = CLASSES.find(x => x.id === cls)!;
  const hpMax = r.bonus.hp + c.baseHp;
  const mpMax = r.bonus.mp + c.baseMp;
  return {
    name,
    race,
    cls,
    level: 1,
    xp: 0,
    gold: 50,
    stats: {
      hp: hpMax,
      hpMax,
      mp: mpMax,
      mpMax,
      atk: r.bonus.atk + c.baseAtk,
      def: r.bonus.def + c.baseDef,
      crit: r.bonus.crit + c.baseCrit,
    },
    pos: [0, 0, 0],
    rotY: 0,
    inventory: [
      { itemId: "scrap_iron", qty: 4 },
      { itemId: "hide_rough", qty: 3 },
    ],
    equipment: {},
    unlockedRecipes: RECIPES.filter(r => r.minLevel === 1).map(r => r.id),
    unlockedClasses: r.startingClasses,
    city: [],
  };
}

function applyEquipment(
  stats: PlayerStats,
  equipment: Equipment,
  enchant?: Record<string, number>,
): PlayerStats {
  const out = { ...stats };
  for (const [slot, id] of Object.entries(equipment)) {
    if (!id) continue;
    const it = ITEM_BY_ID.get(id);
    if (!it?.stats) continue;
    const lvl = enchant?.[id] ?? 0;
    // +5% per enchant level. Weapon → atk; armor/helm/etc → def & hp.
    const atkMul = slot === "weapon" ? 1 + lvl * 0.05 : 1;
    const defHpMul = slot === "weapon" ? 1 : 1 + lvl * 0.05;
    out.atk += Math.round((it.stats.atk ?? 0) * atkMul);
    out.def += Math.round((it.stats.def ?? 0) * defHpMul);
    out.hpMax += Math.round((it.stats.hp ?? 0) * defHpMul);
    out.mpMax += it.stats.mp ?? 0;
    out.crit += it.stats.crit ?? 0;
  }
  // clamp current hp/mp to max
  out.hp = Math.min(out.hp, out.hpMax);
  out.mp = Math.min(out.mp, out.mpMax);
  return out;
}

function spawnMobs(level: number): MobInstance[] {
  const eligible = MOBS.filter(m => m.level <= level + 3);
  const out: MobInstance[] = [];
  let id = 1;
  for (const def of eligible) {
    const count = def.bossy ? 1 : Math.max(2, 5 - Math.abs(def.level - level));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 14;
      const pos: [number, number, number] = [Math.cos(angle) * r, 0, Math.sin(angle) * r];
      out.push({
        uid: `m-${def.id}-${id++}`,
        defId: def.id,
        pos,
        home: pos,
        hp: def.hp,
        aggro: false,
      });
    }
  }
  return out;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("raceSelect");
  const [player, setPlayer] = useState<Player | null>(null);
  const [mobs, setMobs] = useState<MobInstance[]>([]);
  const [selectedMob, setSelectedMob] = useState<string | null>(null);
  const [movementInput, setMovementInput] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [overlay, setOverlay] = useState<
    "inventory" | "crafting" | "lootbox" | "vendor" | "enchant" | null
  >(null);
  const [log, setLog] = useState<{ msg: string; ts: number }[]>([]);
  const [lastDrop, setLastDrop] = useState<ItemDef | null>(null);
  const [selectedBuildDef, setSelectedBuildDef] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("thirdPerson");
  const [zoom, setZoom] = useState(0.45);
  /** Map skill.id → cooldown-end timestamp (ms). */
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  /** Active buff (atk multiplier) from a Heroic Cry / Bloodlust style skill. */
  const [buff, setBuff] = useState<{ skillId: string; mul: number; until: number } | null>(null);
  /** Player world position (x, z) — fed by World useFrame for the minimap. */
  const [playerXZ, setPlayerXZ] = useState<[number, number]>([0, 0]);

  const pushLog = useCallback((msg: string) => {
    setLog(prev => [{ msg, ts: Date.now() }, ...prev].slice(0, 8));
  }, []);

  // === Load on mount ===
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.player) {
        setPlayer(data.player);
        setMobs(spawnMobs(data.player.level));
        setScreen("world");
      }
    } catch {
      /* ignore corrupt saves */
    }
  }, []);

  // === Autosave ===
  useEffect(() => {
    if (!player) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ player, ts: Date.now() }));
      } catch {
        /* quota exceeded — ignore */
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [player]);

  // === Effective stats include equipment ===
  // We deliberately depend on `buff` so that re-cooking attacks happens when a
  // buff is granted; the actual time-decay is handled in the attack handler.
  const effectiveStats = useMemo(
    () => {
      if (!player) return null;
      const base = applyEquipment(player.stats, player.equipment, player.enchant);
      if (buff && buff.until > Date.now()) {
        return { ...base, atk: Math.floor(base.atk * buff.mul) };
      }
      return base;
    },
    [player, buff],
  );

  // === Smithy discount + max-hp from buildings ===
  const cityBoosts = useMemo(() => {
    const c = player?.city ?? [];
    return {
      smithyDiscount: c.filter(b => b.defId === "smithy").length * 0.1,
      hpBoost: c.filter(b => b.defId === "barracks").length * 20,
      mpBoost: c.filter(b => b.defId === "temple").length * 15,
      goldRate:
        c.filter(b => b.defId === "house").length * 1 +
        c.filter(b => b.defId === "farm").length * 2,
      vendorBonus: c.some(b => b.defId === "market") ? 0.1 : 0,
    };
  }, [player]);

  // Apply hp/mp boosts to the live stats once the player exists.
  useEffect(() => {
    if (!player) return;
    setPlayer(p => {
      if (!p) return p;
      const baseRace = RACES.find(r => r.id === p.race)!;
      const baseCls = CLASSES.find(c => c.id === p.cls)!;
      const trueHpMax =
        baseRace.bonus.hp + baseCls.baseHp + (p.level - 1) * 18 + cityBoosts.hpBoost;
      const trueMpMax =
        baseRace.bonus.mp + baseCls.baseMp + (p.level - 1) * 6 + cityBoosts.mpBoost;
      if (p.stats.hpMax === trueHpMax && p.stats.mpMax === trueMpMax) return p;
      return {
        ...p,
        stats: {
          ...p.stats,
          hpMax: trueHpMax,
          mpMax: trueMpMax,
          hp: Math.min(p.stats.hp, trueHpMax),
          mp: Math.min(p.stats.mp, trueMpMax),
        },
      };
    });
  }, [cityBoosts.hpBoost, cityBoosts.mpBoost, player]);

  // === Gold tick from city ===
  useEffect(() => {
    if (!player) return;
    if (cityBoosts.goldRate <= 0) return;
    const iv = setInterval(() => {
      setPlayer(p => (p ? { ...p, gold: p.gold + cityBoosts.goldRate } : p));
      pushLog(`+${cityBoosts.goldRate} gold from settlement`);
    }, 60 * 1000);
    return () => clearInterval(iv);
  }, [cityBoosts.goldRate, player]);

  // === Mob AI tick (every 250ms) ===
  useEffect(() => {
    if (screen !== "world" || !player) return;
    const iv = setInterval(() => {
      setMobs(prev =>
        prev.map(m => {
          if (m.deadUntil) {
            if (m.deadUntil < Date.now()) {
              const def = MOBS.find(d => d.id === m.defId)!;
              return {
                ...m,
                hp: def.hp,
                pos: m.home,
                aggro: false,
                deadUntil: undefined,
              };
            }
            return m;
          }
          // chase if player close
          const dx = (player.pos?.[0] ?? 0) - m.pos[0];
          const dz = (player.pos?.[2] ?? 0) - m.pos[2];
          const dist = Math.hypot(dx, dz);
          const def = MOBS.find(d => d.id === m.defId)!;
          const aggroR = def.bossy ? 5 : 4;
          if (dist < aggroR && dist > 0.05) {
            const speed = def.bossy ? 1.6 : 2.2;
            const step = (speed * 0.25) / dist;
            const homeDx = m.home[0] - m.pos[0];
            const homeDz = m.home[2] - m.pos[2];
            const distHome = Math.hypot(homeDx, homeDz);
            // Don't roam more than 8 units from home
            if (distHome < 8) {
              return {
                ...m,
                pos: [m.pos[0] + dx * step, m.pos[1], m.pos[2] + dz * step],
                aggro: true,
              };
            }
          }
          return { ...m, aggro: false };
        }),
      );
    }, 250);
    return () => clearInterval(iv);
  }, [screen, player]);

  // === Mob retaliate (every 1s when adjacent) ===
  useEffect(() => {
    if (!player || screen !== "world") return;
    const iv = setInterval(() => {
      setPlayer(p => {
        if (!p) return p;
        const stats = applyEquipment(p.stats, p.equipment, p.enchant);
        let dmg = 0;
        for (const m of mobs) {
          if (m.deadUntil) continue;
          const def = MOBS.find(d => d.id === m.defId)!;
          const dist = Math.hypot(p.pos[0] - m.pos[0], p.pos[2] - m.pos[2]);
          if (dist < 1.6) {
            const raw = Math.max(1, def.atk - Math.floor(stats.def * 0.6));
            dmg += raw;
          }
        }
        if (dmg <= 0) return p;
        const newHp = Math.max(0, p.stats.hp - dmg);
        if (newHp === 0) {
          pushLog("You fall in battle. The temple revives you.");
          return {
            ...p,
            pos: [0, 0, 0],
            stats: { ...p.stats, hp: Math.floor(stats.hpMax * 0.6) },
            gold: Math.max(0, p.gold - Math.floor(p.gold * 0.1)),
          };
        }
        return { ...p, stats: { ...p.stats, hp: newHp } };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [mobs, player, screen]);

  // === Passive HP / MP regen ===
  useEffect(() => {
    if (!player || screen !== "world") return;
    const iv = setInterval(() => {
      setPlayer(p => {
        if (!p) return p;
        const stats = applyEquipment(p.stats, p.equipment, p.enchant);
        return {
          ...p,
          stats: {
            ...p.stats,
            hp: Math.min(stats.hpMax, p.stats.hp + 4),
            mp: Math.min(stats.mpMax, p.stats.mp + 3),
          },
        };
      });
    }, 1500);
    return () => clearInterval(iv);
  }, [player, screen]);

  // === Attack event handler ===
  useEffect(() => {
    if (!player || !effectiveStats) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{
        uid: string;
        mul?: number;
        aoeRadius?: number;
        skillName?: string;
        drainHeal?: boolean;
      }>).detail;
      let mul = detail.mul ?? 1.0;
      let skillTag = detail.skillName ? ` [${detail.skillName}]` : "";

      // Soulshot / Spirit Shot consumption (Lineage 2-style).
      // Picks first matching shot in inventory; if none, toggle implicitly off.
      if (player.soulshotEnabled || player.spiritShotEnabled) {
        const wantSpirit = (detail.skillName?.toLowerCase().includes("bolt")) || false;
        const kind = wantSpirit && player.spiritShotEnabled
          ? "spirit_shot"
          : player.soulshotEnabled
          ? "soulshot"
          : null;
        if (kind) {
          const stack = player.inventory.find(s => {
            const d = ITEMS.find(i => i.id === s.itemId);
            return d?.consumable === kind;
          });
          if (stack) {
            const d = ITEMS.find(i => i.id === stack.itemId);
            const boost = (d?.amount ?? 50) / 100;
            mul *= 1 + boost;
            skillTag += ` [${d?.icon ?? "🔥"}]`;
            // Consume one shot.
            setPlayer(p => {
              if (!p) return p;
              const inv = p.inventory
                .map(s =>
                  s.itemId === stack.itemId ? { ...s, qty: s.qty - 1 } : s,
                )
                .filter(s => s.qty > 0);
              return { ...p, inventory: inv };
            });
          }
        }
      }
      const damageOne = (_m: MobInstance, def: typeof MOBS[number]) => {
        const isCrit = Math.random() * 100 < effectiveStats.crit;
        const raw = Math.max(1, effectiveStats.atk - Math.floor(def.hp * 0.01));
        const dmg = Math.floor(raw * mul * (isCrit ? 1.8 : 1) * (0.85 + Math.random() * 0.3));
        return { dmg, isCrit };
      };
      setMobs(prev => {
        const next = [...prev];
        const center = prev.find(m => m.uid === detail.uid);
        const targets: number[] = [];
        if (detail.aoeRadius && center) {
          for (let i = 0; i < prev.length; i++) {
            const m = prev[i];
            if (m.deadUntil) continue;
            const d = Math.hypot(m.pos[0] - center.pos[0], m.pos[2] - center.pos[2]);
            if (d <= detail.aoeRadius) targets.push(i);
          }
        } else {
          const i = prev.findIndex(m => m.uid === detail.uid);
          if (i >= 0 && !prev[i].deadUntil) targets.push(i);
        }
        let totalDmg = 0;
        let killed = 0;
        for (const i of targets) {
          const m = next[i];
          const def = MOBS.find(d => d.id === m.defId)!;
          const { dmg, isCrit } = damageOne(m, def);
          totalDmg += dmg;
          const newHp = m.hp - dmg;
          if (newHp <= 0) {
            next[i] = { ...m, hp: 0, deadUntil: Date.now() + 15_000, aggro: false };
            rewardKill(def.id);
            if (selectedMob === m.uid) setSelectedMob(null);
            pushLog(`${def.name} slain${skillTag} — ${isCrit ? "CRIT! " : ""}${dmg} dmg.`);
            killed++;
          } else {
            next[i] = { ...m, hp: newHp, aggro: true };
            if (!detail.aoeRadius) pushLog(`${def.name}: -${dmg}${isCrit ? " (crit)" : ""}${skillTag}`);
          }
        }
        if (detail.aoeRadius && targets.length > 0) {
          pushLog(`${detail.skillName ?? "AoE"} hits ${targets.length} foes for ${totalDmg} total.`);
        }
        // Soul Drain heals 60% of damage dealt back to player.
        if (detail.drainHeal && totalDmg > 0) {
          setPlayer(p => {
            if (!p) return p;
            const stats = applyEquipment(p.stats, p.equipment, p.enchant);
            const heal = Math.floor(totalDmg * 0.6);
            return {
              ...p,
              stats: { ...p.stats, hp: Math.min(stats.hpMax, p.stats.hp + heal) },
            };
          });
        }
        if (killed > 0 && detail.aoeRadius) pushLog(`${killed} foe(s) destroyed.`);
        return next;
      });
    };
    window.addEventListener("cdg:attack", handler as EventListener);
    return () => window.removeEventListener("cdg:attack", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, effectiveStats, selectedMob]);

  // === Cast a skill (keyboard hotkey or click) ===
  const castSkill = useCallback(
    (skill: SkillDef) => {
      if (!player) return;
      const now = Date.now();
      if ((cooldowns[skill.id] ?? 0) > now) return;
      if (player.stats.mp < skill.mp) {
        pushLog(`Not enough MP for ${skill.name}.`);
        return;
      }
      // Deduct mana.
      setPlayer(p =>
        p ? { ...p, stats: { ...p.stats, mp: Math.max(0, p.stats.mp - skill.mp) } } : p,
      );
      if (skill.cd > 0) {
        setCooldowns(c => ({ ...c, [skill.id]: now + skill.cd * 1000 }));
      }
      if (skill.kind === "heal" && skill.heal) {
        setPlayer(p => {
          if (!p) return p;
          const stats = applyEquipment(p.stats, p.equipment, p.enchant);
          return {
            ...p,
            stats: { ...p.stats, hp: Math.min(stats.hpMax, p.stats.hp + skill.heal!) },
          };
        });
        pushLog(`${skill.name} restores ${skill.heal} HP.`);
        return;
      }
      if (skill.kind === "buff" && skill.buffAtk && skill.buffDur) {
        setBuff({ skillId: skill.id, mul: skill.buffAtk, until: now + skill.buffDur * 1000 });
        pushLog(`${skill.name} active for ${skill.buffDur}s.`);
        return;
      }
      // Damage skills require a target; AoE uses selected as center.
      if (!selectedMob) {
        pushLog(`No target for ${skill.name}.`);
        return;
      }
      window.dispatchEvent(
        new CustomEvent("cdg:attack", {
          detail: {
            uid: selectedMob,
            mul: skill.dmgMul,
            aoeRadius: skill.kind === "aoe" ? skill.radius : undefined,
            skillName: skill.name,
            drainHeal: skill.id === "wl_curse",
          },
        }),
      );
    },
    [player, cooldowns, selectedMob, pushLog],
  );

  // === Use HP / MP potion (hotkey 5 / 6) ===
  const usePotion = useCallback(
    (kind: "hp_potion" | "mp_potion") => {
      if (!player) return;
      const cdKey = kind === "hp_potion" ? "potion_hp" : "potion_mp";
      const now = Date.now();
      if ((cooldowns[cdKey] ?? 0) > now) return;
      // Find first matching potion in inventory.
      const stack = player.inventory.find(s => {
        const def = ITEMS.find(i => i.id === s.itemId);
        return def?.consumable === kind;
      });
      if (!stack) {
        pushLog(`No ${kind === "hp_potion" ? "HP" : "MP"} potion to use.`);
        return;
      }
      const def = ITEMS.find(i => i.id === stack.itemId);
      if (!def?.amount) return;
      // Apply.
      setPlayer(p => {
        if (!p) return p;
        const stats = applyEquipment(p.stats, p.equipment, p.enchant);
        const hp =
          kind === "hp_potion"
            ? Math.min(stats.hpMax, p.stats.hp + def.amount!)
            : p.stats.hp;
        const mp =
          kind === "mp_potion"
            ? Math.min(stats.mpMax, p.stats.mp + def.amount!)
            : p.stats.mp;
        const inv = p.inventory
          .map(s =>
            s.itemId === stack.itemId ? { ...s, qty: s.qty - 1 } : s,
          )
          .filter(s => s.qty > 0);
        return { ...p, stats: { ...p.stats, hp, mp }, inventory: inv };
      });
      const cd = (def.cooldown ?? 6) * 1000;
      setCooldowns(c => ({ ...c, [cdKey]: now + cd }));
      pushLog(`${def.name} used (+${def.amount}).`);
    },
    [player, cooldowns, pushLog],
  );

  // === Hotkeys 1..4 cast skills, 5..6 use potions ===
  useEffect(() => {
    if (!player || screen !== "world") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "5") {
        e.preventDefault();
        usePotion("hp_potion");
        return;
      }
      if (e.key === "6") {
        e.preventDefault();
        usePotion("mp_potion");
        return;
      }
      const idx = "1234".indexOf(e.key);
      if (idx < 0) return;
      const skills = SKILLS_BY_CLASS[player.cls] ?? SKILLS_BY_CLASS.knight;
      const s = skills[idx];
      if (s) castSkill(s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player, screen, castSkill, usePotion]);

  // === Tick cooldown UI every 200ms (just bumps state via buff timer expiry) ===
  useEffect(() => {
    if (!player || screen !== "world") return;
    const iv = setInterval(() => {
      setBuff(b => (b && b.until <= Date.now() ? null : b));
      // Cooldown values are timestamps; we only need to re-render to update
      // remaining-time pills. Trigger by re-setting same map (cheap in React).
      setCooldowns(c => ({ ...c }));
    }, 200);
    return () => clearInterval(iv);
  }, [player, screen]);

  const rewardKill = useCallback(
    (defId: string) => {
      const def = MOBS.find(d => d.id === defId)!;
      const drops: InventoryStack[] = [];
      const gold = Math.floor(def.goldDrop[0] + Math.random() * (def.goldDrop[1] - def.goldDrop[0]));
      for (const loot of def.loot) {
        if (Math.random() < loot.chance) {
          drops.push({ itemId: loot.itemId, qty: loot.qty ?? 1 });
        }
      }
      setPlayer(p => {
        if (!p) return p;
        const nextInv = mergeInventory(p.inventory, drops);
        const xpGain = def.xp;
        let newXp = p.xp + xpGain;
        let newLevel = p.level;
        let unlocks = p.unlockedRecipes;
        let unlockedCls = p.unlockedClasses;
        while (newXp >= xpForLevel(newLevel)) {
          newXp -= xpForLevel(newLevel);
          newLevel += 1;
          // Unlock new recipes
          unlocks = [
            ...unlocks,
            ...RECIPES.filter(r => r.minLevel === newLevel)
              .map(r => r.id)
              .filter(id => !unlocks.includes(id)),
          ];
          // Unlock 2nd profession at lvl 20
          if (newLevel === 20) {
            const r = RACES.find(rr => rr.id === p.race)!;
            unlockedCls = Array.from(new Set([...unlockedCls, ...r.upgradeClasses]));
            pushLog(`Awakening: new classes unlocked.`);
          }
          pushLog(`LEVEL UP — you are now level ${newLevel}.`);
        }
        const stats = {
          ...p.stats,
          hpMax: p.stats.hpMax + (newLevel - p.level) * 18,
          mpMax: p.stats.mpMax + (newLevel - p.level) * 6,
          atk: p.stats.atk + (newLevel - p.level) * 2,
          def: p.stats.def + (newLevel - p.level) * 1,
        };
        if (newLevel > p.level) {
          stats.hp = stats.hpMax;
          stats.mp = stats.mpMax;
        }
        if (drops.length) {
          for (const d of drops) {
            const it = ITEM_BY_ID.get(d.itemId);
            if (it) pushLog(`Loot: ${it.icon} ${it.name} ×${d.qty}`);
          }
        }
        return {
          ...p,
          gold: p.gold + gold,
          xp: newXp,
          level: newLevel,
          stats,
          inventory: nextInv,
          unlockedRecipes: unlocks,
          unlockedClasses: unlockedCls,
        };
      });
    },
    [pushLog],
  );

  // === Inventory actions ===
  const equipItem = useCallback((itemId: string) => {
    setPlayer(p => {
      if (!p) return p;
      const it = ITEM_BY_ID.get(itemId);
      if (!it?.slot) return p;
      if (it.classes && !it.classes.includes(p.cls)) return p;
      const inv = consumeOne(p.inventory, itemId);
      const oldEq = p.equipment[it.slot];
      const nextEq: Equipment = { ...p.equipment, [it.slot]: itemId };
      const finalInv = oldEq ? mergeInventory(inv, [{ itemId: oldEq, qty: 1 }]) : inv;
      pushLog(`Equipped ${it.icon} ${it.name}.`);
      return { ...p, inventory: finalInv, equipment: nextEq };
    });
  }, [pushLog]);

  const unequipItem = useCallback((slot: Slot) => {
    setPlayer(p => {
      if (!p) return p;
      const id = p.equipment[slot];
      if (!id) return p;
      const it = ITEM_BY_ID.get(id);
      const nextEq = { ...p.equipment };
      delete nextEq[slot];
      const inv = mergeInventory(p.inventory, [{ itemId: id, qty: 1 }]);
      pushLog(`Removed ${it?.icon ?? ""} ${it?.name ?? "item"}.`);
      return { ...p, inventory: inv, equipment: nextEq };
    });
  }, [pushLog]);

  const sellItem = useCallback(
    (itemId: string) => {
      setPlayer(p => {
        if (!p) return p;
        const it = ITEM_BY_ID.get(itemId);
        if (!it) return p;
        const inv = consumeOne(p.inventory, itemId);
        const price = Math.floor(it.price * 0.5 * (1 + cityBoosts.vendorBonus));
        pushLog(`Sold ${it.icon} ${it.name} for ${price} gold.`);
        return { ...p, inventory: inv, gold: p.gold + price };
      });
    },
    [cityBoosts.vendorBonus, pushLog],
  );

  const buyItem = useCallback(
    (itemId: string, qty: number) => {
      setPlayer(p => {
        if (!p) return p;
        const it = ITEM_BY_ID.get(itemId);
        if (!it) return p;
        const total = it.price * qty;
        if (p.gold < total) {
          pushLog(`Not enough gold for ${qty}× ${it.name}.`);
          return p;
        }
        const inv = mergeInventory(p.inventory, [{ itemId, qty }]);
        pushLog(`Bought ${qty}× ${it.icon} ${it.name} for ${total} gold.`);
        return { ...p, inventory: inv, gold: p.gold - total };
      });
    },
    [pushLog],
  );

  const enchantItem = useCallback(
    (slot: Slot, scrollId: string) => {
      setPlayer(p => {
        if (!p) return p;
        const eqId = p.equipment[slot];
        if (!eqId) return p;
        const eq = ITEM_BY_ID.get(eqId);
        if (!eq) return p;
        const have = p.inventory.find(s => s.itemId === scrollId);
        if (!have || have.qty < 1) {
          pushLog(`No enchant scroll available.`);
          return p;
        }
        const lvl = (p.enchant?.[eqId] ?? 0);
        if (lvl >= 10) {
          pushLog(`${eq.name} is already at +10.`);
          return p;
        }
        const chance = ENCHANT_CHANCE(lvl);
        const success = Math.random() < chance;
        const inv = consumeOne(p.inventory, scrollId);
        if (success) {
          pushLog(`✨ ${eq.name} enchanted to +${lvl + 1}!`);
          return {
            ...p,
            inventory: inv,
            enchant: { ...(p.enchant ?? {}), [eqId]: lvl + 1 },
          };
        }
        // Failure: shatter the item.
        pushLog(`💥 ${eq.name} shattered into dust.`);
        const newEquipment = { ...p.equipment, [slot]: undefined };
        const newEnchant = { ...(p.enchant ?? {}) };
        delete newEnchant[eqId];
        return {
          ...p,
          inventory: inv,
          equipment: newEquipment,
          enchant: newEnchant,
        };
      });
    },
    [pushLog],
  );

  const craftRecipe = useCallback(
    (recipeId: string) => {
      setPlayer(p => {
        if (!p) return p;
        const r = RECIPES.find(rr => rr.id === recipeId);
        if (!r) return p;
        if (p.level < r.minLevel) return p;
        const goldCost = Math.floor(r.goldCost * (1 - cityBoosts.smithyDiscount));
        if (p.gold < goldCost) return p;
        // Check inputs
        let inv = [...p.inventory];
        for (const inp of r.inputs) {
          const have = inv.reduce((s, x) => s + (x.itemId === inp.itemId ? x.qty : 0), 0);
          if (have < inp.qty) return p;
        }
        for (const inp of r.inputs) {
          inv = consumeMany(inv, inp.itemId, inp.qty);
        }
        inv = mergeInventory(inv, [{ itemId: r.result, qty: r.resultQty }]);
        const it = ITEM_BY_ID.get(r.result);
        pushLog(`Forged ${it?.icon} ${it?.name}.`);
        return { ...p, gold: p.gold - goldCost, inventory: inv };
      });
    },
    [cityBoosts.smithyDiscount, pushLog],
  );

  const openLootbox = useCallback(
    (boxId: string) => {
      const box = LOOTBOXES.find(b => b.id === boxId);
      if (!box) return;
      setPlayer(p => {
        if (!p || p.gold < box.cost) return p;
        const total = box.pool.reduce((s, x) => s + x.weight, 0);
        let r = Math.random() * total;
        let pick = box.pool[0];
        for (const o of box.pool) {
          r -= o.weight;
          if (r <= 0) {
            pick = o;
            break;
          }
        }
        const it = ITEM_BY_ID.get(pick.itemId);
        if (!it) return p;
        setLastDrop(it);
        pushLog(`${box.icon} ${box.name} → ${it.icon} ${it.name}`);
        return {
          ...p,
          gold: p.gold - box.cost,
          inventory: mergeInventory(p.inventory, [{ itemId: it.id, qty: pick.qty ?? 1 }]),
        };
      });
    },
    [pushLog],
  );

  // === City building actions ===
  const placeBuilding = useCallback(
    (b: PlacedBuilding) => {
      setPlayer(p => {
        if (!p) return p;
        const def = BUILDINGS.find(d => d.id === b.defId);
        if (!def || p.gold < def.cost) return p;
        pushLog(`Built ${def.icon} ${def.name}.`);
        return { ...p, gold: p.gold - def.cost, city: [...p.city, b] };
      });
    },
    [pushLog],
  );

  const removeBuilding = useCallback(
    (idx: number) => {
      setPlayer(p => {
        if (!p) return p;
        const b = p.city[idx];
        if (!b) return p;
        const def = BUILDINGS.find(d => d.id === b.defId);
        const refund = def ? Math.floor(def.cost * 0.5) : 0;
        if (def) pushLog(`Demolished ${def.icon} ${def.name} (+${refund} gold)`);
        return {
          ...p,
          city: p.city.filter((_, i) => i !== idx),
          gold: p.gold + refund,
        };
      });
    },
    [pushLog],
  );

  // === Class change at lvl 20 (or any time after if unlocked) ===
  const switchClass = useCallback((cls: ClassId) => {
    setPlayer(p => {
      if (!p || !p.unlockedClasses.includes(cls)) return p;
      pushLog(`Profession changed to ${CLASSES.find(c => c.id === cls)?.name}.`);
      return { ...p, cls };
    });
  }, [pushLog]);

  // === Keyboard movement ===
  useEffect(() => {
    if (screen !== "world") {
      setMovementInput({ x: 0, z: 0 });
      return;
    }
    const keys = new Set<string>();
    const update = () => {
      let x = 0;
      let z = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) z -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) z += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
      const mag = Math.hypot(x, z);
      if (mag > 0) {
        x /= mag;
        z /= mag;
      }
      setMovementInput({ x, z });
    };
    const down = (e: KeyboardEvent) => {
      keys.add(e.code);
      update();
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code);
      update();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen]);

  // === Render ===
  if (screen === "raceSelect") {
    return (
      <Suspense fallback={<div className="loading">Loading bloodlines…</div>}>
        <RaceSelect
          onConfirm={({ name, race, cls }) => {
            const p = buildPlayer(name, race, cls);
            setPlayer(p);
            setMobs(spawnMobs(1));
            setScreen("world");
          }}
        />
      </Suspense>
    );
  }

  if (!player) return <div className="loading">Summoning hero…</div>;

  if (screen === "city") {
    return (
      <div className="screen-city">
        <Suspense fallback={<div className="loading">Loading stronghold…</div>}>
          <CityBuilder
            city={player.city}
            gold={player.gold}
            selectedDefId={selectedBuildDef}
            onSelectDef={setSelectedBuildDef}
            onPlace={placeBuilding}
            onRemove={removeBuilding}
          />
        </Suspense>
        <button className="back-btn" onClick={() => setScreen("world")}>
          ← Back to world
        </button>
      </div>
    );
  }

  // World view + HUD
  const xpNeed = xpForLevel(player.level);
  const stats = effectiveStats!;

  return (
    <div className="screen-world">
      <Suspense fallback={<div className="loading">Loading world…</div>}>
        <World
          player={player}
          mobs={mobs}
          selectedMob={selectedMob}
          movementInput={movementInput}
          onSelectMob={setSelectedMob}
          city={player.city}
          cameraMode={cameraMode}
          zoom={zoom}
          onZoomChange={setZoom}
          onPlayerPos={setPlayerXZ}
        />
      </Suspense>

      {/* HUD top */}
      <div className="hud-top">
        <div className="hud-bars">
          <div className="hud-name">
            <strong>{player.name}</strong>
            <small>
              {RACES.find(r => r.id === player.race)?.name.split(" ")[0]} ·{" "}
              {CLASSES.find(c => c.id === player.cls)?.name} · Lv {player.level}
            </small>
          </div>
          <Bar color="#ff5a3a" label="HP" value={player.stats.hp} max={stats.hpMax} />
          <Bar color="#54a8ff" label="MP" value={player.stats.mp} max={stats.mpMax} />
          <Bar color="#a060ff" label="XP" value={player.xp} max={xpNeed} />
        </div>
        <div className="hud-gold">💰 {player.gold}</div>
      </div>

      {/* Selected mob target frame */}
      {selectedMob &&
        (() => {
          const m = mobs.find(x => x.uid === selectedMob);
          if (!m || m.deadUntil) return null;
          const def = MOBS.find(d => d.id === m.defId)!;
          return (
            <div className="hud-target">
              <strong>{def.name}</strong>
              <small>Lv {def.level}{def.bossy ? " ★ Boss" : ""}</small>
              <Bar color="#ff3a3a" label="HP" value={m.hp} max={def.hp} />
              <small className="muted">Walk close — auto-attack engages</small>
            </div>
          );
        })()}

      {/* Quick actions bottom */}
      <div className="hud-actions">
        <button onClick={() => setOverlay("inventory")}>🎒 Inventory</button>
        <button onClick={() => setOverlay("crafting")}>⚒️ Forge</button>
        <button onClick={() => setOverlay("vendor")}>🧙 Vendor</button>
        <button onClick={() => setOverlay("enchant")}>⚡ Enchant</button>
        <button onClick={() => setOverlay("lootbox")}>📦 Reliquaries</button>
        {player.level >= 10 ? (
          <button onClick={() => setScreen("city")}>🏰 Stronghold</button>
        ) : (
          <button disabled title="Unlocks at level 10">🏰 Stronghold (lvl 10)</button>
        )}
        {player.unlockedClasses.length > 1 && (
          <select
            value={player.cls}
            onChange={e => switchClass(e.target.value as ClassId)}
            className="cls-pick"
          >
            {player.unlockedClasses.map(id => {
              const c = CLASSES.find(x => x.id === id)!;
              return (
                <option key={id} value={id}>
                  {c.name}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Combat log */}
      <ul className="hud-log">
        {log.map((l, i) => (
          <li key={l.ts + "-" + i}>{l.msg}</li>
        ))}
      </ul>

      {/* Mini-map (top-left under HP bars) */}
      <MiniMap
        player={playerXZ}
        mobs={mobs}
        city={player.city}
        selectedMob={selectedMob}
      />

      {/* Soulshot / Spirit Shot toggles (L2-style) */}
      <div className="hud-shots">
        <button
          className={player.soulshotEnabled ? "shot-on" : ""}
          onClick={() =>
            setPlayer(p =>
              p ? { ...p, soulshotEnabled: !p.soulshotEnabled } : p,
            )
          }
          title="Consume Soulshots for +damage on attacks"
        >
          🔥 Soulshot {player.soulshotEnabled ? "ON" : "off"}
          <small>
            ×
            {player.inventory
              .filter(s => {
                const d = ITEM_BY_ID.get(s.itemId);
                return d?.consumable === "soulshot";
              })
              .reduce((a, b) => a + b.qty, 0)}
          </small>
        </button>
        <button
          className={player.spiritShotEnabled ? "shot-on" : ""}
          onClick={() =>
            setPlayer(p =>
              p ? { ...p, spiritShotEnabled: !p.spiritShotEnabled } : p,
            )
          }
          title="Consume Spirit Shots for +spell damage"
        >
          💎 Spirit {player.spiritShotEnabled ? "ON" : "off"}
          <small>
            ×
            {player.inventory
              .filter(s => {
                const d = ITEM_BY_ID.get(s.itemId);
                return d?.consumable === "spirit_shot";
              })
              .reduce((a, b) => a + b.qty, 0)}
          </small>
        </button>
      </div>

      {/* Skill bar — Diablo-style 1..4 hotkeys */}
      <SkillBar
        cls={player.cls}
        mp={player.stats.mp}
        cooldowns={cooldowns}
        buffSkill={buff?.skillId ?? null}
        buffUntil={buff?.until ?? null}
        onCast={castSkill}
      />

      {/* Camera mode + zoom (top-right) */}
      <div className="hud-cam">
        <button
          className={cameraMode === "thirdPerson" ? "cam-active" : ""}
          onClick={() => setCameraMode("thirdPerson")}
          title="Camera follows behind player"
        >
          🎥 Third-Person
        </button>
        <button
          className={cameraMode === "topDown" ? "cam-active" : ""}
          onClick={() => setCameraMode("topDown")}
          title="Top-down strategic view"
        >
          🛰️ Top-Down
        </button>
        <div className="cam-zoom">
          <button
            onClick={() => setZoom(z => Math.max(0, z - 0.1))}
            title="Zoom in (closer)"
          >
            ➖
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
          />
          <button
            onClick={() => setZoom(z => Math.min(1, z + 0.1))}
            title="Zoom out (further)"
          >
            ➕
          </button>
        </div>
      </div>

      {/* Touch joystick */}
      <Joystick onChange={setMovementInput} />

      {/* Overlays */}
      {overlay === "inventory" && (
        <InventoryPanel
          player={player}
          onEquip={equipItem}
          onUnequip={unequipItem}
          onSell={sellItem}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "crafting" && (
        <CraftingPanel
          player={player}
          onCraft={craftRecipe}
          smithyDiscount={cityBoosts.smithyDiscount}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "lootbox" && (
        <LootboxPanel
          player={player}
          lastDrop={lastDrop}
          onOpen={openLootbox}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "vendor" && (
        <VendorPanel
          player={player}
          onBuy={buyItem}
          onSell={sellItem}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "enchant" && (
        <EnchantPanel
          player={player}
          onEnchant={enchantItem}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  );
}

// === Inventory helpers ===

function mergeInventory(inv: InventoryStack[], drops: InventoryStack[]): InventoryStack[] {
  const map = new Map<string, number>();
  for (const s of inv) map.set(s.itemId, (map.get(s.itemId) ?? 0) + s.qty);
  for (const d of drops) map.set(d.itemId, (map.get(d.itemId) ?? 0) + d.qty);
  return [...map.entries()].map(([itemId, qty]) => ({ itemId, qty }));
}

function consumeOne(inv: InventoryStack[], itemId: string): InventoryStack[] {
  return consumeMany(inv, itemId, 1);
}

function consumeMany(inv: InventoryStack[], itemId: string, qty: number): InventoryStack[] {
  const out: InventoryStack[] = [];
  let remaining = qty;
  for (const s of inv) {
    if (s.itemId !== itemId || remaining <= 0) {
      out.push(s);
      continue;
    }
    const take = Math.min(s.qty, remaining);
    remaining -= take;
    if (s.qty - take > 0) out.push({ itemId: s.itemId, qty: s.qty - take });
  }
  return out;
}

// === Tiny bar primitive ===
function Bar({
  color,
  label,
  value,
  max,
}: {
  color: string;
  label: string;
  value: number;
  max: number;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="bar">
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${ratio * 100}%`, background: color }} />
        <span className="bar-label">
          {label} {Math.floor(value)}/{Math.floor(max)}
        </span>
      </div>
    </div>
  );
}

// expose ITEMS to dev console for debugging
declare global {
  interface Window {
    __cdg__items: typeof ITEMS;
  }
}
if (typeof window !== "undefined") window.__cdg__items = ITEMS;
