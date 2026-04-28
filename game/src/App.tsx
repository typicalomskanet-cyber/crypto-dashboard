import { lazy, Suspense, useEffect } from 'react';
import { useGame } from './store/game';
import { RaceSelect } from './components/RaceSelect';
import { HUD } from './components/HUD';

// Lazy-load heavy modal screens and the Three.js scene so the title screen
// renders immediately and Three.js / R3F-free chunks can stream in parallel.
const GameScene = lazy(() =>
  import('./pixi/Scene').then((m) => ({ default: m.GameScene })),
);
const Inventory = lazy(() =>
  import('./components/Inventory').then((m) => ({ default: m.Inventory })),
);
const Crafting = lazy(() =>
  import('./components/Crafting').then((m) => ({ default: m.Crafting })),
);
const Lootboxes = lazy(() =>
  import('./components/Lootboxes').then((m) => ({ default: m.Lootboxes })),
);
const CityBuilder = lazy(() =>
  import('./components/CityBuilder').then((m) => ({ default: m.CityBuilder })),
);

function PanelFallback() {
  return <div className="panel-fallback">Loading…</div>;
}

function SceneFallback() {
  return (
    <div className="scene-fallback">
      <div className="loader-glow" />
      <div className="loader-label">Entering the realm…</div>
    </div>
  );
}

export default function App() {
  const screen = useGame((s) => s.screen);
  const player = useGame((s) => s.player);
  const setScreen = useGame((s) => s.setScreen);
  const resetAll = useGame((s) => s.resetAll);

  useEffect(() => {
    // Prevent accidental context menu / pinch zoom on mobile.
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  if (screen === 'title') {
    return (
      <div className="app">
        <div className="bg-mystic" />
        <div className="title-wrap">
          <h1>CHRONICLE OF DEVIL GODS</h1>
          <h2>A realm forged by forgotten flames</h2>
          <div className="title-actions">
            <button
              className="cta"
              onClick={() => {
                if (player) {
                  setScreen('world');
                } else {
                  setScreen('raceSelect');
                }
              }}
            >
              {player ? 'Continue' : 'New Game'}
            </button>
            {player && (
              <button
                onClick={() => {
                  if (confirm('Delete your current hero and start over?')) {
                    resetAll();
                    setScreen('raceSelect');
                  }
                }}
              >
                New Hero
              </button>
            )}
          </div>
          <p style={{ marginTop: 24, color: 'var(--text-dim)', maxWidth: 680, textAlign: 'center', fontSize: 12 }}>
            A 2.5D MMO-action-RPG prototype inspired by classic online fantasy titles. Five
            races, class-based skills, inventory, crafting, transparent gacha chests, and
            city-building unlocked at level 10. Save data is kept locally in your browser.
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'raceSelect') {
    return (
      <div className="app">
        <div className="bg-mystic" />
        <RaceSelect />
      </div>
    );
  }

  return (
    <div className="app">
      <Suspense fallback={<SceneFallback />}>
        <GameScene />
      </Suspense>
      <HUD />
      <Suspense fallback={<PanelFallback />}>
        {screen === 'inventory' && <Inventory />}
        {screen === 'crafting' && <Crafting />}
        {screen === 'lootboxes' && <Lootboxes />}
        {screen === 'city' && <CityBuilder />}
      </Suspense>
    </div>
  );
}
