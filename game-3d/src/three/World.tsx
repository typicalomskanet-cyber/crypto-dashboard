import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFAvatar } from "./GLTFAvatar";
import { Mob } from "./Mob";
import type { Player, PlacedBuilding } from "../types";
import { MOBS } from "../data/mobs";
import { BUILDINGS, CITY_HALF, CITY_TILE_SIZE } from "../data/buildings";

const WORLD_HALF = 24;

export type CameraMode = "thirdPerson" | "topDown";

export interface MobInstance {
  uid: string;
  defId: string;
  pos: [number, number, number];
  hp: number;
  /** Spawn point — used for respawn and aggro range. */
  home: [number, number, number];
  aggro: boolean;
  /** ms since alive */
  deadUntil?: number;
}

export interface WorldProps {
  player: Player;
  mobs: MobInstance[];
  selectedMob: string | null;
  movementInput: { x: number; z: number };
  onSelectMob: (uid: string | null) => void;
  /** Show city footprint — buildings the player has placed. */
  city: PlacedBuilding[];
  /** Camera mode (third-person follow vs top-down view). */
  cameraMode?: CameraMode;
  /** Zoom level [0..1]; bigger = further from player. */
  zoom?: number;
  /** Notify parent when zoom changes via wheel/pinch. */
  onZoomChange?: (z: number) => void;
  /** Periodic player world-position update for mini-map. */
  onPlayerPos?: (pos: [number, number]) => void;
}

export default function World(props: WorldProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 6, 9], fov: 48 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <DayNight />
      <Suspense fallback={null}>
        <Ground />
        <Decor />
        <CityFootprint city={props.city} placed />
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}

/**
 * Animated day-night cycle. Drives:
 *  - directional light position (sun arc)
 *  - directional light color/intensity (warm noon → cool dusk → moon blue)
 *  - ambient and hemisphere intensities
 *  - scene background + fog color
 *
 * Cycle period: ~3 minutes per full day (controlled by SPEED).
 */
function DayNight() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();
  // Phase 0..1 — 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
  const phaseRef = useRef(0.45); // start mid-morning
  const SPEED = 1 / 180; // 1/180 → 180 sec per cycle
  // Reusable colors
  const noonSun = useMemo(() => new THREE.Color("#fff5d8"), []);
  const duskSun = useMemo(() => new THREE.Color("#ff8a4a"), []);
  const moon = useMemo(() => new THREE.Color("#5a78ff"), []);
  const noonBg = useMemo(() => new THREE.Color("#0c1633"), []);
  const nightBg = useMemo(() => new THREE.Color("#040616"), []);
  const duskBg = useMemo(() => new THREE.Color("#1a1024"), []);
  useFrame((_, dt) => {
    phaseRef.current = (phaseRef.current + dt * SPEED) % 1;
    const p = phaseRef.current;
    // angle along sun arc (radians)
    const a = (p - 0.25) * Math.PI * 2; // 0 at sunrise, π at sunset
    const sx = Math.cos(a) * 18;
    const sy = Math.sin(a) * 22;
    const sz = 6 + Math.sin(a * 0.5) * 4;
    if (dirRef.current) {
      dirRef.current.position.set(sx, Math.max(2, sy), sz);
      // intensity falls below horizon
      const dayFactor = Math.max(0, Math.sin(a)); // 0 at night, 1 at noon
      dirRef.current.intensity = 0.05 + dayFactor * 1.85;
      // color: dusk warm at low angle, near-white at high
      const c = duskSun.clone().lerp(noonSun, dayFactor);
      // Mix moon blue when very dark
      if (dayFactor < 0.15) {
        c.lerp(moon, 1 - dayFactor / 0.15);
      }
      dirRef.current.color.copy(c);
    }
    if (ambRef.current) {
      const dayFactor = Math.max(0, Math.sin(a));
      ambRef.current.intensity = 0.25 + dayFactor * 0.4;
      ambRef.current.color
        .copy(moon)
        .lerp(new THREE.Color("#dde6ff"), dayFactor);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.35 + Math.max(0, Math.sin(a)) * 0.45;
    }
    // Background + fog
    const dayFactor = Math.max(0, Math.sin(a));
    const duskFactor = Math.max(0, 1 - Math.abs(p - 0.75) * 8); // peak at p=0.75
    const bg =
      dayFactor > 0.05
        ? nightBg.clone().lerp(noonBg, dayFactor)
        : duskFactor > 0.1
        ? nightBg.clone().lerp(duskBg, duskFactor)
        : nightBg.clone();
    scene.background = bg;
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(bg);
  });
  return (
    <>
      <ambientLight ref={ambRef} intensity={0.55} color="#9aa8ff" />
      <hemisphereLight ref={hemiRef} args={["#5a78ff", "#101428", 0.55]} />
      <directionalLight
        ref={dirRef}
        position={[14, 18, 6]}
        intensity={1.6}
        color="#fff5d8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <fog attach="fog" args={["#070a1a", 22, 55]} />
    </>
  );
}

function Ground() {
  const tex = useMemo(() => buildGroundTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[WORLD_HALF * 2, WORLD_HALF * 2]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
}

function Decor() {
  // Scattered dead trees + standing stones
  const items = useMemo(() => {
    const rng = mulberry32(1234);
    const out: { kind: "tree" | "stone"; pos: [number, number, number]; rot: number }[] = [];
    for (let i = 0; i < 36; i++) {
      const r = 6 + rng() * (WORLD_HALF - 7);
      const a = rng() * Math.PI * 2;
      const p: [number, number, number] = [Math.cos(a) * r, 0, Math.sin(a) * r];
      out.push({ kind: rng() > 0.45 ? "tree" : "stone", pos: p, rot: rng() * Math.PI * 2 });
    }
    return out;
  }, []);

  return (
    <group>
      {items.map((d, i) =>
        d.kind === "tree" ? (
          <DeadTree key={i} position={d.pos} rotY={d.rot} />
        ) : (
          <Stone key={i} position={d.pos} rotY={d.rot} />
        ),
      )}
    </group>
  );
}

function DeadTree({ position, rotY }: { position: [number, number, number]; rotY: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 2.2, 6]} />
        <meshStandardMaterial color="#2c241a" roughness={0.95} />
      </mesh>
      {[-0.3, 0.3].map((x, i) => (
        <mesh
          key={i}
          castShadow
          position={[x, 1.6, 0]}
          rotation={[0, 0, x > 0 ? -0.6 : 0.6]}
        >
          <cylinderGeometry args={[0.05, 0.08, 0.9, 5]} />
          <meshStandardMaterial color="#2c241a" />
        </mesh>
      ))}
    </group>
  );
}

function Stone({ position, rotY }: { position: [number, number, number]; rotY: number }) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={[position[0], 0.4, position[2]]}
      rotation={[0, rotY, 0]}
    >
      <dodecahedronGeometry args={[0.55]} />
      <meshStandardMaterial color="#3a3d4a" roughness={0.95} />
    </mesh>
  );
}

function CityFootprint({ city, placed }: { city: PlacedBuilding[]; placed?: boolean }) {
  if (!placed || city.length === 0) return null;
  return (
    <group position={[0, 0, 0]}>
      {city.map((b, idx) => {
        const def = BUILDINGS.find(d => d.id === b.defId);
        if (!def) return null;
        const wx = b.tx * CITY_TILE_SIZE;
        const wz = b.tz * CITY_TILE_SIZE;
        const w = def.size * CITY_TILE_SIZE * 0.95;
        const h = def.size * 1.2;
        return (
          <group key={idx} position={[wx, 0, wz]} rotation={[0, (b.rot * Math.PI) / 2, 0]}>
            <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
              <boxGeometry args={[w, h, w]} />
              <meshStandardMaterial color={def.color} roughness={0.85} />
            </mesh>
            {/* roof */}
            <mesh castShadow position={[0, h + 0.3, 0]}>
              <coneGeometry args={[w * 0.75, 0.6, 4]} />
              <meshStandardMaterial color="#2a2538" roughness={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Scene(props: WorldProps) {
  const playerRef = useRef<THREE.Group>(null);
  const camTarget = useRef(new THREE.Vector3(0, 1, 0));
  const { camera, gl } = useThree();
  const lastAttack = useRef(0);
  const [walking, setWalking] = useState(false);
  const [attackKey, setAttackKey] = useState(0);
  const [mobAttackKeys, setMobAttackKeys] = useState<Record<string, number>>({});
  const posTickRef = useRef(0);
  /** Diablo-style click-to-move target. Cleared when reached or new input. */
  const moveTargetRef = useRef<THREE.Vector3 | null>(null);
  /** When set, walk toward this mob and auto-attack on arrival. */
  const chaseMobRef = useRef<string | null>(null);

  // Zoom state — controlled by parent or local fallback.
  const zoomRef = useRef(props.zoom ?? 0.5);
  useEffect(() => {
    zoomRef.current = props.zoom ?? zoomRef.current;
  }, [props.zoom]);

  // Wheel + pinch zoom on the canvas DOM element.
  useEffect(() => {
    const dom = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = THREE.MathUtils.clamp(zoomRef.current + e.deltaY * 0.0012, 0, 1);
      zoomRef.current = next;
      props.onZoomChange?.(next);
    };
    let pinchStartDist = 0;
    let pinchStartZoom = 0.5;
    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDist = dist(e.touches[0], e.touches[1]);
        pinchStartZoom = zoomRef.current;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const d = dist(e.touches[0], e.touches[1]);
        const ratio = pinchStartDist / d;
        const next = THREE.MathUtils.clamp(pinchStartZoom * ratio, 0, 1);
        zoomRef.current = next;
        props.onZoomChange?.(next);
      }
    };
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    dom.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("touchmove", onTouchMove);
    };
  }, [gl, props]);

  useFrame((_, dt) => {
    const p = playerRef.current;
    if (!p) return;
    const speed = 5;
    const m = props.movementInput;
    const dx = m.x;
    const dz = m.z;
    const mag = Math.hypot(dx, dz);
    const mode: CameraMode = props.cameraMode ?? "thirdPerson";

    // === Diablo-style click-to-move (chase mob if set, else walk to point) ===
    // Joystick/WASD takes priority and clears any pending target.
    if (mag > 0.1) {
      moveTargetRef.current = null;
      chaseMobRef.current = null;
    } else if (chaseMobRef.current) {
      const mob = props.mobs.find(x => x.uid === chaseMobRef.current);
      if (mob && !mob.deadUntil) {
        moveTargetRef.current = new THREE.Vector3(mob.pos[0], 0, mob.pos[2]);
      } else {
        chaseMobRef.current = null;
        moveTargetRef.current = null;
      }
    }

    if (mag > 0.1) {
      // Joystick/WASD: move in camera-aligned frame.
      let camDir: THREE.Vector3;
      if (mode === "topDown") {
        // Use camera projection on XZ so isometric W goes "up the screen".
        camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, -1);
        camDir.normalize();
      } else {
        camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();
      }
      const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0));
      const move = new THREE.Vector3()
        .addScaledVector(camDir, -dz)
        .addScaledVector(right, dx)
        .normalize()
        .multiplyScalar(speed * dt * Math.min(1, mag));
      p.position.x = THREE.MathUtils.clamp(p.position.x + move.x, -WORLD_HALF + 1, WORLD_HALF - 1);
      p.position.z = THREE.MathUtils.clamp(p.position.z + move.z, -WORLD_HALF + 1, WORLD_HALF - 1);
      const targetRot = Math.atan2(move.x, move.z);
      const cur = p.rotation.y;
      let delta = targetRot - cur;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      p.rotation.y += delta * Math.min(1, dt * 12);
      setWalking(true);
    } else if (moveTargetRef.current) {
      // Click-to-move: walk along a straight line to the target.
      const t = moveTargetRef.current;
      const dxw = t.x - p.position.x;
      const dzw = t.z - p.position.z;
      const dist = Math.hypot(dxw, dzw);
      // Stop within attack range when chasing a mob, else within 0.25.
      const stopAt = chaseMobRef.current ? 1.8 : 0.25;
      if (dist < stopAt) {
        moveTargetRef.current = null;
        setWalking(false);
      } else {
        const nx = dxw / dist;
        const nz = dzw / dist;
        const step = Math.min(dist - stopAt * 0.95, speed * dt);
        p.position.x = THREE.MathUtils.clamp(
          p.position.x + nx * step,
          -WORLD_HALF + 1,
          WORLD_HALF - 1,
        );
        p.position.z = THREE.MathUtils.clamp(
          p.position.z + nz * step,
          -WORLD_HALF + 1,
          WORLD_HALF - 1,
        );
        const targetRot = Math.atan2(nx, nz);
        const cur = p.rotation.y;
        let delta = targetRot - cur;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        p.rotation.y += delta * Math.min(1, dt * 12);
        setWalking(true);
      }
    } else {
      setWalking(false);
    }

    // Persist to player.pos so the parent state can survive reloads.
    props.player.pos = [p.position.x, 0, p.position.z];
    // Throttled minimap notification (every ~0.25s)
    posTickRef.current += dt;
    if (posTickRef.current > 0.25) {
      posTickRef.current = 0;
      props.onPlayerPos?.([p.position.x, p.position.z]);
    }

    // --- Camera --------------------------------------------------------------
    const z = zoomRef.current; // 0..1
    let off: THREE.Vector3;
    let lookAtY = 1.4;
    if (mode === "topDown") {
      // Diablo-style isometric: angled (~50°) view, fixed yaw (camera does not
      // rotate with the player). Distance scales smoothly with zoom.
      const dist = THREE.MathUtils.lerp(10, 22, z);
      // 50° pitch ⇒ height = dist*sin(50°), horizontal = dist*cos(50°)
      const pitch = THREE.MathUtils.degToRad(50);
      const horiz = dist * Math.cos(pitch);
      const height = dist * Math.sin(pitch);
      // Fixed yaw 35° gives the classic isometric look (looking south-east).
      const yaw = THREE.MathUtils.degToRad(35);
      off = new THREE.Vector3(
        Math.sin(yaw) * horiz,
        height,
        Math.cos(yaw) * horiz,
      );
      lookAtY = 0.6;
    } else {
      // Third-person follow behind player; zoom maps distance 4..16.
      const dist = THREE.MathUtils.lerp(4, 16, z);
      const heightRatio = THREE.MathUtils.lerp(0.55, 0.7, z);
      off = new THREE.Vector3(0, dist * heightRatio, dist).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        p.rotation.y,
      );
    }
    const desiredCam = p.position.clone().add(off);
    camera.position.lerp(desiredCam, Math.min(1, dt * 5));
    camTarget.current.lerp(
      p.position.clone().add(new THREE.Vector3(0, lookAtY, 0)),
      Math.min(1, dt * 5),
    );
    camera.lookAt(camTarget.current);

    // Auto-attack selected mob if in range (every 1.0s).
    if (props.selectedMob) {
      const m = props.mobs.find(x => x.uid === props.selectedMob);
      if (m && m.hp > 0) {
        const dist = Math.hypot(p.position.x - m.pos[0], p.position.z - m.pos[2]);
        if (dist < 2.4) {
          if (performance.now() - lastAttack.current > 1000) {
            lastAttack.current = performance.now();
            setAttackKey(k => k + 1);
            setMobAttackKeys(prev => ({ ...prev, [m.uid]: (prev[m.uid] ?? 0) + 1 }));
            window.dispatchEvent(
              new CustomEvent("cdg:attack", { detail: { uid: m.uid } }),
            );
          }
        }
      }
    }
  });

  return (
    <group>
      <group ref={playerRef} position={props.player.pos}>
        <GLTFAvatar
          race={props.player.race}
          cls={props.player.cls}
          walking={walking}
          attackKey={attackKey}
        />
        {/* Selection ring on ground */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.7, 0.85, 24]} />
          <meshStandardMaterial
            color="#34a8ff"
            emissive="#34a8ff"
            emissiveIntensity={1.1}
            transparent
            opacity={0.7}
            side={2}
          />
        </mesh>
      </group>

      {props.mobs.map(m => {
        if (m.deadUntil) return null;
        const def = MOBS.find(d => d.id === m.defId)!;
        return (
          <Mob
            key={m.uid}
            def={def}
            position={m.pos}
            hp={m.hp}
            hpMax={def.hp}
            selected={m.uid === props.selectedMob}
            walking={m.aggro}
            attackKey={mobAttackKeys[m.uid]}
            onPick={() => {
              props.onSelectMob(m.uid);
              chaseMobRef.current = m.uid;
              // Set initial target now so the player turns immediately.
              moveTargetRef.current = new THREE.Vector3(m.pos[0], 0, m.pos[2]);
            }}
          />
        );
      })}

      {/* Click on empty ground = walk there (Diablo-style) + deselect mob.
          Invisible plane raycasts to world coords. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.001, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          props.onSelectMob(null);
          chaseMobRef.current = null;
          moveTargetRef.current = new THREE.Vector3(e.point.x, 0, e.point.z);
        }}
      >
        <planeGeometry args={[WORLD_HALF * 2, WORLD_HALF * 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* City build zone marker (lvl 10+) */}
      {props.player.level >= 10 && <CityZoneMarker />}
    </group>
  );
}

function CityZoneMarker() {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry
          args={[CITY_HALF * CITY_TILE_SIZE - 0.2, CITY_HALF * CITY_TILE_SIZE, 64]}
        />
        <meshStandardMaterial
          color="#a060ff"
          emissive="#a060ff"
          emissiveIntensity={1.0}
          transparent
          opacity={0.6}
          side={2}
        />
      </mesh>
    </group>
  );
}

// --- helpers ----------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGroundTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  // base
  const grd = ctx.createRadialGradient(256, 256, 60, 256, 256, 360);
  grd.addColorStop(0, "#1a1d2e");
  grd.addColorStop(1, "#0a0c1a");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 512, 512);
  // grid
  ctx.strokeStyle = "rgba(80,90,140,0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  // cracks
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = `rgba(${50 + Math.random() * 30},${40 + Math.random() * 30},${40 + Math.random() * 30},0.4)`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
    ctx.stroke();
  }
  // specks
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(${100 + Math.random() * 100},${100 + Math.random() * 100},${140 + Math.random() * 60},${Math.random() * 0.4})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export function spawnMobsForLevel(level: number): MobInstance[] {
  // Choose mob pool around player level ±3
  const eligible = MOBS.filter(m => m.level <= level + 3);
  const out: MobInstance[] = [];
  let id = 1;
  for (const def of eligible) {
    const count = def.bossy ? 1 : Math.max(2, 5 - Math.abs(def.level - level));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 14;
      const pos: [number, number, number] = [Math.cos(angle) * r, 0, Math.sin(angle) * r];
      out.push({
        uid: `m-${def.id}-${id++}`,
        defId: def.id,
        pos,
        home: pos,
        hp: def.hp,
        aggro: false,
      });
    }
  }
  return out;
}

export function placeholderTHREE(): typeof THREE {
  return THREE;
}

// World half exported for use elsewhere (e.g. clamp helpers).
export { WORLD_HALF };
