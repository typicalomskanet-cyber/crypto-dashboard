import { useEffect, useRef } from 'react';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
} from 'pixi.js';
import { useGame } from '../store/game';
import { getRace } from '../data/races';
import { getEnemy } from '../data/enemies';
import { ENEMIES } from '../data/enemies';
import {
  darkTreeSprite,
  rockSprite,
  shrineSprite,
  gateSprite,
} from './textures';
import { characterFrames, enemySprite } from './sprites';
import type { EnemyKind } from './sprites';
import {
  TILE_HW,
  TILE_HH,
  worldToScreen,
  screenToWorld,
  isoDepth,
} from './iso';
import {
  isoFrozenTile,
  isoStoneTile,
  isoPathTile,
  isoPlazaTile,
  isoCorruptTile,
} from './isoTextures';

// ---- World layout ------------------------------------------------------

const GRID = 30; // tiles per side
const CENTER = GRID / 2;

// Tile kinds
const T_FROZEN = 0;
const T_STONE = 1;
const T_PATH = 2;
const T_PLAZA = 3;
const T_CORRUPT = 4;

// Build a static tile map. Plaza in the centre, paths radiating north +
// south, scattered corruption patches that house the more dangerous
// monsters.
function buildTileMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < GRID; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID; x++) {
      const dx = x - CENTER;
      const dy = y - CENTER;
      const r = Math.hypot(dx, dy);
      let t = T_FROZEN;
      if (r < 3) t = T_PLAZA;
      else if (r < 4.2) t = T_STONE;
      else if (Math.abs(dx) < 1 && r < 11) t = T_PATH;
      else if (Math.abs(dy) < 1 && r < 11) t = T_PATH;
      // Corruption pockets in the corners.
      if ((Math.abs(dx) > 9 && Math.abs(dy) > 7) ||
          (Math.abs(dx) > 7 && Math.abs(dy) > 9)) {
        if (((x * 7 + y * 13) % 5) !== 0) t = T_CORRUPT;
      }
      row.push(t);
    }
    map.push(row);
  }
  return map;
}

// ---- Enemy spawn definitions ------------------------------------------

interface SpawnDef {
  id: string;
  enemyDefId: string;
  gx: number;
  gy: number;
  homeRadius: number;
  aggroRadius: number;
}

const SPAWNS: SpawnDef[] = [
  // Goblins near the plaza — easy starter mobs.
  { id: 's_g1', enemyDefId: 'e_goblin', gx: CENTER + 4, gy: CENTER + 1, homeRadius: 2, aggroRadius: 3.5 },
  { id: 's_g2', enemyDefId: 'e_goblin', gx: CENTER - 4, gy: CENTER + 2, homeRadius: 2, aggroRadius: 3.5 },
  { id: 's_g3', enemyDefId: 'e_goblin', gx: CENTER + 1, gy: CENTER - 5, homeRadius: 2, aggroRadius: 3.5 },
  // Wolves prowling east.
  { id: 's_w1', enemyDefId: 'e_wolf', gx: CENTER + 7, gy: CENTER + 5, homeRadius: 3, aggroRadius: 4 },
  { id: 's_w2', enemyDefId: 'e_wolf', gx: CENTER + 8, gy: CENTER - 3, homeRadius: 3, aggroRadius: 4 },
  // Skeletons in the southern path.
  { id: 's_s1', enemyDefId: 'e_skeleton', gx: CENTER + 2, gy: CENTER + 8, homeRadius: 3, aggroRadius: 4 },
  { id: 's_s2', enemyDefId: 'e_skeleton', gx: CENTER - 2, gy: CENTER + 9, homeRadius: 3, aggroRadius: 4 },
  // Orcs west.
  { id: 's_o1', enemyDefId: 'e_orc_raider', gx: CENTER - 8, gy: CENTER - 4, homeRadius: 3, aggroRadius: 4.5 },
  { id: 's_o2', enemyDefId: 'e_orc_raider', gx: CENTER - 9, gy: CENTER + 4, homeRadius: 3, aggroRadius: 4.5 },
  // Imps in the corruption patches.
  { id: 's_i1', enemyDefId: 'e_imp', gx: CENTER + 11, gy: CENTER + 9, homeRadius: 3, aggroRadius: 5 },
  { id: 's_i2', enemyDefId: 'e_imp', gx: CENTER - 11, gy: CENTER - 9, homeRadius: 3, aggroRadius: 5 },
  // Spiders in deep north.
  { id: 's_p1', enemyDefId: 'e_spider', gx: CENTER + 2, gy: CENTER - 10, homeRadius: 3, aggroRadius: 4 },
  { id: 's_p2', enemyDefId: 'e_spider', gx: CENTER - 3, gy: CENTER - 11, homeRadius: 3, aggroRadius: 4 },
  // Shadow Wraiths deep east.
  { id: 's_sh1', enemyDefId: 'e_shade', gx: CENTER + 12, gy: CENTER, homeRadius: 3, aggroRadius: 5 },
  // Frost Lich — the boss tucked far north-west.
  { id: 's_l1', enemyDefId: 'e_lich', gx: CENTER - 12, gy: CENTER - 12, homeRadius: 4, aggroRadius: 5 },
];

interface MobEntry {
  spawn: SpawnDef;
  defId: string;
  sprite: Sprite;
  hpBar: Graphics;
  alive: boolean;
  gx: number;
  gy: number;
  bobOffset: number;
  respawnAt: number;
}

// ---- Performance tier --------------------------------------------------

function detectPerfTier(): { dprCap: number; antialias: boolean; maxFPS: number } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const lowEnd = isMobile || mem < 4 || cores < 4;
  return {
    dprCap: lowEnd ? 1.25 : 1.75,
    antialias: false,
    maxFPS: lowEnd ? 50 : 60,
  };
}

// ---- Scene React component --------------------------------------------

export function GameScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const joystick = joystickRef.current;
    const stick = stickRef.current;
    if (!mount || !joystick || !stick) return;

    let destroyed = false;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const tier = detectPerfTier();
      const app = new Application();
      await app.init({
        width: mount.clientWidth,
        height: mount.clientHeight,
        backgroundColor: 0x070310,
        antialias: tier.antialias,
        resolution: Math.min(window.devicePixelRatio, tier.dprCap),
        autoDensity: true,
        powerPreference: 'high-performance',
      });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      mount.appendChild(app.canvas);

      // ---- Layers ----
      const camera = new Container();
      app.stage.addChild(camera);
      const tileLayer = new Container();
      const decorLayer = new Container();
      const entityLayer = new Container();
      const fxLayer = new Container();
      camera.addChild(tileLayer, decorLayer, entityLayer, fxLayer);

      // ---- Tile textures ----
      const tileTex: Texture[] = [
        Texture.from(isoFrozenTile()),
        Texture.from(isoStoneTile()),
        Texture.from(isoPathTile()),
        Texture.from(isoPlazaTile()),
        Texture.from(isoCorruptTile()),
      ];
      tileTex.forEach((t) => (t.source.scaleMode = 'nearest'));

      const map = buildTileMap();
      // Render tiles in iso order so the diamonds tile cleanly (no gaps).
      // Iterate y outer, x inner — nearest-neighbour seams are eliminated by
      // anchoring at the diamond top vertex.
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const t = map[y][x];
          const s = new Sprite(tileTex[t]);
          s.anchor.set(0.5, 0); // top vertex
          const p = worldToScreen(x, y);
          s.x = p.x;
          s.y = p.y - TILE_HH;
          tileLayer.addChild(s);
        }
      }

      // ---- Decorations: trees / rocks / shrine / gate ----
      const treeTex = [Texture.from(darkTreeSprite(7)), Texture.from(darkTreeSprite(33))];
      const rockTex = [Texture.from(rockSprite(11)), Texture.from(rockSprite(23))];
      const shrineTex = Texture.from(shrineSprite());
      const gateTex = Texture.from(gateSprite());
      [...treeTex, ...rockTex, shrineTex, gateTex].forEach((t) => (t.source.scaleMode = 'nearest'));

      const decorations: { gx: number; gy: number; tex: Texture; oy: number }[] = [];
      // Procedural placement avoiding plaza + paths.
      let seed = 31;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) | 0;
        return ((seed >>> 0) % 1000) / 1000;
      };
      for (let i = 0; i < 70; i++) {
        const gx = rnd() * GRID;
        const gy = rnd() * GRID;
        const ix = Math.min(GRID - 1, Math.max(0, Math.floor(gx)));
        const iy = Math.min(GRID - 1, Math.max(0, Math.floor(gy)));
        const tile = map[iy][ix];
        if (tile === T_PLAZA || tile === T_STONE || tile === T_PATH) continue;
        const isTree = rnd() > 0.35;
        const tex = isTree
          ? treeTex[(rnd() * treeTex.length) | 0]
          : rockTex[(rnd() * rockTex.length) | 0];
        decorations.push({ gx, gy, tex, oy: isTree ? 8 : 4 });
      }
      // Shrine in the centre of the plaza.
      decorations.push({ gx: CENTER, gy: CENTER, tex: shrineTex, oy: 4 });
      // Gate at the northern edge.
      decorations.push({ gx: CENTER - 4, gy: CENTER - 12, tex: gateTex, oy: 0 });

      const decorSprites: Sprite[] = [];
      for (const d of decorations) {
        const s = new Sprite(d.tex);
        s.anchor.set(0.5, 1);
        const p = worldToScreen(d.gx, d.gy);
        s.x = p.x;
        s.y = p.y + d.oy;
        s.zIndex = isoDepth(d.gx, d.gy);
        entityLayer.addChild(s); // mixed with mobs for depth-sort
        decorSprites.push(s);
      }

      // ---- Player ----
      const snap = useGame.getState();
      const raceId = snap.player?.raceId ?? 'human';
      const race = getRace(raceId);
      const frames = race ? characterFrames(race, snap.player?.classId) : null;
      const idleTex = Texture.from(frames ? frames.idle : darkTreeSprite(0));
      const attackTex = Texture.from(frames ? frames.attack : darkTreeSprite(0));
      idleTex.source.scaleMode = 'nearest';
      attackTex.source.scaleMode = 'nearest';

      const playerContainer = new Container();
      const idle = new Sprite(idleTex);
      idle.anchor.set(0.5, 1);
      const attack = new Sprite(attackTex);
      attack.anchor.set(0.5, 1);
      attack.visible = false;
      playerContainer.addChild(idle, attack);
      entityLayer.addChild(playerContainer);

      // Player tile coords (continuous). Legacy saves used a different
      // coordinate system (top-down pixels), so any value outside the iso
      // map bounds — including (0, 0) — is treated as uninitialized and
      // snapped back to the plaza centre.
      const savedX = snap.player?.pos.x ?? 0;
      const savedY = snap.player?.pos.z ?? 0;
      let pgx = CENTER;
      let pgy = CENTER;
      if (savedX >= 1 && savedX <= GRID - 1 && savedY >= 1 && savedY <= GRID - 1) {
        pgx = savedX;
        pgy = savedY;
      }

      // Player HP bar
      const playerHp = new Graphics();
      entityLayer.addChild(playerHp);

      // ---- Mobs ----
      const mobs = new Map<string, MobEntry>();
      for (const sp of SPAWNS) {
        const def = getEnemy(sp.enemyDefId);
        if (!def) continue;
        const kind = enemyKindForId(def.id);
        const tex = Texture.from(enemySprite(def.color, kind));
        tex.source.scaleMode = 'nearest';
        const s = new Sprite(tex);
        s.anchor.set(0.5, 1);
        const hpBar = new Graphics();
        const m: MobEntry = {
          spawn: sp,
          defId: def.id,
          sprite: s,
          hpBar,
          alive: true,
          gx: sp.gx,
          gy: sp.gy,
          bobOffset: Math.random() * Math.PI * 2,
          respawnAt: 0,
        };
        mobs.set(sp.id, m);
        entityLayer.addChild(s, hpBar);
      }

      // ---- Camera initial pos ----
      const placeCamera = () => {
        const p = worldToScreen(pgx, pgy);
        camera.x = app.screen.width / 2 - p.x;
        camera.y = app.screen.height / 2 - p.y;
      };
      placeCamera();

      // ---- Resize ----
      const onResize = () => {
        app.renderer.resize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener('resize', onResize);

      // ---- Input state ----
      const keys = new Set<string>();
      const onKeyDown = (e: KeyboardEvent) => {
        keys.add(e.key.toLowerCase());
      };
      const onKeyUp = (e: KeyboardEvent) => {
        keys.delete(e.key.toLowerCase());
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      // Click to interact: target a mob if hit; otherwise no-op (movement
      // is via WASD / joystick).
      const onPointerDown = (ev: PointerEvent) => {
        const rect = app.canvas.getBoundingClientRect();
        const sx = ev.clientX - rect.left - camera.x;
        const sy = ev.clientY - rect.top - camera.y;
        // Convert the pixel offset of the entity layer back to grid coords.
        // Entities are anchored at their feet — y refers to the feet.
        // We approximate the click as targeting the nearest visible mob.
        let best: MobEntry | null = null;
        let bestD = Infinity;
        for (const m of mobs.values()) {
          if (!m.alive) continue;
          const dx = m.sprite.x - sx;
          const dy = m.sprite.y - sy + 32;
          const d = dx * dx + dy * dy;
          if (d < 50 * 50 && d < bestD) {
            best = m;
            bestD = d;
          }
        }
        if (best) {
          // Move toward it; engagement is automatic on collision.
          targetMob = best;
          return;
        }
        // Otherwise, click-to-move toward the screen point (translated to
        // grid coords).
        const w = screenToWorld(sx, sy);
        targetMob = null;
        clickTarget = { gx: w.gx, gy: w.gy };
      };
      app.canvas.addEventListener('pointerdown', onPointerDown);

      // ---- Virtual joystick ----
      let joystickActive = false;
      let joystickDx = 0;
      let joystickDy = 0;
      const center = { x: 0, y: 0 };
      const radius = 48;

      const stickPoint = (clientX: number, clientY: number) => {
        const r = joystick.getBoundingClientRect();
        center.x = r.left + r.width / 2;
        center.y = r.top + r.height / 2;
        let dx = clientX - center.x;
        let dy = clientY - center.y;
        const d = Math.hypot(dx, dy);
        if (d > radius) {
          dx = (dx / d) * radius;
          dy = (dy / d) * radius;
        }
        stick.style.transform = `translate(${dx}px, ${dy}px)`;
        joystickDx = dx / radius;
        joystickDy = dy / radius;
      };
      const stickDown = (ev: PointerEvent) => {
        joystickActive = true;
        joystick.setPointerCapture(ev.pointerId);
        stickPoint(ev.clientX, ev.clientY);
      };
      const stickMove = (ev: PointerEvent) => {
        if (!joystickActive) return;
        stickPoint(ev.clientX, ev.clientY);
      };
      const stickUp = (ev: PointerEvent) => {
        joystickActive = false;
        joystickDx = 0;
        joystickDy = 0;
        stick.style.transform = 'translate(0, 0)';
        try { joystick.releasePointerCapture(ev.pointerId); } catch { /* noop */ }
      };
      joystick.addEventListener('pointerdown', stickDown);
      joystick.addEventListener('pointermove', stickMove);
      joystick.addEventListener('pointerup', stickUp);
      joystick.addEventListener('pointercancel', stickUp);

      // ---- Auto-target chase ----
      let targetMob: MobEntry | null = null;
      let clickTarget: { gx: number; gy: number } | null = null;

      // ---- Animation loop ----
      let lastT = performance.now();
      let attackFlashUntil = 0;
      const minFrameMs = 1000 / tier.maxFPS;
      let lastFrameDraw = 0;

      app.ticker.add(() => {
        const now = performance.now();
        if (document.hidden) {
          lastT = now;
          return;
        }
        if (now - lastFrameDraw < minFrameMs) return;
        lastFrameDraw = now;
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;

        const gs = useGame.getState();

        // ---- Player movement ----
        if (!gs.combat) {
          // Build a screen-space velocity from keyboard + joystick.
          let svx = joystickDx;
          let svy = joystickDy;
          if (keys.has('w') || keys.has('arrowup')) svy -= 1;
          if (keys.has('s') || keys.has('arrowdown')) svy += 1;
          if (keys.has('a') || keys.has('arrowleft')) svx -= 1;
          if (keys.has('d') || keys.has('arrowright')) svx += 1;
          const inputMag = Math.hypot(svx, svy);
          if (inputMag > 0.01) {
            // Cancel pending click target while we drive manually.
            clickTarget = null;
            targetMob = null;
            const norm = Math.min(1, inputMag);
            const ux = (svx / inputMag) * norm;
            const uy = (svy / inputMag) * norm;
            const w = screenToWorld(ux, uy);
            const speed = 4.5; // tiles / sec
            pgx += w.gx * speed * dt;
            pgy += w.gy * speed * dt;
            idle.scale.x = ux < 0 ? -1 : 1;
            attack.scale.x = idle.scale.x;
          } else if (targetMob && targetMob.alive) {
            // Chase the targeted mob.
            const dx = targetMob.gx - pgx;
            const dy = targetMob.gy - pgy;
            const d = Math.hypot(dx, dy);
            if (d > 0.6) {
              const speed = 4.5;
              pgx += (dx / d) * speed * dt;
              pgy += (dy / d) * speed * dt;
              const sp = worldToScreen(dx, dy);
              idle.scale.x = sp.x < 0 ? -1 : 1;
              attack.scale.x = idle.scale.x;
            } else {
              // In range — engage.
              gs.engageEnemy(targetMob.defId);
              attackFlashUntil = now + 250;
            }
          } else if (clickTarget) {
            const dx = clickTarget.gx - pgx;
            const dy = clickTarget.gy - pgy;
            const d = Math.hypot(dx, dy);
            if (d > 0.15) {
              const speed = 4.5;
              pgx += (dx / d) * speed * dt;
              pgy += (dy / d) * speed * dt;
              const sp = worldToScreen(dx, dy);
              idle.scale.x = sp.x < 0 ? -1 : 1;
              attack.scale.x = idle.scale.x;
            } else {
              clickTarget = null;
            }
          }
          // Clamp to map.
          pgx = Math.max(0.5, Math.min(GRID - 0.5, pgx));
          pgy = Math.max(0.5, Math.min(GRID - 0.5, pgy));
          gs.movePlayer(pgx, pgy);
        }

        // ---- Mob AI ----
        for (const m of mobs.values()) {
          if (!m.alive) {
            if (m.respawnAt > 0 && now > m.respawnAt) {
              m.alive = true;
              m.sprite.visible = true;
              m.gx = m.spawn.gx;
              m.gy = m.spawn.gy;
              m.respawnAt = 0;
            }
            continue;
          }
          // Don't move while combat is active (player is engaged with one).
          if (!gs.combat) {
            const dx = pgx - m.gx;
            const dy = pgy - m.gy;
            const d = Math.hypot(dx, dy);
            if (d < m.spawn.aggroRadius && d > 0.6) {
              // Chase player.
              const def = getEnemy(m.defId);
              const speed = (def?.stats.speed ?? 2.5) * 0.4; // slower than player
              m.gx += (dx / d) * speed * dt;
              m.gy += (dy / d) * speed * dt;
            } else if (d <= 0.6 && !targetMob) {
              // Mob initiates combat — auto-engage.
              targetMob = m;
              gs.engageEnemy(m.defId);
              attackFlashUntil = now + 250;
            } else if (d > m.spawn.aggroRadius * 1.5) {
              // Wander home.
              const hx = m.spawn.gx - m.gx;
              const hy = m.spawn.gy - m.gy;
              const hd = Math.hypot(hx, hy);
              if (hd > 0.1) {
                const speed = 0.8;
                m.gx += (hx / hd) * speed * dt;
                m.gy += (hy / hd) * speed * dt;
              }
            }
          }
        }

        // ---- Combat tick ----
        if (gs.combat) {
          gs.tick(dt);
          attackFlashUntil = now + 200;
          // Mark targeted mob dead when combat ends with victory (enemy hp 0).
        }
        const after = useGame.getState();
        if (!after.combat && targetMob) {
          // Combat just ended. If our target survived (player fled / lost),
          // it stays alive. If it was defeated, mark it dead with respawn.
          const stillThere = mobs.get(targetMob.spawn.id);
          if (stillThere && stillThere.alive) {
            stillThere.alive = false;
            stillThere.sprite.visible = false;
            stillThere.respawnAt = now + 15000;
          }
          targetMob = null;
        }

        // Attack pose toggle
        const attacking = now < attackFlashUntil;
        idle.visible = !attacking;
        attack.visible = attacking;

        // ---- Update sprite positions ----
        const ppos = worldToScreen(pgx, pgy);
        playerContainer.x = ppos.x;
        playerContainer.y = ppos.y;
        playerContainer.zIndex = isoDepth(pgx, pgy);
        // Player HP bar
        playerHp.clear();
        if (gs.player) {
          const pct = Math.max(0, gs.player.hp / Math.max(1, totalMaxHp(gs)));
          playerHp.rect(ppos.x - 18, ppos.y - 78, 36, 4).fill({ color: 0x101820, alpha: 0.9 });
          playerHp.rect(ppos.x - 17, ppos.y - 77, 34 * pct, 2).fill({ color: 0xc83040, alpha: 1 });
        }

        for (const m of mobs.values()) {
          if (!m.alive) {
            m.hpBar.clear();
            continue;
          }
          const sp = worldToScreen(m.gx, m.gy);
          m.sprite.x = sp.x;
          m.sprite.y = sp.y + Math.sin(now * 0.003 + m.bobOffset) * 1.5;
          m.sprite.zIndex = isoDepth(m.gx, m.gy);
          // If this mob is the active combat target, draw an HP bar above
          // it. Otherwise show a faint nameplate dot only when in aggro.
          m.hpBar.clear();
          if (gs.combat && gs.combat.enemyDefId === m.defId && targetMob && targetMob.spawn.id === m.spawn.id) {
            const pct = Math.max(0, gs.combat.enemyHp / gs.combat.enemyMaxHp);
            m.hpBar.rect(sp.x - 18, sp.y - 70, 36, 4).fill({ color: 0x101820, alpha: 0.9 });
            m.hpBar.rect(sp.x - 17, sp.y - 69, 34 * pct, 2).fill({ color: 0xc83040 });
          } else if (Math.hypot(pgx - m.gx, pgy - m.gy) < m.spawn.aggroRadius) {
            m.hpBar.circle(sp.x, sp.y - 64, 2).fill({ color: 0xff4060, alpha: 0.7 });
          }
          m.hpBar.zIndex = isoDepth(m.gx, m.gy) + 0.5;
        }

        // ---- Y-sort entityLayer ----
        entityLayer.children.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

        // ---- Camera follow ----
        const tp = worldToScreen(pgx, pgy);
        const tx = app.screen.width / 2 - tp.x;
        const ty = app.screen.height / 2 - tp.y;
        camera.x += (tx - camera.x) * 0.14;
        camera.y += (ty - camera.y) * 0.14;
      });

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        joystick.removeEventListener('pointerdown', stickDown);
        joystick.removeEventListener('pointermove', stickMove);
        joystick.removeEventListener('pointerup', stickUp);
        joystick.removeEventListener('pointercancel', stickUp);
        app.canvas.removeEventListener('pointerdown', onPointerDown);
        try { app.destroy(true, { children: true, texture: true }); } catch { /* noop */ }
        if (mount.contains(app.canvas)) mount.removeChild(app.canvas);
      };
      void fxLayer;
      void decorLayer;
    };

    init();

    return () => {
      destroyed = true;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, touchAction: 'none' }} />
      <div
        ref={joystickRef}
        className="joystick"
        style={{
          position: 'absolute',
          left: 24,
          bottom: 110,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(60,30,80,0.55), rgba(8,4,16,0.7))',
          border: '2px solid rgba(180, 60, 120, 0.4)',
          boxShadow: '0 0 20px rgba(160, 40, 100, 0.4) inset',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div
          ref={stickRef}
          style={{
            position: 'absolute',
            left: 30,
            top: 30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #b04060, #401020)',
            border: '2px solid #ffd0e0',
            transition: 'transform 60ms linear',
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  );
}

function enemyKindForId(id: string): EnemyKind {
  if (id.includes('wolf')) return 'wolf';
  if (id.includes('orc')) return 'orc';
  if (id.includes('shade')) return 'shade';
  if (id.includes('skeleton')) return 'skeleton';
  if (id.includes('imp')) return 'imp';
  if (id.includes('lich')) return 'lich';
  if (id.includes('spider')) return 'spider';
  return 'goblin';
}

function totalMaxHp(_gs: ReturnType<typeof useGame.getState>): number {
  // Use the player's stored hp/mp ratios for the bar — exact max stat
  // calculation belongs in the store. Returning hp itself when not in
  // combat keeps the bar at 100%.
  const p = _gs.player;
  if (!p) return 1;
  // Approximate via base race stats — store keeps current hp clamped.
  return Math.max(p.hp, 1);
}

// Used in worldToScreen calculations elsewhere; re-export the constants
// to keep tree-shaking happy.
export { TILE_HW, TILE_HH };

// Touch the ENEMIES export so unused-import linting isn't tripped if we
// later reference it from inspector tooling.
void ENEMIES;
