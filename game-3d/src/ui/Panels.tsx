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

export function InventoryPanel({ player, onEquip, onUnequip, onSell, onClose }: InventoryProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const stack of player.inventory) {
      map.set(stack.itemId, (map.get(stack.itemId) ?? 0) + stack.qty);
    }
    return [...map.entries()].map(([itemId, qty]) => ({ itemId, qty }));
  }, [player.inventory]);

  return (
    <div className="panel inventory-panel">
      <header className="panel-head">
        <h2>Inventory</h2>
        <span className="panel-coin">💰 {player.gold}</span>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </header>

      <section className="equip-grid">
        {SLOTS.map(s => {
          const eqId = player.equipment[s];
          const eq = eqId ? ITEM_BY_ID.get(eqId) : null;
          return (
            <div key={s} className={`equip-slot ${eq ? "filled" : ""}`}>
              <span className="equip-slot-name">{s}</span>
              {eq ? (
                <>
                  <span
                    className="equip-icon"
                    style={{ color: RARITY_COLOR[eq.rarity] }}
                  >
                    {eq.icon}
                  </span>
                  <strong style={{ color: RARITY_COLOR[eq.rarity] }}>{eq.name}</strong>
                  <button onClick={() => onUnequip(s)}>Unequip</button>
                </>
              ) : (
                <span className="equip-empty">Empty</span>
              )}
            </div>
          );
        })}
      </section>

      <section className="inv-grid">
        {grouped.length === 0 && <p className="empty">Inventory is empty.</p>}
        {grouped.map(({ itemId, qty }) => {
          const it = ITEM_BY_ID.get(itemId);
          if (!it) return null;
          const canEquip = !!it.slot && (!it.classes || it.classes.includes(player.cls));
          return (
            <article
              key={itemId}
              className={`inv-card rarity-${it.rarity}`}
              style={{ borderColor: RARITY_COLOR[it.rarity] }}
            >
              <header>
                <span className="inv-icon">{it.icon}</span>
                <span className="inv-qty">×{qty}</span>
              </header>
              <h4 style={{ color: RARITY_COLOR[it.rarity] }}>{it.name}</h4>
              <small className="inv-slot">{it.slot ?? "material"}</small>
              {it.stats && (
                <ul className="inv-stats">
                  {it.stats.atk ? <li>+{it.stats.atk} atk</li> : null}
                  {it.stats.def ? <li>+{it.stats.def} def</li> : null}
                  {it.stats.hp ? <li>+{it.stats.hp} hp</li> : null}
                  {it.stats.mp ? <li>+{it.stats.mp} mp</li> : null}
                  {it.stats.crit ? <li>+{it.stats.crit} crit</li> : null}
                </ul>
              )}
              <footer>
                {canEquip && (
                  <button className="btn-eq" onClick={() => onEquip(itemId)}>
                    Equip
                  </button>
                )}
                <button className="btn-sell" onClick={() => onSell(itemId)}>
                  Sell ${Math.floor(it.price * 0.5)}
                </button>
              </footer>
            </article>
          );
        })}
      </section>
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
