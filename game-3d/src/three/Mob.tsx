import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MobDef } from "../types";

export interface MobProps {
  def: MobDef;
  position: [number, number, number];
  hp: number;
  hpMax: number;
  selected?: boolean;
  walking?: boolean;
  onPick?: () => void;
}

/**
 * Procedural low-poly mob. Body shape varies a bit by mob id to give
 * silhouette diversity without paying for unique models.
 */
export function Mob({ def, position, hp, hpMax, selected, walking, onPick }: MobProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const torso = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = performance.now() / 1000;
    if (root.current) {
      root.current.position.y = position[1] + (walking ? Math.abs(Math.sin(t * 6)) * 0.05 : 0);
    }
    if (head.current) head.current.rotation.y = Math.sin(t * 1.2) * 0.4;
    if (torso.current) torso.current.rotation.y = Math.sin(t * 0.6) * 0.1;
  });

  const scale = def.scale ?? 1;
  const isQuad = def.id === "rat_grave" || def.id === "wolf_dusk" || def.id === "drake_juvenile";

  if (isQuad) {
    // Quadruped: low slung body with 4 legs
    return (
      <group ref={root} position={position} scale={scale} onPointerDown={onPick}>
        {/* body */}
        <mesh ref={torso} position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.4, 0.55, 0.7]} />
          <meshStandardMaterial color={def.color} roughness={0.85} />
        </mesh>
        {/* head */}
        <mesh ref={head} position={[0.85, 0.65, 0]} castShadow>
          <boxGeometry args={[0.5, 0.45, 0.45]} />
          <meshStandardMaterial color={def.color} roughness={0.85} />
        </mesh>
        {/* eyes */}
        <mesh position={[1.05, 0.7, 0.18]}>
          <boxGeometry args={[0.06, 0.06, 0.04]} />
          <meshStandardMaterial color="#ff3030" emissive="#ff3030" emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[1.05, 0.7, -0.18]}>
          <boxGeometry args={[0.06, 0.06, 0.04]} />
          <meshStandardMaterial color="#ff3030" emissive="#ff3030" emissiveIntensity={1.6} />
        </mesh>
        {/* legs */}
        {[
          [0.45, 0.25, 0.28],
          [0.45, 0.25, -0.28],
          [-0.45, 0.25, 0.28],
          [-0.45, 0.25, -0.28],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <boxGeometry args={[0.18, 0.5, 0.18]} />
            <meshStandardMaterial color="#1d1d2a" />
          </mesh>
        ))}
        {/* tail */}
        <mesh position={[-0.85, 0.6, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color={def.color} />
        </mesh>
        {/* drake wings */}
        {def.id === "drake_juvenile" && (
          <>
            <mesh position={[0, 1.0, 0.5]} rotation={[0, 0.3, 0.6]}>
              <boxGeometry args={[1.0, 0.04, 0.7]} />
              <meshStandardMaterial color="#1f3a2a" roughness={0.7} side={2} />
            </mesh>
            <mesh position={[0, 1.0, -0.5]} rotation={[0, -0.3, 0.6]}>
              <boxGeometry args={[1.0, 0.04, 0.7]} />
              <meshStandardMaterial color="#1f3a2a" roughness={0.7} side={2} />
            </mesh>
          </>
        )}
        <HpBar hp={hp} hpMax={hpMax} y={1.4} selected={selected} />
        <NameTag name={def.name} y={1.7} level={def.level} bossy={def.bossy} />
      </group>
    );
  }

  // Humanoid: skeleton/goblin/ogre/imp/lich
  const slim = def.id === "imp_pit" || def.id === "skeleton_warrior";
  const beefy = def.id === "ogre_brute";
  const torsoH = beefy ? 1.0 : slim ? 0.7 : 0.85;
  const shoulder = beefy ? 1.1 : slim ? 0.6 : 0.85;

  return (
    <group ref={root} position={position} scale={scale} onPointerDown={onPick}>
      {/* legs */}
      <mesh position={[-0.18, 0.45, 0]} castShadow>
        <boxGeometry args={[0.22, 0.55, 0.22]} />
        <meshStandardMaterial color="#1d1d2a" />
      </mesh>
      <mesh position={[0.18, 0.45, 0]} castShadow>
        <boxGeometry args={[0.22, 0.55, 0.22]} />
        <meshStandardMaterial color="#1d1d2a" />
      </mesh>
      {/* torso */}
      <mesh ref={torso} position={[0, 0.55 + torsoH / 2, 0]} castShadow>
        <boxGeometry args={[shoulder, torsoH, 0.5]} />
        <meshStandardMaterial color={def.color} roughness={0.75} />
      </mesh>
      {/* arms */}
      <mesh position={[-shoulder / 2 - 0.13, 0.55 + torsoH - 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color={def.color} />
      </mesh>
      <mesh position={[shoulder / 2 + 0.13, 0.55 + torsoH - 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color={def.color} />
      </mesh>
      {/* head */}
      <mesh ref={head} position={[0, 0.55 + torsoH + 0.25, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color={def.color} roughness={0.8} />
      </mesh>
      {/* glowing eyes */}
      {[-0.1, 0.1].map(x => (
        <mesh key={x} position={[x, 0.55 + torsoH + 0.27, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial
            color={def.bossy ? "#80c8ff" : "#ff3030"}
            emissive={def.bossy ? "#80c8ff" : "#ff3030"}
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}
      {/* boss aura ring */}
      {def.bossy && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.4, 1.6, 32]} />
          <meshStandardMaterial
            color="#80c8ff"
            emissive="#80c8ff"
            emissiveIntensity={1.4}
            transparent
            opacity={0.65}
            side={2}
          />
        </mesh>
      )}
      <HpBar hp={hp} hpMax={hpMax} y={0.55 + torsoH + 0.6} selected={selected} />
      <NameTag name={def.name} y={0.55 + torsoH + 0.95} level={def.level} bossy={def.bossy} />
    </group>
  );
}

function HpBar({
  hp,
  hpMax,
  y,
  selected,
}: {
  hp: number;
  hpMax: number;
  y: number;
  selected?: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, hp / hpMax));
  return (
    <group position={[0, y, 0]} rotation={[0, 0, 0]}>
      <mesh>
        <planeGeometry args={[1.2, 0.12]} />
        <meshBasicMaterial color="#1a1c26" />
      </mesh>
      <mesh position={[-(1.2 * (1 - ratio)) / 2, 0, 0.001]}>
        <planeGeometry args={[1.2 * ratio, 0.1]} />
        <meshBasicMaterial color={ratio > 0.5 ? "#34ff7a" : ratio > 0.2 ? "#ffaa3a" : "#ff3a3a"} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[1.34, 0.18]} />
          <meshBasicMaterial color="#ffd864" />
        </mesh>
      )}
    </group>
  );
}

function NameTag({
  name,
  level,
  y,
  bossy,
}: {
  name: string;
  level: number;
  y: number;
  bossy?: boolean;
}) {
  // Use a tiny canvas-based texture so we can show name/level without DOM overhead.
  const tex = useNameTexture(name, level, bossy);
  return (
    <mesh position={[0, y, 0]}>
      <planeGeometry args={[1.6, 0.36]} />
      <meshBasicMaterial map={tex} transparent />
    </mesh>
  );
}

const TEX_CACHE = new Map<string, THREE.CanvasTexture>();
function useNameTexture(name: string, level: number, bossy?: boolean) {
  const key = `${name}|${level}|${bossy ? 1 : 0}`;
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key)!;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bossy ? "rgba(60,30,80,0.5)" : "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = "bold 22px Segoe UI, system-ui, sans-serif";
  ctx.fillStyle = bossy ? "#ffd864" : "#fff8d8";
  ctx.textAlign = "center";
  ctx.fillText(name, 128, 28);
  ctx.font = "16px Segoe UI, system-ui, sans-serif";
  ctx.fillStyle = "#aab8ff";
  ctx.fillText(`Lv ${level}${bossy ? " ★" : ""}`, 128, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  TEX_CACHE.set(key, tex);
  return tex;
}
