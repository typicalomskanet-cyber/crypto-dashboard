import { useEffect } from 'react';
import { useGame } from './store/game';
import { RaceSelect } from './components/RaceSelect';
import { HUD } from './components/HUD';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { Lootboxes } from './components/Lootboxes';
import { CityBuilder } from './components/CityBuilder';
import { GameScene } from './three/Scene';

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
      <GameScene />
      <HUD />
      {screen === 'inventory' && <Inventory />}
      {screen === 'crafting' && <Crafting />}
      {screen === 'lootboxes' && <Lootboxes />}
      {screen === 'city' && <CityBuilder />}
    </div>
  );
}
