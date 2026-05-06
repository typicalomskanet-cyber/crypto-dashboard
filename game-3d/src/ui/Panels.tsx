import { useMemo, useState } from "react";
import type { Player, Slot, ItemDef } from "../types";
import { ITEMS, ITEM_BY_ID, RARITY_COLOR } from "../data/items";
import { RECIPES } from "../data/recipes";
import { LOOTBOXES } from "../data/lootboxes";

const SLOTS: Slot[] = [
  "weapon",
  "armor",
  "helm",
  "gloves",
  "boots",
  "ring",
  "amulet",
];

export interface InventoryProps {
  player: Player;
  onEquip(itemId: string): void;
  onUnequip(slot: Slot): void;
  onSell(itemId: string): void;
  onClose(): void;
}

/** Tabs for the L2-style inventory. */
type InvTab = "all" | "weapon" | "armor" | "consumable" | "material" | "etc";

const TAB_LABEL: Record<InvTab, string> = {
  all: "All",
  weapon: "Weapon",
  armor: "Armor",
  consumable: "Consumables",
  material: "Materials",
  etc: "Misc",
};

function classifyItem(it: ItemDef): InvTab {
  if (it.slot === "weapon") return "weapon";
  if (it.slot) return "armor"; // armor/helm/gloves/boots/ring/amulet
  if (it.consumable) return "consumable";
  if (it.material) return "material";
  return "etc";
}

const INV_CAPACITY = 64;

export function InventoryPanel({ player, onEquip, onUnequip, onSell, onClose }: InventoryProps) {
  const [tab, setTab] = useState<InvTab>("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const stack of player.inventory) {
      map.set(stack.itemId, (map.get(stack.itemId) ?? 0) + stack.qty);
    }
    return [...map.entries()].map(([itemId, qty]) => ({ itemId, qty }));
  }, [player.inventory]);

  const filtered = useMemo(() => {
    if (tab === "all") return grouped;
    return grouped.filter(g => {
      const it = ITEM_BY_ID.get(g.itemId);
      return it && classifyItem(it) === tab;
    });
  }, [tab, grouped]);

  // Pad to 8×N grid for L2 look.
  const slots = useMemo(() => {
    const out: ({ itemId: string; qty: number } | null)[] = [...filtered];
    const min = tab === "all" ? INV_CAPACITY : Math.max(24, Math.ceil(filtered.length / 8) * 8);
    while (out.length < min) out.push(null);
    return out;
  }, [filtered, tab]);

  return (
    <div className="panel inventory-panel l2-inv">
      <header className="panel-head">
        <h2>Inventory</h2>
        <span className="inv-summary">
          <span className="inv-cap">
            {grouped.length}/{INV_CAPACITY}
          </span>
          <span className="panel-coin">💰 {player.gold}</span>
        </span>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </header>

      {/* Equipment paperdoll grid */}
      <section className="equip-paperdoll">
        {SLOTS.map(s => {
          const eqId = player.equipment[s];
          const eq = eqId ? ITEM_BY_ID.get(eqId) : null;
          const lvl = eqId ? player.enchant?.[eqId] ?? 0 : 0;
          return (
            <div
              key={s}
              className={`pd-slot pd-${s} ${eq ? "filled" : ""}`}
              onClick={() => eq && onUnequip(s)}
              onMouseEnter={() => eq && setHoverId(eqId!)}
              onMouseLeave={() => setHoverId(null)}
              style={
                eq
                  ? { borderColor: RARITY_COLOR[eq.rarity], color: RARITY_COLOR[eq.rarity] }
                  : undefined
              }
            >
              {eq ? (
                <>
                  <span className="pd-icon">{eq.icon}</span>
                  {lvl > 0 && <span className="pd-enchant">+{lvl}</span>}
                </>
              ) : (
                <span className="pd-empty">{s}</span>
              )}
            </div>
          );
        })}
      </section>

      {/* Tab strip */}
      <nav className="inv-tabs">
        {(Object.keys(TAB_LABEL) as InvTab[]).map(k => (
          <button
            key={k}
            className={tab === k ? "tab-active" : ""}
            onClick={() => setTab(k)}
          >
            {TAB_LABEL[k]}
          </button>
        ))}
      </nav>

      {/* Grid (8 columns, L2-style) */}
      <section className="inv-cells">
        {slots.map((s, idx) => {
          if (!s) return <div key={idx} className="inv-cell inv-cell-empty" />;
          const it = ITEM_BY_ID.get(s.itemId);
          if (!it) return <div key={idx} className="inv-cell inv-cell-empty" />;
          const canEquip = !!it.slot && (!it.classes || it.classes.includes(player.cls));
          return (
            <button
              key={idx}
              className={`inv-cell rarity-${it.rarity} ${hoverId === s.itemId ? "hovered" : ""}`}
              style={{ borderColor: RARITY_COLOR[it.rarity] }}
              onMouseEnter={() => setHoverId(s.itemId)}
              onMouseLeave={() => setHoverId(null)}
              onDoubleClick={() => {
                if (canEquip) onEquip(s.itemId);
              }}
              onClick={() => setHoverId(s.itemId)}
            >
              <span className="inv-cell-icon">{it.icon}</span>
              {s.qty > 1 && <span className="inv-cell-qty">{s.qty}</span>}
            </button>
          );
        })}
      </section>

      {/* Tooltip / detail panel */}
      {hoverId && (() => {
        const it = ITEM_BY_ID.get(hoverId);
        if (!it) return null;
        const stack = grouped.find(g => g.itemId === hoverId);
        const canEquip = !!it.slot && (!it.classes || it.classes.includes(player.cls));
        const lvl = player.enchant?.[hoverId] ?? 0;
        return (
          <div
            className="inv-tooltip"
            style={{ borderColor: RARITY_COLOR[it.rarity] }}
          >
            <header>
              <span className="tip-icon">{it.icon}</span>
              <strong style={{ color: RARITY_COLOR[it.rarity] }}>
                {it.name}
                {lvl > 0 && <span className="tip-enchant"> +{lvl}</span>}
              </strong>
              <small>{it.slot ?? it.consumable ?? (it.material ? "material" : "misc")}</small>
            </header>
            {it.stats && (
              <ul className="inv-stats">
                {it.stats.atk ? <li>+{it.stats.atk} atk</li> : null}
                {it.stats.def ? <li>+{it.stats.def} def</li> : null}
                {it.stats.hp ? <li>+{it.stats.hp} HP</li> : null}
                {it.stats.mp ? <li>+{it.stats.mp} MP</li> : null}
                {it.stats.crit ? <li>+{it.stats.crit} crit</li> : null}
              </ul>
            )}
            {it.consumable === "hp_potion" && (
              <p className="muted">Restores {it.amount} HP. Hotkey 5 to use.</p>
            )}
            {it.consumable === "mp_potion" && (
              <p className="muted">Restores {it.amount} MP. Hotkey 6 to use.</p>
            )}
            {it.consumable === "soulshot" && (
              <p className="muted">+{it.amount}% damage when toggled on.</p>
            )}
            {it.consumable === "spirit_shot" && (
              <p className="muted">+{it.amount}% spell damage when toggled on.</p>
            )}
            <footer className="tip-actions">
              {canEquip && (
                <button className="btn-eq" onClick={() => onEquip(hoverId)}>
                  Equip
                </button>
              )}
              <button className="btn-sell" onClick={() => onSell(hoverId)}>
                Sell {Math.floor(it.price * 0.5)}g
              </button>
              <span className="tip-qty">×{stack?.qty ?? 0}</span>
            </footer>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface CraftingProps {
  player: Player;
  onCraft(recipeId: string): void;
  onClose(): void;
  smithyDiscount: number;
}

export function CraftingPanel({ player, onCraft, onClose, smithyDiscount }: CraftingProps) {
  const have = useMemo(() => {
    const m = new Map<string, number>();
    for (const stack of player.inventory) {
      m.set(stack.itemId, (m.get(stack.itemId) ?? 0) + stack.qty);
    }
    return m;
  }, [player.inventory]);

  return (
    <div className="panel crafting-panel">
      <header className="panel-head">
        <h2>Forge</h2>
        <span className="panel-coin">💰 {player.gold}</span>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </header>

      <p className="muted">
        Craft equipment from looted materials. {smithyDiscount > 0 && `(Smithy discount: -${Math.round(smithyDiscount * 100)}% gold)`}
      </p>

      <div className="recipe-list">
        {RECIPES.map(r => {
          const result = ITEM_BY_ID.get(r.result);
          if (!result) return null;
          const hasInputs = r.inputs.every(inp => (have.get(inp.itemId) ?? 0) >= inp.qty);
          const goldCost = Math.floor(r.goldCost * (1 - smithyDiscount));
          const canLevel = player.level >= r.minLevel;
          const canCraft = hasInputs && player.gold >= goldCost && canLevel;
          return (
            <article
              key={r.id}
              className={`recipe rarity-${result.rarity}`}
              style={{ borderColor: RARITY_COLOR[result.rarity] }}
            >
              <header>
                <span className="rec-icon">{result.icon}</span>
                <h4 style={{ color: RARITY_COLOR[result.rarity] }}>{result.name}</h4>
                <small>min lvl {r.minLevel}</small>
              </header>
              <ul className="rec-inputs">
                {r.inputs.map(inp => {
                  const it = ITEM_BY_ID.get(inp.itemId);
                  const has = have.get(inp.itemId) ?? 0;
                  const ok = has >= inp.qty;
                  return (
                    <li key={inp.itemId} className={ok ? "ok" : "bad"}>
                      {it?.icon} {it?.name} {has}/{inp.qty}
                    </li>
                  );
                })}
                <li className={player.gold >= goldCost ? "ok" : "bad"}>💰 {goldCost}</li>
              </ul>
              <button disabled={!canCraft} onClick={() => onCraft(r.id)}>
                {!canLevel ? `Locked (lvl ${r.minLevel})` : canCraft ? "Forge" : "Missing"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface LootboxProps {
  player: Player;
  lastDrop: ItemDef | null;
  onOpen(boxId: string): void;
  onClose(): void;
}

export function LootboxPanel({ player, lastDrop, onOpen, onClose }: LootboxProps) {
  const [hint, setHint] = useState<string | null>(null);
  return (
    <div className="panel lootbox-panel">
      <header className="panel-head">
        <h2>Reliquaries</h2>
        <span className="panel-coin">💰 {player.gold}</span>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className="lootbox-grid">
        {LOOTBOXES.map(b => (
          <article key={b.id} className="lootbox-card">
            <span className="lb-icon">{b.icon}</span>
            <h4>{b.name}</h4>
            <small>${b.cost}</small>
            <button
              disabled={player.gold < b.cost}
              onClick={() => {
                onOpen(b.id);
                setHint(b.name);
              }}
            >
              Open
            </button>
            <ul className="lb-pool">
              {b.pool.slice(0, 4).map((p) => {
                const it = ITEMS.find(i => i.id === p.itemId);
                if (!it) return null;
                return (
                  <li key={p.itemId} style={{ color: RARITY_COLOR[it.rarity] }}>
                    {it.icon} {it.name}
                  </li>
                );
              })}
              <li>…</li>
            </ul>
          </article>
        ))}
      </div>
      {lastDrop && (
        <div className="lb-result" style={{ borderColor: RARITY_COLOR[lastDrop.rarity] }}>
          <strong style={{ color: RARITY_COLOR[lastDrop.rarity] }}>
            {hint ? `${hint} reveals: ` : ""}
            {lastDrop.icon} {lastDrop.name}
          </strong>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Items the wandering Lich Merchant sells. */
const VENDOR_STOCK: string[] = [
  // Consumables
  "pot_heal_minor",
  "pot_heal_major",
  "pot_mana_minor",
  "pot_mana_major",
  // Soulshots
  "soulshot",
  "spirit_shot",
  "soulshot_grade_b",
  "spirit_shot_grade_b",
  // Enchant scrolls
  "scroll_enchant_weapon",
  "scroll_enchant_armor",
  // Basic crafting materials so new players never block on grinding
  "scrap_iron",
  "hide_rough",
  "herb_blue",
  "herb_red",
];

export interface VendorProps {
  player: Player;
  onBuy(itemId: string, qty: number): void;
  onSell(itemId: string): void;
  onClose(): void;
}

export function VendorPanel({ player, onBuy, onSell, onClose }: VendorProps) {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const stack of player.inventory) {
      map.set(stack.itemId, (map.get(stack.itemId) ?? 0) + stack.qty);
    }
    return [...map.entries()];
  }, [player.inventory]);
  return (
    <div className="panel vendor-panel">
      <header className="panel-head">
        <h2>🧙 Lich Merchant</h2>
        <span className="panel-coin">💰 {player.gold}</span>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className="vendor-tabs">
        <button
          className={tab === "buy" ? "tab-active" : ""}
          onClick={() => setTab("buy")}
        >
          Buy
        </button>
        <button
          className={tab === "sell" ? "tab-active" : ""}
          onClick={() => setTab("sell")}
        >
          Sell
        </button>
      </div>
      {tab === "buy" ? (
        <ul className="vendor-list">
          {VENDOR_STOCK.map(id => {
            const it = ITEM_BY_ID.get(id);
            if (!it) return null;
            const price = it.price;
            const can1 = player.gold >= price;
            const can10 = player.gold >= price * 10;
            return (
              <li
                key={id}
                className={`vendor-row rarity-${it.rarity}`}
                style={{ borderColor: RARITY_COLOR[it.rarity] }}
              >
                <span className="vendor-icon">{it.icon}</span>
                <span className="vendor-name" style={{ color: RARITY_COLOR[it.rarity] }}>
                  {it.name}
                </span>
                <span className="vendor-price">💰 {price}</span>
                <button disabled={!can1} onClick={() => onBuy(id, 1)}>
                  Buy 1
                </button>
                <button disabled={!can10} onClick={() => onBuy(id, 10)}>
                  ×10
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="vendor-list">
          {grouped.length === 0 && <p className="empty">Inventory is empty.</p>}
          {grouped.map(([id, qty]) => {
            const it = ITEM_BY_ID.get(id);
            if (!it) return null;
            const sellPrice = Math.floor(it.price * 0.5);
            return (
              <li
                key={id}
                className={`vendor-row rarity-${it.rarity}`}
                style={{ borderColor: RARITY_COLOR[it.rarity] }}
              >
                <span className="vendor-icon">{it.icon}</span>
                <span className="vendor-name" style={{ color: RARITY_COLOR[it.rarity] }}>
                  {it.name}
                </span>
                <span className="vendor-qty">×{qty}</span>
                <span className="vendor-price">💰 {sellPrice}</span>
                <button onClick={() => onSell(id)}>Sell 1</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * Enchant Forge (Lineage 2-style). Pick an equipped item, consume an enchant
 * scroll and gold to attempt +1 → +10. Failure chance scales with current
 * enchant level. Failure breaks the item (unequips and removes it).
 */
export interface EnchantProps {
  player: Player;
  onEnchant(slot: Slot, scrollId: string): void;
  onClose(): void;
}

export function ENCHANT_CHANCE(level: number): number {
  // L2-ish curve: 100% to +3, then drops sharply
  if (level < 3) return 1.0;
  if (level === 3) return 0.66;
  if (level === 4) return 0.55;
  if (level === 5) return 0.45;
  if (level === 6) return 0.35;
  if (level === 7) return 0.28;
  if (level === 8) return 0.22;
  if (level === 9) return 0.18;
  return 0.14; // +10
}

export function EnchantPanel({ player, onEnchant, onClose }: EnchantProps) {
  const have = useMemo(() => {
    const m = new Map<string, number>();
    for (const stack of player.inventory) {
      m.set(stack.itemId, (m.get(stack.itemId) ?? 0) + stack.qty);
    }
    return m;
  }, [player.inventory]);
  return (
    <div className="panel enchant-panel">
      <header className="panel-head">
        <h2>⚡ Enchant Altar</h2>
        <span className="panel-coin">💰 {player.gold}</span>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </header>
      <p className="muted">
        Imbue your equipment +1 → +10. Failure beyond +3 may shatter the item.
        Each weapon enchant grants +5% atk; each armor enchant +5% hp/def.
      </p>
      <ul className="enchant-list">
        {SLOTS.map(s => {
          const eqId = player.equipment[s];
          if (!eqId) return null;
          const eq = ITEM_BY_ID.get(eqId);
          if (!eq) return null;
          const lvl = (player.enchant?.[eqId] ?? 0);
          const isWeapon = s === "weapon";
          const scrollId = isWeapon ? "scroll_enchant_weapon" : "scroll_enchant_armor";
          const scroll = ITEM_BY_ID.get(scrollId)!;
          const haveScroll = (have.get(scrollId) ?? 0) > 0;
          const chance = ENCHANT_CHANCE(lvl);
          const canTry = haveScroll && lvl < 10;
          return (
            <li
              key={s}
              className={`enchant-row rarity-${eq.rarity}`}
              style={{ borderColor: RARITY_COLOR[eq.rarity] }}
            >
              <span className="ench-icon">{eq.icon}</span>
              <strong style={{ color: RARITY_COLOR[eq.rarity] }}>
                {eq.name} <span className="ench-lvl">+{lvl}</span>
              </strong>
              <small>{s}</small>
              <span className="ench-chance">
                {(chance * 100).toFixed(0)}% success
              </span>
              <span className="ench-scroll">
                {scroll.icon} ×{have.get(scrollId) ?? 0}
              </span>
              <button
                disabled={!canTry}
                onClick={() => onEnchant(s, scrollId)}
              >
                {lvl >= 10 ? "Maxed" : `Enchant +${lvl + 1}`}
              </button>
            </li>
          );
        })}
        {Object.values(player.equipment).every(v => !v) && (
          <p className="empty">Equip an item first to enchant it.</p>
        )}
      </ul>
    </div>
  );
}
