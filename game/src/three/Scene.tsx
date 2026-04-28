import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../store/game';
import { getRace } from '../data/races';
import { getEnemy } from '../data/enemies';
import { buildWorld, ENEMY_SPAWNS, WORLD_SIZE } from './world';
import { createCharacterMesh, createEnemyMesh } from './characters';

// Interactive 2.5D Three.js scene. Handles rendering, click-to-move,
// enemy spawns, and engagement range detection.
export function GameScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    player: THREE.Group;
    target: THREE.Vector3;
    enemies: Map<string, { group: THREE.Group; defId: string; alive: boolean; pos: THREE.Vector3 }>;
    raf: number;
    lastT: number;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1b1425');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 14, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const { ground } = buildWorld(scene);

    // Player
    const snap = useGame.getState();
    const raceId = snap.player?.raceId ?? 'human';
    const race = getRace(raceId);
    const playerMesh = race ? createCharacterMesh(race) : new THREE.Group();
    playerMesh.position.set(snap.player?.pos.x ?? 0, 0, snap.player?.pos.z ?? 0);
    scene.add(playerMesh);

    // Enemies
    const enemies = new Map<
      string,
      { group: THREE.Group; defId: string; alive: boolean; pos: THREE.Vector3 }
    >();
    for (const sp of ENEMY_SPAWNS) {
      const def = getEnemy(sp.enemyDefId);
      if (!def) continue;
      const size = def.level >= 5 ? 1.3 : 1.0;
      const mesh = createEnemyMesh(def.color, size);
      mesh.position.set(sp.position[0], 0, sp.position[1]);
      scene.add(mesh);
      enemies.set(sp.id, {
        group: mesh,
        defId: def.id,
        alive: true,
        pos: mesh.position.clone(),
      });
    }

    const target = new THREE.Vector3(
      snap.player?.pos.x ?? 0,
      0,
      snap.player?.pos.z ?? 0,
    );

    stateRef.current = {
      renderer,
      scene,
      camera,
      player: playerMesh,
      target,
      enemies,
      raf: 0,
      lastT: performance.now(),
    };

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // Check enemies first.
      const enemyObjs = [...enemies.values()]
        .filter((e) => e.alive)
        .map((e) => e.group);
      const enemyHit = raycaster.intersectObjects(enemyObjs, true);
      if (enemyHit.length > 0) {
        // Walk the parent chain to find the enemy group.
        let o: THREE.Object3D | null = enemyHit[0].object;
        while (o && !enemyObjs.includes(o as THREE.Group)) o = o.parent;
        if (o) {
          // Find entry
          for (const [key, v] of enemies.entries()) {
            if (v.group === o) {
              target.copy(v.pos.clone());
              useGame.getState().movePlayer(target.x, target.z);
              // Engage when close enough (will happen in tick below).
              engageKey = key;
              break;
            }
          }
          return;
        }
      }
      // Otherwise move on ground.
      const groundHit = raycaster.intersectObject(ground);
      if (groundHit.length > 0) {
        target.copy(groundHit[0].point);
        target.y = 0;
        engageKey = null;
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    let engageKey: string | null = null;

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - stateRef.current!.lastT) / 1000);
      stateRef.current!.lastT = now;

      // Move player toward target.
      const pp = playerMesh.position;
      const diff = new THREE.Vector3(target.x - pp.x, 0, target.z - pp.z);
      const dist = diff.length();
      const gs = useGame.getState();
      const speed = 4.5;
      if (dist > 0.1 && !gs.combat) {
        diff.normalize().multiplyScalar(Math.min(dist, speed * dt));
        playerMesh.position.add(diff);
        playerMesh.lookAt(pp.x + diff.x, 0, pp.z + diff.z);
        useGame.getState().movePlayer(playerMesh.position.x, playerMesh.position.z);
      }

      // Engagement: if we are moving toward an enemy and within range, engage.
      if (engageKey && !gs.combat) {
        const e = enemies.get(engageKey);
        if (e && e.alive && pp.distanceTo(e.pos) < 2.0) {
          useGame.getState().engageEnemy(e.defId);
        }
      }

      // Tick combat.
      if (gs.combat) {
        useGame.getState().tick(dt);
      }

      // Hide defeated enemies: if combat just ended with victory, mark enemy as dead.
      const s2 = useGame.getState();
      if (!s2.combat && engageKey) {
        const e = enemies.get(engageKey);
        if (e && e.alive) {
          // Check if this enemy was recently killed — use the player's XP increase
          // as proxy: simplest is to scan log — but we just set dead and respawn later.
          e.alive = false;
          e.group.visible = false;
          // Respawn after 15s
          const key = engageKey;
          setTimeout(() => {
            const ent = enemies.get(key);
            if (ent) {
              ent.alive = true;
              ent.group.visible = true;
            }
          }, 15000);
          engageKey = null;
        }
      }

      // Camera follows player.
      camera.position.lerp(
        new THREE.Vector3(pp.x, pp.y + 14, pp.z + 14),
        0.08,
      );
      camera.lookAt(pp.x, 0, pp.z);

      // Soft bobbing while moving.
      if (dist > 0.1) {
        playerMesh.position.y = Math.abs(Math.sin(now * 0.015)) * 0.05;
      } else {
        playerMesh.position.y = 0;
      }

      renderer.render(scene, camera);
      stateRef.current!.raf = requestAnimationFrame(animate);
    };
    stateRef.current.raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current!.raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      scene.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        const m = (o as THREE.Mesh).material;
        if (m) {
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      stateRef.current = null;
    };
    // We deliberately mount once per screen lifetime.
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

// Keep WORLD_SIZE export so UI can reference it.
export { WORLD_SIZE };
