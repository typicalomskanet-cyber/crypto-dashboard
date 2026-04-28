import { useGame } from '../store/game';
import { RECIPES } from '../data/recipes';
import { getItem } from '../data/items';
import { iconFor } from '../utils/itemIcon';

export function Crafting() {
  const player = useGame((s) => s.player);
  const setScreen = useGame((s) => s.setScreen);
  const craft = useGame((s) => s.craft);
  if (!player) return null;

  const canCraft = (inputs: { itemId: string; count: number }[], lvl: number) => {
    if (player.level < lvl) return false;
    for (const n of inputs) {
      const s = player.inventory.find((i) => i.itemId === n.itemId);
      if (!s || s.count < n.count) return false;
    }
    return true;
  };

  return (
    <div className="modal-backdrop" onClick={() => setScreen('world')}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>CRAFTING — SMITHY</h3>
          <button onClick={() => setScreen('world')}>Close</button>
        </div>
        <div className="modal-body">
          {RECIPES.map((r) => {
            const result = getItem(r.result.itemId);
            const ok = canCraft(r.inputs, r.requiredLevel);
            return (
              <div key={r.id} className="recipe">
                <div className="info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {result && <img className="icon-img sm" src={iconFor(result.id)} alt="" />}
                    <b>{r.name}</b>{' '}
                    <small>
                      → {r.result.count}× {result?.name}
                    </small>
                  </div>
                  <small>
                    Requires Lv.{r.requiredLevel} ·{' '}
                    {r.inputs
                      .map(
                        (i) =>
                          `${i.count}× ${getItem(i.itemId)?.name ?? i.itemId}`,
                      )
                      .join(', ')}
                  </small>
                </div>
                <button disabled={!ok} onClick={() => craft(r.id)}>
                  Craft
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
