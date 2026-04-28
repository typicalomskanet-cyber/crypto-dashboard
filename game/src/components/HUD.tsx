import { useGame } from '../store/game';
import { getClass } from '../data/races';
import { getEnemy } from '../data/enemies';
import { totalStats, xpToNext } from '../game/stats';

export function HUD() {
  const player = useGame((s) => s.player);
  const combat = useGame((s) => s.combat);
  const setScreen = useGame((s) => s.setScreen);
  const castSkill = useGame((s) => s.castSkill);
  const consumeItem = useGame((s) => s.consumeItem);
  const floatingTexts = useGame((s) => s.floatingTexts);

  if (!player) return null;
  const cls = getClass(player.classId);
  const stats = totalStats(player);
  const hpPct = Math.max(0, (player.hp / stats.hp) * 100);
  const mpPct = Math.max(0, (player.mp / Math.max(1, stats.mp)) * 100);
  const xpPct = (player.xp / xpToNext(player.level)) * 100;

  const enemyDef = combat ? getEnemy(combat.enemyDefId) : null;
  const enemyPct = combat ? Math.max(0, (combat.enemyHp / combat.enemyMaxHp) * 100) : 0;

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="player-panel">
          <div className="row">
            <span className="name">{cls?.name ?? 'Hero'}</span>
            <span>Lv.{player.level}</span>
          </div>
          <div className="row">
            <span>HP</span>
            <span>
              {Math.round(player.hp)}/{Math.round(stats.hp)}
            </span>
          </div>
          <div className="bar hp">
            <div style={{ width: `${hpPct}%` }} />
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span>MP</span>
            <span>
              {Math.round(player.mp)}/{Math.round(stats.mp)}
            </span>
          </div>
          <div className="bar mp">
            <div style={{ width: `${mpPct}%` }} />
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span>XP</span>
            <span>
              {Math.floor(player.xp)}/{xpToNext(player.level)}
            </span>
          </div>
          <div className="bar xp">
            <div style={{ width: `${xpPct}%` }} />
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span style={{ color: 'var(--gold)' }}>{player.gold} G</span>
            {player.level >= 10 && (
              <span style={{ color: 'var(--rarity-epic)' }}>City unlocked</span>
            )}
          </div>
        </div>

        <div className="menu-buttons">
          <button onClick={() => setScreen('inventory')}>Inventory</button>
          <button onClick={() => setScreen('crafting')}>Crafting</button>
          <button onClick={() => setScreen('lootboxes')}>Chests</button>
          <button
            disabled={player.level < 10}
            title={player.level < 10 ? 'Unlocks at level 10' : 'Build your city'}
            onClick={() => setScreen('city')}
          >
            City
          </button>
          <button
            onClick={() => {
              if (confirm('Return to title (your progress is auto-saved)?')) {
                useGame.getState().setScreen('title');
              }
            }}
          >
            Menu
          </button>
        </div>

        {enemyDef && combat && (
          <div
            className="player-panel"
            style={{ borderColor: 'var(--accent)' }}
          >
            <div className="row">
              <span className="name" style={{ color: '#ffb0b0' }}>
                {enemyDef.name}
              </span>
              <span>Lv.{enemyDef.level}</span>
            </div>
            <div className="row">
              <span>HP</span>
              <span>
                {Math.round(combat.enemyHp)}/{combat.enemyMaxHp}
              </span>
            </div>
            <div className="bar hp">
              <div style={{ width: `${enemyPct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="skills-bar">
        {cls?.skills.map((s) => {
          const cd = combat?.skillCooldowns[s.id] ?? 0;
          const disabled = !combat || player.mp < s.mpCost || cd > 0;
          return (
            <button
              key={s.id}
              className={`skill-slot ${cd > 0 ? 'cd' : ''}`}
              data-cd={Math.ceil(cd)}
              disabled={disabled}
              title={`${s.name}\n${s.description}\nMP ${s.mpCost} · CD ${s.cooldown}s`}
              onClick={() => castSkill(s.id)}
            >
              <div style={{ fontSize: 18 }}>✦</div>
              <div>{s.name}</div>
            </button>
          );
        })}
        <button
          className="skill-slot"
          disabled={!player.inventory.find((i) => i.itemId === 'potion_hp_s')}
          title="Use Healing Draught"
          onClick={() => consumeItem('potion_hp_s')}
        >
          <div style={{ fontSize: 22 }}>🧪</div>
          <div>HP</div>
        </button>
        <button
          className="skill-slot"
          disabled={!player.inventory.find((i) => i.itemId === 'potion_mp_s')}
          title="Use Mana Draught"
          onClick={() => consumeItem('potion_mp_s')}
        >
          <div style={{ fontSize: 22 }}>🔮</div>
          <div>MP</div>
        </button>
      </div>

      {combat && (
        <div className="log">
          {combat.log
            .slice()
            .reverse()
            .map((l, i) => (
              <div key={i} className={l.kind}>
                {l.text}
              </div>
            ))}
        </div>
      )}

      {floatingTexts.map((t) => (
        <div
          key={t.id}
          className="float-text"
          style={{ color: t.color, left: `${50 + t.x * 10}%`, top: `${40 + t.y * 10}%` }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
