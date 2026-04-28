import { useEffect, useRef } from 'react';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  TilingSprite,
} from 'pixi.js';
import { useGame } from '../store/game';
import { getRace } from '../data/races';
import { getEnemy } from '../data/enemies';
import {
  frozenGroundTile,
  pathTile,
  darkTreeSprite,
  rockSprite,
  shrineSprite,
  gateSprite,
} from './textures';
import { characterFrames, enemySprite } from './sprites';

// 2D top-down dark-fantasy world. Tiles are procedurally drawn into 2D
// canvases at startup, uploaded to GPU as Pixi textures, and rendered via
// TilingSprite + sprite batches.

interface EnemySpawn {
  id: string;
  enemyDefId: string;
  position: [number, number];
}

const WORLD_W = 1600;
const WORLD_H = 1200;

const ENEMY_SPAWNS: EnemySpawn[] = [
  { id: 'sp1', enemyDefId: 'e_goblin', position: [220, 160] },
  { id: 'sp2', enemyDefId: 'e_goblin', position: [-200, 240] },
  { id: 'sp3', enemyDefId: 'e_wolf', position: [380, -320] },
  { id: 'sp4', enemyDefId: 'e_wolf', position: [-400, -240] },
  { id: 'sp5', enemyDefId: 'e_orc_raider', position: [-560, 480] },
  { id: 'sp6', enemyDefId: 'e_orc_raider', position: [560, 480] },
  { id: 'sp7', enemyDefId: 'e_shade', position: [0, -560] },
];

interface EnemyEntry {
  defId: string;
  sprite: Sprite;
  alive: boolean;
  pos: { x: number; y: number };
  bobOffset: number;
}

interface PlayerEntry {
  container: Container;
  idle: Sprite;
  attack: Sprite;
}

function detectPerfTier(): { dprCap: number; antialias: boolean; maxFPS: number } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const lowEnd = isMobile || mem < 4 || cores < 4;
  return {
    dprCap: lowEnd ? 1.25 : 1.75,
    antialias: false, // pixel-art crisp regardless
    maxFPS: lowEnd ? 50 : 60,
  };
}

export function GameScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let destroyed = false;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const tier = detectPerfTier();
      const app = new Application();
      await app.init({
        width: mount.clientWidth,
        height: mount.clientHeight,
        backgroundColor: 0x0a0410,
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

      // Crisp pixel-art rendering for upscaled procedural textures.
      const groundTex = Texture.from(frozenGroundTile());
      groundTex.source.scaleMode = 'nearest';
      const pathTex = Texture.from(pathTile());
      pathTex.source.scaleMode = 'nearest';

      // ---- World root ----
      const world = new Container();
      app.stage.addChild(world);

      // Ground tiling layer (covers entire world)
      const ground = new TilingSprite({
        texture: groundTex,
        width: WORLD_W,
        height: WORLD_H,
      });
      ground.x = -WORLD_W / 2;
      ground.y = -WORLD_H / 2;
      world.addChild(ground);

      // Plaza (path tile)
      const plaza = new Sprite(pathTex);
      plaza.width = 320;
      plaza.height = 320;
      plaza.anchor.set(0.5);
      plaza.x = 0;
      plaza.y = 0;
      world.addChild(plaza);

      // Vignette overlay
      const vignette = new Graphics();
      vignette.rect(-WORLD_W / 2, -WORLD_H / 2, WORLD_W, WORLD_H).fill({ color: 0x000000, alpha: 0.0 });
      // Use a soft radial darkening with a circle gradient (Pixi 8 supports gradient fills via Graphics).
      // Simple alternative: draw 4 large dark rectangles as borders.
      const border = new Graphics();
      border.rect(-WORLD_W / 2, -WORLD_H / 2, WORLD_W, 80).fill({ color: 0x000000, alpha: 0.55 });
      border.rect(-WORLD_W / 2, WORLD_H / 2 - 80, WORLD_W, 80).fill({ color: 0x000000, alpha: 0.55 });
      border.rect(-WORLD_W / 2, -WORLD_H / 2, 80, WORLD_H).fill({ color: 0x000000, alpha: 0.55 });
      border.rect(WORLD_W / 2 - 80, -WORLD_H / 2, 80, WORLD_H).fill({ color: 0x000000, alpha: 0.55 });
      world.addChild(border);

      // ---- Decorations: trees and rocks ----
      const treeTexA = Texture.from(darkTreeSprite(7));
      treeTexA.source.scaleMode = 'nearest';
      const treeTexB = Texture.from(darkTreeSprite(33));
      treeTexB.source.scaleMode = 'nearest';
      const rockTexA = Texture.from(rockSprite(11));
      rockTexA.source.scaleMode = 'nearest';
      const rockTexB = Texture.from(rockSprite(23));
      rockTexB.source.scaleMode = 'nearest';

      const decorLayer = new Container();
      world.addChild(decorLayer);
      const decorPlacements: { x: number; y: number; tex: Texture; isTree: boolean }[] = [];
      for (let i = 0; i < 28; i++) {
        const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const z = (Math.sin(i * 78.233) * 43758.5453) % 1;
        const rx = (x - Math.floor(x)) * (WORLD_W * 0.85) - WORLD_W * 0.42;
        const rz = (z - Math.floor(z)) * (WORLD_H * 0.85) - WORLD_H * 0.42;
        if (Math.abs(rx) < 220 && Math.abs(rz) < 220) continue;
        decorPlacements.push({ x: rx, y: rz, tex: i % 2 === 0 ? treeTexA : treeTexB, isTree: true });
      }
      for (let i = 0; i < 18; i++) {
        const x = (Math.sin(i * 31.1 + 1.3) * 43758.5453) % 1;
        const z = (Math.sin(i * 14.7 + 9.1) * 43758.5453) % 1;
        const rx = (x - Math.floor(x)) * (WORLD_W * 0.85) - WORLD_W * 0.42;
        const rz = (z - Math.floor(z)) * (WORLD_H * 0.85) - WORLD_H * 0.42;
        if (Math.abs(rx) < 200 && Math.abs(rz) < 200) continue;
        decorPlacements.push({ x: rx, y: rz, tex: i % 2 === 0 ? rockTexA : rockTexB, isTree: false });
      }

      // Shrine at origin
      const shrineTex = Texture.from(shrineSprite());
      shrineTex.source.scaleMode = 'nearest';
      const shrine = new Sprite(shrineTex);
      shrine.anchor.set(0.5, 1);
      shrine.x = 0;
      shrine.y = 0;
      decorPlacements.push({ x: 0, y: 0, tex: shrineTex, isTree: false });

      // Gate to the north
      const gateTex = Texture.from(gateSprite());
      gateTex.source.scaleMode = 'nearest';
      const gate = new Sprite(gateTex);
      gate.anchor.set(0.5, 1);
      gate.x = 0;
      gate.y = -WORLD_H / 2 + 220;
      decorPlacements.push({ x: 0, y: -WORLD_H / 2 + 220, tex: gateTex, isTree: false });

      // ---- Player ----
      const snap = useGame.getState();
      const raceId = snap.player?.raceId ?? 'human';
      const race = getRace(raceId);
      const frames = race ? characterFrames(race, snap.player?.classId) : null;
      const playerContainer = new Container();
      const playerIdleTex = Texture.from(frames ? frames.idle : darkTreeSprite(0));
      playerIdleTex.source.scaleMode = 'nearest';
      const playerAttackTex = Texture.from(frames ? frames.attack : darkTreeSprite(0));
      playerAttackTex.source.scaleMode = 'nearest';
      const playerIdle = new Sprite(playerIdleTex);
      playerIdle.anchor.set(0.5, 1);
      const playerAttack = new Sprite(playerAttackTex);
      playerAttack.anchor.set(0.5, 1);
      playerAttack.visible = false;
      playerContainer.addChild(playerIdle, playerAttack);
      const player: PlayerEntry = {
        container: playerContainer,
        idle: playerIdle,
        attack: playerAttack,
      };
      // Map game x/z (Three.js coords) -> Pixi x/y at 40px per game unit.
      const SCALE = 40;
      playerContainer.x = (snap.player?.pos.x ?? 0) * SCALE;
      playerContainer.y = (snap.player?.pos.z ?? 0) * SCALE;

      // ---- Enemies ----
      const enemies = new Map<string, EnemyEntry>();
      for (const sp of ENEMY_SPAWNS) {
        const def = getEnemy(sp.enemyDefId);
        if (!def) continue;
        let kind: 'goblin' | 'wolf' | 'orc' | 'shade' = 'goblin';
        if (def.id.includes('wolf')) kind = 'wolf';
        else if (def.id.includes('orc')) kind = 'orc';
        else if (def.id.includes('shade')) kind = 'shade';
        const tex = Texture.from(enemySprite(def.color, kind));
        tex.source.scaleMode = 'nearest';
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5, 1);
        sprite.x = sp.position[0];
        sprite.y = sp.position[1];
        enemies.set(sp.id, {
          defId: def.id,
          sprite,
          alive: true,
          pos: { x: sp.position[0], y: sp.position[1] },
          bobOffset: Math.random() * Math.PI * 2,
        });
      }

      // Add decorations + entities to a Y-sortable container so closer
      // sprites correctly overlap further ones.
      const ySortLayer = new Container();
      world.addChild(ySortLayer);
      for (const d of decorPlacements) {
        const s = new Sprite(d.tex);
        s.anchor.set(0.5, 1);
        s.x = d.x;
        s.y = d.y + 10;
        ySortLayer.addChild(s);
      }
      for (const e of enemies.values()) ySortLayer.addChild(e.sprite);
      ySortLayer.addChild(playerContainer);

      // ---- Camera ----
      const camera = world;
      const updateCamera = () => {
        camera.x = app.screen.width / 2 - playerContainer.x;
        camera.y = app.screen.height / 2 - playerContainer.y;
      };
      updateCamera();

      // ---- Resize ----
      const onResize = () => {
        app.renderer.resize(mount.clientWidth, mount.clientHeight);
      };
      window.addEventListener('resize', onResize);

      // ---- Click-to-move + engagement ----
      let target = { x: playerContainer.x, y: playerContainer.y };
      let engageKey: string | null = null;

      const onPointerDown = (ev: PointerEvent) => {
        const rect = app.canvas.getBoundingClientRect();
        const sx = ev.clientX - rect.left;
        const sy = ev.clientY - rect.top;
        // Convert screen coords to world coords (camera offset).
        const wx = sx - camera.x;
        const wy = sy - camera.y;

        // Hit-test enemies (within sprite bounds).
        let hit: { key: string; entry: EnemyEntry } | null = null;
        for (const [key, e] of enemies) {
          if (!e.alive) continue;
          const dx = wx - e.sprite.x;
          const dy = wy - e.sprite.y + 32;
          if (dx * dx + dy * dy < 36 * 36) {
            hit = { key, entry: e };
            break;
          }
        }
        if (hit) {
          target = { x: hit.entry.pos.x, y: hit.entry.pos.y + 10 };
          useGame.getState().movePlayer(target.x / SCALE, target.y / SCALE);
          engageKey = hit.key;
          return;
        }
        target = { x: wx, y: wy };
        useGame.getState().movePlayer(target.x / SCALE, target.y / SCALE);
        engageKey = null;
      };
      app.canvas.addEventListener('pointerdown', onPointerDown);

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
        if (now - lastFrameDraw < minFrameMs) {
          // Pixi will still render this frame; skip game-state work.
          return;
        }
        lastFrameDraw = now;
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;

        const gs = useGame.getState();
        const speed = 200; // px / sec

        // Move toward target (in screen px coords).
        const dx = target.x - playerContainer.x;
        const dy = target.y - playerContainer.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4 && !gs.combat) {
          const stepLen = Math.min(dist, speed * dt);
          const ux = dx / dist;
          const uy = dy / dist;
          playerContainer.x += ux * stepLen;
          playerContainer.y += uy * stepLen;
          // Face direction (flip horizontally if moving left).
          playerContainer.scale.x = ux < 0 ? -1 : 1;
          useGame.getState().movePlayer(playerContainer.x / SCALE, playerContainer.y / SCALE);
        }

        // Engagement detection.
        if (engageKey && !gs.combat) {
          const e = enemies.get(engageKey);
          if (e && e.alive) {
            const ex = e.pos.x - playerContainer.x;
            const ey = e.pos.y - playerContainer.y;
            if (Math.hypot(ex, ey) < 70) {
              useGame.getState().engageEnemy(e.defId);
              attackFlashUntil = now + 250;
            }
          }
        }

        // Combat tick.
        if (gs.combat) {
          useGame.getState().tick(dt);
          // Visual attack flash on each tick.
          attackFlashUntil = now + 200;
        }

        // Attack pose toggle.
        const attacking = now < attackFlashUntil;
        player.idle.visible = !attacking;
        player.attack.visible = attacking;

        // Mark defeated enemy after combat ends.
        const after = useGame.getState();
        if (!after.combat && engageKey) {
          const e = enemies.get(engageKey);
          if (e && e.alive) {
            e.alive = false;
            e.sprite.visible = false;
            const key = engageKey;
            setTimeout(() => {
              const ent = enemies.get(key);
              if (ent) {
                ent.alive = true;
                ent.sprite.visible = true;
              }
            }, 15000);
            engageKey = null;
          }
        }

        // Ambient bob for living enemies.
        for (const e of enemies.values()) {
          if (e.alive) {
            e.sprite.y = e.pos.y + Math.sin(now * 0.003 + e.bobOffset) * 1.5;
          }
        }

        // Player bob while moving.
        if (dist > 4) {
          playerContainer.skew.y = Math.sin(now * 0.018) * 0.025;
        } else {
          playerContainer.skew.y *= 0.85;
        }

        // Y-sort by y position so closer sprites overlap.
        ySortLayer.children.sort((a, b) => a.y - b.y);

        // Camera follow with easing.
        const tx = app.screen.width / 2 - playerContainer.x;
        const ty = app.screen.height / 2 - playerContainer.y;
        camera.x += (tx - camera.x) * 0.12;
        camera.y += (ty - camera.y) * 0.12;
      });

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        app.canvas.removeEventListener('pointerdown', onPointerDown);
        try { app.destroy(true, { children: true, texture: true }); } catch { /* noop */ }
        if (mount.contains(app.canvas)) mount.removeChild(app.canvas);
      };
      // Keep reference to vignette so TS doesn't complain about unused.
      void vignette;
      void shrine;
      void gate;
    };

    init();

    return () => {
      destroyed = true;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        touchAction: 'none',
      }}
    />
  );
}
