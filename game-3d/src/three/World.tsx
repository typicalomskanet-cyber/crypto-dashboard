import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Avatar } from "./Avatar";
import { Mob } from "./Mob";
import type { Player, PlacedBuilding } from "../types";
import { MOBS } from "../data/mobs";
import { BUILDINGS, CITY_HALF, CITY_TILE_SIZE } from "../data/buildings";

const WORLD_HALF = 24;

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
}

export default function World(props: WorldProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 6, 9], fov: 48 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#070a1a"]} />
      <fog attach="fog" args={["#070a1a", 22, 55]} />
      <ambientLight intensity={0.55} color="#9aa8ff" />
      <hemisphereLight args={["#5a78ff", "#101428", 0.55]} />
      <directionalLight
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
      <Suspense fallback={null}>
        <Ground />
        <Decor />
        <CityFootprint city={props.city} placed />
        <Scene {...props} />
      </Suspense>
    </Canvas>
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
  const { camera } = useThree();
  const lastAttack = useRef(0);
  const [walking, setWalking] = useState(false);
  const [attackKey, setAttackKey] = useState(0);

  useFrame((_, dt) => {
    const p = playerRef.current;
    if (!p) return;
    const speed = 5;
    const m = props.movementInput;
    const dx = m.x;
    const dz = m.z;
    const mag = Math.hypot(dx, dz);
    if (mag > 0.1) {
      // Move in camera-aligned frame
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
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
    } else {
      setWalking(false);
    }

    // Persist to player.pos so the parent state can survive reloads
    props.player.pos = [p.position.x, 0, p.position.z];

    // Camera follow (third-person)
    const off = new THREE.Vector3(0, 4.2, 7.0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      p.rotation.y,
    );
    const desiredCam = p.position.clone().add(off);
    camera.position.lerp(desiredCam, Math.min(1, dt * 4));
    camTarget.current.lerp(p.position.clone().add(new THREE.Vector3(0, 1.4, 0)), Math.min(1, dt * 4));
    camera.lookAt(camTarget.current);

    // Auto-attack selected mob if in range (every 1.0s)
    if (props.selectedMob) {
      const m = props.mobs.find(x => x.uid === props.selectedMob);
      if (m && m.hp > 0) {
        const dist = Math.hypot(p.position.x - m.pos[0], p.position.z - m.pos[2]);
        if (dist < 2.4) {
          if (performance.now() - lastAttack.current > 1000) {
            lastAttack.current = performance.now();
            setAttackKey(k => k + 1);
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
        <Avatar
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
            onPick={() => props.onSelectMob(m.uid)}
          />
        );
      })}

      {/* Click on empty ground = deselect */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, 0]}
        visible={false}
        onPointerDown={() => props.onSelectMob(null)}
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
