import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ClassId, RaceId } from "../types";
import { RACES, CLASSES } from "../data/races";

interface AvatarProps {
  race: RaceId;
  cls?: ClassId;
  /** Walking animation phase. If omitted, the avatar plays an idle bob. */
  walking?: boolean;
  /** When true, plays a quick attack swing once per call (cycles via animKey). */
  attackKey?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Scaled by race scale on top of this. */
  scale?: number;
  castShadow?: boolean;
}

/**
 * Procedurally generated low-poly humanoid.
 *
 * Uses race tints and a class-archetype weapon. No external assets — every
 * shape is a primitive box / cylinder so the bundle stays tiny.
 */
export function Avatar({
  race,
  cls,
  walking,
  attackKey,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
}: AvatarProps) {
  const raceDef = RACES.find(r => r.id === race) ?? RACES[0];
  const clsDef = cls ? CLASSES.find(c => c.id === cls) ?? null : null;

  const root = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const cape = useRef<THREE.Mesh>(null);

  const lastAttackKey = useRef(0);
  const attackT = useRef(0);

  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    if (root.current) root.current.position.y = position[1] + Math.sin(t * 2) * 0.02;

    const stride = walking ? Math.sin(t * 8) * 0.6 : Math.sin(t * 2) * 0.05;
    if (leftLeg.current) leftLeg.current.rotation.x = stride;
    if (rightLeg.current) rightLeg.current.rotation.x = -stride;

    if (attackKey !== undefined && attackKey !== lastAttackKey.current) {
      lastAttackKey.current = attackKey;
      attackT.current = 0.4;
    }
    if (attackT.current > 0) {
      attackT.current = Math.max(0, attackT.current - dt);
      const a = (1 - attackT.current / 0.4) * Math.PI * 0.9;
      if (rightArm.current) rightArm.current.rotation.x = -a;
    } else {
      if (rightArm.current) rightArm.current.rotation.x = -stride * 0.4;
    }
    if (leftArm.current) leftArm.current.rotation.x = stride * 0.4;
    if (cape.current) cape.current.rotation.x = 0.15 + (walking ? Math.sin(t * 8) * 0.08 : 0);
  });

  // Race-specific silhouette tweaks
  const isDwarf = race === "dwarf";
  const isOrc = race === "orc";
  const isElf = race === "highElf" || race === "darkElf";
  const bodyHeight = isDwarf ? 1.05 : isOrc ? 1.45 : 1.3;
  const headSize = isDwarf ? 0.36 : isOrc ? 0.42 : 0.34;
  const shoulderW = isDwarf ? 0.7 : isOrc ? 1.0 : 0.78;
  const torsoH = isDwarf ? 0.55 : 0.7;

  const finalScale = scale * raceDef.scale;
  const skin = raceDef.skin;
  const accent = raceDef.accent;

  // Eye colour — high elves bluish, dark elves violet, orcs red
  const eyeColor = useMemo(() => {
    if (race === "highElf") return "#aef0ff";
    if (race === "darkElf") return "#ff86ff";
    if (race === "orc") return "#ff4030";
    if (race === "dwarf") return "#fff3a0";
    return "#fff8c8";
  }, [race]);

  return (
    <group ref={root} position={position} rotation={rotation} scale={finalScale}>
      {/* Legs */}
      <group ref={leftLeg} position={[-0.18, 0.55, 0]}>
        <mesh castShadow={castShadow} position={[0, -0.27, 0]}>
          <boxGeometry args={[0.22, 0.55, 0.22]} />
          <meshStandardMaterial color="#1d1f2c" roughness={0.85} />
        </mesh>
        <mesh castShadow={castShadow} position={[0, -0.6, 0.06]}>
          <boxGeometry args={[0.24, 0.16, 0.32]} />
          <meshStandardMaterial color="#0f1018" roughness={0.95} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.18, 0.55, 0]}>
        <mesh castShadow={castShadow} position={[0, -0.27, 0]}>
          <boxGeometry args={[0.22, 0.55, 0.22]} />
          <meshStandardMaterial color="#1d1f2c" roughness={0.85} />
        </mesh>
        <mesh castShadow={castShadow} position={[0, -0.6, 0.06]}>
          <boxGeometry args={[0.24, 0.16, 0.32]} />
          <meshStandardMaterial color="#0f1018" roughness={0.95} />
        </mesh>
      </group>

      {/* Torso (armor-coloured by race accent) */}
      <mesh castShadow={castShadow} position={[0, 0.55 + torsoH / 2, 0]}>
        <boxGeometry args={[shoulderW, torsoH, 0.42]} />
        <meshStandardMaterial color={accent} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Shoulder pads */}
      <mesh
        castShadow={castShadow}
        position={[-shoulderW / 2 - 0.05, 0.55 + torsoH - 0.05, 0]}
      >
        <boxGeometry args={[0.28, 0.2, 0.42]} />
        <meshStandardMaterial color="#23252e" roughness={0.4} metalness={0.55} />
      </mesh>
      <mesh
        castShadow={castShadow}
        position={[shoulderW / 2 + 0.05, 0.55 + torsoH - 0.05, 0]}
      >
        <boxGeometry args={[0.28, 0.2, 0.42]} />
        <meshStandardMaterial color="#23252e" roughness={0.4} metalness={0.55} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[shoulderW + 0.04, 0.1, 0.44]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Cape */}
      <mesh
        ref={cape}
        position={[0, 0.55 + torsoH - 0.1, -0.21]}
        castShadow={castShadow}
      >
        <boxGeometry args={[shoulderW + 0.05, torsoH + 0.4, 0.04]} />
        <meshStandardMaterial color={accent} opacity={0.95} transparent roughness={0.85} />
      </mesh>

      {/* Arms */}
      <group ref={leftArm} position={[-shoulderW / 2 - 0.13, 0.55 + torsoH, 0]}>
        <mesh castShadow={castShadow} position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color={accent} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh castShadow={castShadow} position={[0, -0.62, 0.04]}>
          <boxGeometry args={[0.2, 0.16, 0.22]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightArm} position={[shoulderW / 2 + 0.13, 0.55 + torsoH, 0]}>
        <mesh castShadow={castShadow} position={[0, -0.3, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshStandardMaterial color={accent} roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh castShadow={castShadow} position={[0, -0.62, 0.04]}>
          <boxGeometry args={[0.2, 0.16, 0.22]} />
          <meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        {/* Weapon stub by archetype */}
        {clsDef && <Weapon archetype={clsDef.archetype} />}
      </group>

      {/* Head */}
      <group position={[0, 0.55 + torsoH + headSize / 2 + 0.06, 0]}>
        <mesh castShadow={castShadow}>
          <boxGeometry args={[headSize, headSize, headSize]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>
        {/* Helm strip */}
        <mesh position={[0, headSize / 4, 0]}>
          <boxGeometry args={[headSize + 0.02, headSize / 3, headSize + 0.02]} />
          <meshStandardMaterial color="#1a1c26" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-headSize / 4, 0, headSize / 2 + 0.001]}>
          <boxGeometry args={[0.04, 0.04, 0.01]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[headSize / 4, 0, headSize / 2 + 0.001]}>
          <boxGeometry args={[0.04, 0.04, 0.01]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={1.4} />
        </mesh>
        {/* Elf ears */}
        {isElf && (
          <>
            <mesh position={[-headSize / 2 - 0.02, 0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
              <coneGeometry args={[0.06, 0.18, 4]} />
              <meshStandardMaterial color={skin} roughness={0.85} />
            </mesh>
            <mesh position={[headSize / 2 + 0.02, 0.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <coneGeometry args={[0.06, 0.18, 4]} />
              <meshStandardMaterial color={skin} roughness={0.85} />
            </mesh>
          </>
        )}
        {/* Orc tusks */}
        {isOrc && (
          <>
            <mesh position={[-0.08, -headSize / 3, headSize / 2 + 0.01]}>
              <coneGeometry args={[0.04, 0.12, 4]} />
              <meshStandardMaterial color="#fff5d8" />
            </mesh>
            <mesh position={[0.08, -headSize / 3, headSize / 2 + 0.01]}>
              <coneGeometry args={[0.04, 0.12, 4]} />
              <meshStandardMaterial color="#fff5d8" />
            </mesh>
          </>
        )}
        {/* Dwarf beard */}
        {isDwarf && (
          <mesh position={[0, -headSize / 2 - 0.04, headSize / 2 - 0.02]}>
            <boxGeometry args={[headSize, 0.22, 0.18]} />
            <meshStandardMaterial color={accent} roughness={0.95} />
          </mesh>
        )}
      </group>

      {/* Body height anchor (legs are at 0.55 above origin so the avatar's feet sit on y=0). */}
      <mesh visible={false} position={[0, bodyHeight, 0]}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
      </mesh>
    </group>
  );
}

function Weapon({ archetype }: { archetype: "melee" | "ranged" | "magic" | "stealth" }) {
  if (archetype === "ranged") {
    return (
      <group position={[0.06, -0.2, 0]} rotation={[0, 0, 0.3]}>
        <mesh>
          <torusGeometry args={[0.32, 0.025, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#3a2a18" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.005, 0.62, 0.005]} />
          <meshStandardMaterial color="#d6d6d6" />
        </mesh>
      </group>
    );
  }
  if (archetype === "magic") {
    return (
      <group position={[0.06, -0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <octahedronGeometry args={[0.1]} />
          <meshStandardMaterial color="#9bd1ff" emissive="#5a82ff" emissiveIntensity={1.4} />
        </mesh>
      </group>
    );
  }
  if (archetype === "stealth") {
    return (
      <group position={[0.06, -0.36, 0]}>
        <mesh>
          <coneGeometry args={[0.05, 0.32, 4]} />
          <meshStandardMaterial color="#c8d4ff" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[0.05, 0.1, 0.05]} />
          <meshStandardMaterial color="#3a2a18" />
        </mesh>
      </group>
    );
  }
  // melee — sword by default
  return (
    <group position={[0.06, -0.5, 0]}>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.06, 0.55, 0.02]} />
        <meshStandardMaterial color="#dfe6f2" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.18, 0.04, 0.06]} />
        <meshStandardMaterial color="#bfa15a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.8} />
      </mesh>
    </group>
  );
}
