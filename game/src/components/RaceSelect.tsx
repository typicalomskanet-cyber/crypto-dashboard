import { useGame } from '../store/game';
import { RACE_DEFS, getRace } from '../data/races';
import { RacePreview } from './RacePreview';

export function RaceSelect() {
  const selectedRace = useGame((s) => s.selectedRace);
  const selectedClassId = useGame((s) => s.selectedClassId);
  const selectRace = useGame((s) => s.selectRace);
  const selectClass = useGame((s) => s.selectClass);
  const startGame = useGame((s) => s.startGame);
  const setScreen = useGame((s) => s.setScreen);

  const race = selectedRace ? getRace(selectedRace) : null;

  return (
    <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: '24px 12px' }}>
      <h1 style={{ textAlign: 'center', margin: '0 0 4px', color: 'var(--accent-2)', letterSpacing: '0.1em' }}>
        Choose Your Bloodline
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: 0 }}>
        Chronicle of Devil Gods — Character Creation
      </p>

      <div className="race-grid">
        {RACE_DEFS.map((r) => (
          <div
            key={r.id}
            className={`race-card ${selectedRace === r.id ? 'selected' : ''}`}
            onClick={() => selectRace(r.id)}
          >
            <RacePreview race={r} />
            <h3>{r.name}</h3>
            <p>{r.lore}</p>
          </div>
        ))}
      </div>

      {race && (
        <>
          <h2 style={{ textAlign: 'center', color: 'var(--text-dim)', letterSpacing: '0.15em', fontSize: 16 }}>
            SELECT A CLASS
          </h2>
          <div className="class-list">
            {race.classes.map((c) => (
              <div
                key={c.id}
                className={`class-card ${selectedClassId === c.id ? 'selected' : ''}`}
                onClick={() => selectClass(c.id)}
              >
                <h4>{c.name}</h4>
                <small>{c.role.toUpperCase()}</small>
                <p>
                  HP {c.baseStats.hp} · MP {c.baseStats.mp} · ATK {c.baseStats.atk} · DEF{' '}
                  {c.baseStats.def} · MATK {c.baseStats.matk}
                </p>
                <p style={{ color: 'var(--accent-2)' }}>
                  Skills: {c.skills.map((s) => s.name).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <button onClick={() => setScreen('title')}>Back</button>
        <button
          className="cta"
          disabled={!selectedRace || !selectedClassId}
          onClick={() => startGame()}
        >
          Enter the World
        </button>
      </div>
    </div>
  );
}
