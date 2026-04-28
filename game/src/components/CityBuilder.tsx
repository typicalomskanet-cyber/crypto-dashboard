import { useState } from 'react';
import { useGame } from '../store/game';
import { BUILDINGS, CITY_GRID_SIZE, getBuilding } from '../data/buildings';
import { getItem } from '../data/items';
import { buildingIcon } from '../utils/itemIcon';

export function CityBuilder() {
  const player = useGame((s) => s.player);
  const setScreen = useGame((s) => s.setScreen);
  const placeBuilding = useGame((s) => s.placeBuilding);
  const removeBuildingAt = useGame((s) => s.removeBuildingAt);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [mode, setMode] = useState<'build' | 'remove'>('build');
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!player) return null;

  if (player.level < 10) {
    return (
      <div className="modal-backdrop" onClick={() => setScreen('world')}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>CITY</h3>
            <button onClick={() => setScreen('world')}>Close</button>
          </div>
          <div className="modal-body">
            <p>City building unlocks at Level 10. You are level {player.level}.</p>
          </div>
        </div>
      </div>
    );
  }

  // Build a CITY_GRID_SIZE x CITY_GRID_SIZE grid with occupancy map.
  const occ: (string | null)[][] = Array.from({ length: CITY_GRID_SIZE }, () =>
    Array(CITY_GRID_SIZE).fill(null),
  );
  const origin: Record<string, { buildingId: string; x: number; y: number }> = {};
  for (const p of player.city) {
    const b = getBuilding(p.buildingId);
    if (!b) continue;
    for (let dy = 0; dy < b.size[1]; dy++) {
      for (let dx = 0; dx < b.size[0]; dx++) {
        if (p.x + dx < CITY_GRID_SIZE && p.y + dy < CITY_GRID_SIZE) {
          occ[p.y + dy][p.x + dx] = b.id;
        }
      }
    }
    origin[`${p.x},${p.y}`] = p;
  }

  const tryPlace = (x: number, y: number) => {
    if (mode === 'remove') {
      removeBuildingAt(x, y);
      return;
    }
    if (!selectedBuildingId) {
      setErr('Select a building first.');
      setTimeout(() => setErr(null), 1500);
      return;
    }
    const ok = placeBuilding(selectedBuildingId, x, y);
    if (!ok) {
      setErr('Cannot place here (missing materials, overlap, or out of bounds).');
      setTimeout(() => setErr(null), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setScreen('world')}>
      <div
        className="modal"
        style={{ width: 'min(900px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>CITY OF {player.raceId.toUpperCase()}</h3>
          <button onClick={() => setScreen('world')}>Close</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
            <div>
              <h4 style={{ color: 'var(--text-dim)' }}>BUILDINGS</h4>
              {BUILDINGS.map((b) => {
                const has = b.cost.every((c) => {
                  const s = player.inventory.find((i) => i.itemId === c.itemId);
                  return s && s.count >= c.count;
                });
                return (
                  <div
                    key={b.id}
                    className={`class-card ${selectedBuildingId === b.id ? 'selected' : ''}`}
                    style={{ marginBottom: 6, maxWidth: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedBuildingId(b.id);
                      setMode('build');
                    }}
                  >
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img className="icon-img sm" src={buildingIcon(b.id)} alt="" style={{ filter: `drop-shadow(0 0 4px ${b.color})` }} />
                      {b.name}
                    </h4>
                    <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>
                      {b.description}
                    </p>
                    <small>
                      Size: {b.size[0]}×{b.size[1]} · Cost:{' '}
                      {b.cost
                        .map(
                          (c) =>
                            `${c.count}× ${getItem(c.itemId)?.name ?? c.itemId}`,
                        )
                        .join(', ')}
                    </small>
                    {!has && <div style={{ color: '#ff8080', fontSize: 11 }}>Not enough materials</div>}
                  </div>
                );
              })}
              <button
                onClick={() => {
                  setMode(mode === 'build' ? 'remove' : 'build');
                  setSelectedBuildingId(null);
                }}
                style={{ marginTop: 6 }}
              >
                {mode === 'build' ? 'Remove mode' : 'Build mode'}
              </button>
            </div>
            <div>
              <div
                className="city-grid"
                style={{
                  gridTemplateColumns: `repeat(${CITY_GRID_SIZE}, 1fr)`,
                  maxWidth: 600,
                }}
              >
                {Array.from({ length: CITY_GRID_SIZE * CITY_GRID_SIZE }).map((_, i) => {
                  const x = i % CITY_GRID_SIZE;
                  const y = Math.floor(i / CITY_GRID_SIZE);
                  const bid = occ[y][x];
                  const b = bid ? getBuilding(bid) : null;
                  const isOrigin = Boolean(origin[`${x},${y}`]);
                  const isHover =
                    hover &&
                    selectedBuildingId &&
                    mode === 'build' &&
                    (() => {
                      const bb = getBuilding(selectedBuildingId);
                      if (!bb) return false;
                      return (
                        x >= hover.x &&
                        x < hover.x + bb.size[0] &&
                        y >= hover.y &&
                        y < hover.y + bb.size[1]
                      );
                    })();
                  return (
                    <div
                      key={i}
                      className={`city-cell ${bid ? 'occupied' : ''} ${isHover ? 'hover' : ''}`}
                      style={{ ['--b-color' as string]: b?.color ?? '#333' }}
                      onMouseEnter={() => setHover({ x, y })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => tryPlace(x, y)}
                      title={b?.name ?? 'Empty plot'}
                    >
                      {isOrigin && b && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#fff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                          }}
                        >
                          {b.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 8 }}>
                Mode: <b>{mode}</b>. Click a building tile in remove-mode to demolish it.
                Placed buildings grant passive buffs while you play.
              </p>
            </div>
          </div>
          {err && <div className="toast" style={{ borderColor: 'var(--accent)' }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}
