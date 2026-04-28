import { useState } from 'react';
import { useGame } from '../store/game';
import { getItem } from '../data/items';
import { totalStats } from '../game/stats';
import type { EquipSlot, Item } from '../types';

const SLOTS: EquipSlot[] = ['weapon', 'offhand', 'head', 'chest', 'legs', 'feet', 'ring', 'amulet'];

export function Inventory() {
  const player = useGame((s) => s.player);
  const setScreen = useGame((s) => s.setScreen);
  const equip = useGame((s) => s.equip);
  const unequip = useGame((s) => s.unequip);
  const consumeItem = useGame((s) => s.consumeItem);
  const [selected, setSelected] = useState<Item | null>(null);

  if (!player) return null;
  const stats = totalStats(player);

  const onUse = (item: Item) => {
    if (item.kind === 'equipment') {
      if (item.levelReq > player.level) return;
      equip(item.id);
    } else if (item.kind === 'consumable') {
      consumeItem(item.id);
    }
    setSelected(null);
  };

  return (
    <div className="modal-backdrop" onClick={() => setScreen('world')}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>INVENTORY</h3>
          <button onClick={() => setScreen('world')}>Close</button>
        </div>
        <div className="modal-body">
          <div className="inv-layout">
            <div className="inv-section">
              <h4>BAGS</h4>
              <div className="inv-grid">
                {player.inventory.map((stack) => {
                  const it = getItem(stack.itemId);
                  if (!it) return null;
                  return (
                    <div
                      key={stack.itemId}
                      className={`inv-cell rarity-${it.rarity}`}
                      onClick={() => setSelected(it)}
                      title={it.name}
                    >
                      <div className="icon">{it.icon}</div>
                      <div style={{ fontSize: 10 }}>{it.name}</div>
                      <div className="count">×{stack.count}</div>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 20 - player.inventory.length) }).map((_, i) => (
                  <div key={`e-${i}`} className="inv-cell empty" />
                ))}
              </div>
            </div>
            <div className="inv-section">
              <h4>EQUIPMENT</h4>
              <div className="equip-slots">
                {SLOTS.map((slot) => {
                  const equippedId = player.equipped[slot];
                  const it = equippedId ? getItem(equippedId) : null;
                  return (
                    <div
                      key={slot}
                      className={`inv-cell ${it ? `rarity-${it.rarity}` : ''}`}
                      onClick={() => {
                        if (it) unequip(slot);
                      }}
                      title={it ? `${it.name} (click to unequip)` : `Empty ${slot}`}
                    >
                      <div className="icon">{it ? it.icon : '·'}</div>
                      <div style={{ fontSize: 10 }}>{slot}</div>
                    </div>
                  );
                })}
              </div>
              <h4 style={{ marginTop: 12 }}>STATS</h4>
              <div className="stats-list">
                <div>HP {Math.round(stats.hp)}</div>
                <div>MP {Math.round(stats.mp)}</div>
                <div>ATK {Math.round(stats.atk)}</div>
                <div>DEF {Math.round(stats.def)}</div>
                <div>M.ATK {Math.round(stats.matk)}</div>
                <div>M.DEF {Math.round(stats.mdef)}</div>
                <div>CRIT {(stats.crit * 100).toFixed(1)}%</div>
                <div>SPD {stats.speed.toFixed(1)}</div>
              </div>
              {selected && (
                <div
                  style={{
                    marginTop: 12,
                    border: '1px solid var(--panel-border)',
                    padding: 10,
                    borderRadius: 6,
                  }}
                >
                  <div style={{ color: 'var(--accent-2)' }}>
                    {selected.icon} {selected.name}
                  </div>
                  <div className="stats-list">
                    {selected.kind === 'equipment' &&
                      Object.entries(selected.stats).map(([k, v]) => (
                        <div key={k}>
                          {k}: +{typeof v === 'number' && k === 'crit' ? `${(v * 100).toFixed(1)}%` : v}
                        </div>
                      ))}
                    {selected.kind === 'consumable' && (
                      <>
                        {selected.restoreHp && <div>Restores {selected.restoreHp} HP</div>}
                        {selected.restoreMp && <div>Restores {selected.restoreMp} MP</div>}
                      </>
                    )}
                    {selected.kind === 'equipment' && selected.levelReq > 1 && (
                      <div>Requires Lv.{selected.levelReq}</div>
                    )}
                  </div>
                  {selected.kind !== 'material' && (
                    <button
                      style={{ marginTop: 8 }}
                      disabled={selected.kind === 'equipment' && selected.levelReq > player.level}
                      onClick={() => onUse(selected)}
                    >
                      {selected.kind === 'equipment' ? 'Equip' : 'Use'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
