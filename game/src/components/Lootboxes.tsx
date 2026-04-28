import { useState } from 'react';
import { useGame } from '../store/game';
import { LOOTBOXES } from '../data/lootbox';
import { getItem } from '../data/items';

export function Lootboxes() {
  const player = useGame((s) => s.player);
  const setScreen = useGame((s) => s.setScreen);
  const openLootbox = useGame((s) => s.openLootbox);
  const [lastReward, setLastReward] = useState<string | null>(null);

  if (!player) return null;

  return (
    <div className="modal-backdrop" onClick={() => setScreen('world')}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>CHESTS OF THE DEVIL GODS</h3>
          <button onClick={() => setScreen('world')}>Close</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
            All drop rates are listed transparently. A pity counter guarantees an
            epic+ reward after a run of unlucky opens.
          </p>
          <div className="lootbox-grid">
            {LOOTBOXES.map((tier) => {
              const total = tier.drops.reduce((s, d) => s + d.weight, 0);
              return (
                <div key={tier.id} className="lootbox-card">
                  <h4>{tier.name}</h4>
                  <div>
                    Cost: <b style={{ color: 'var(--gold)' }}>{tier.cost} G</b>
                  </div>
                  <div>Pity after: {tier.pity} opens (epic+ guaranteed)</div>
                  <div>Current pity: {player.pityCounter}</div>
                  <div className="drop-rate">
                    {tier.drops.map((d) => {
                      const it = getItem(d.itemId);
                      return (
                        <div key={d.itemId}>
                          {it?.icon} <b>{it?.name}</b> —{' '}
                          {((d.weight / total) * 100).toFixed(1)}%
                        </div>
                      );
                    })}
                  </div>
                  <button
                    disabled={player.gold < tier.cost}
                    className="cta"
                    onClick={() => {
                      const r = openLootbox(tier.id);
                      if (r) {
                        const it = getItem(r.itemId);
                        setLastReward(`${it?.icon} ${it?.name}`);
                        setTimeout(() => setLastReward(null), 2500);
                      }
                    }}
                  >
                    Open for {tier.cost} G
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {lastReward && <div className="toast">You received: {lastReward}</div>}
    </div>
  );
}
