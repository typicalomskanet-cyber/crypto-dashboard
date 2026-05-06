import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { ClassId, RaceId } from "../types";

/** Race → GLB asset path (KayKit Adventurers, CC0). */
const RACE_TO_GLB: Record<RaceId, string> = {
  human: "models/characters/human.glb",
  highElf: "models/characters/highElf.glb",
  darkElf: "models/characters/darkElf.glb",
  dwarf: "models/characters/dwarf.glb",
  orc: "models/characters/orc.glb",
};

/** Race-tinted accent color overlay (subtle emissive on body). */
const RACE_TINT: Record<RaceId, string> = {
  human: "#dcc188",
  highElf: "#bcd6ff",
  darkElf: "#a060ff",
  dwarf: "#ff8a3a",
  orc: "#34d068",
};

/** Per-race scale to keep silhouette diversity. */
const RACE_SCALE: Record<RaceId, number> = {
  human: 1.0,
  highElf: 1.05,
  darkElf: 1.0,
  dwarf: 0.85,
  orc: 1.18,
};

interface GLTFAvatarProps {
  race: RaceId;
  cls?: ClassId;
  walking?: boolean;
  attackKey?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** Cast shadow (defaults to true). */
  castShadow?: boolean;
}

/**
 * Animated low-poly humanoid using KayKit Adventurers CC0 GLB.
 *
 * Plays Idle by default, switches to Walking when `walking=true`, and
 * triggers a one-shot Attack action when `attackKey` increments.
 */
export function GLTFAvatar({
  race,
  walking,
  attackKey,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
}: GLTFAvatarProps) {
  const url = RACE_TO_GLB[race];
  const { scene, animations } = useGLTF(url);
  const cloned = useMemo(() => cloneSkinned(scene), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const lastAttackKey = useRef(0);

  // Apply shadows + tint
  useEffect(() => {
    cloned.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = castShadow;
        m.receiveShadow = true;
        // Slight emissive tint by race for variety
        const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
        const apply = (mt: THREE.MeshStandardMaterial) => {
          if (!mt || !("emissive" in mt)) return;
          mt.emissive = new THREE.Color(RACE_TINT[race]);
          mt.emissiveIntensity = 0.05;
        };
        if (Array.isArray(mat)) mat.forEach(apply);
        else apply(mat);
      }
    });
  }, [cloned, castShadow, race]);

  // Find best-matching animation by keyword.
  const findAction = useMemo(() => {
    const names = Object.keys(actions);
    return (keywords: string[]) => {
      for (const kw of keywords) {
        const found = names.find(n => n.toLowerCase().includes(kw.toLowerCase()));
        if (found) return actions[found];
      }
      return null;
    };
  }, [actions]);

  // Idle / Walk switch
  useEffect(() => {
    const idle = findAction(["Idle", "Stand"]);
    const walk = findAction(["Running_A", "Running", "Walking_A", "Walk"]);
    const desired = walking ? walk ?? idle : idle ?? walk;
    if (!desired) return;
    desired.reset().fadeIn(0.18).play();
    return () => {
      desired.fadeOut(0.18);
    };
  }, [walking, findAction]);

  // One-shot Attack
  useEffect(() => {
    if (attackKey === undefined || attackKey === lastAttackKey.current) return;
    lastAttackKey.current = attackKey;
    const atk =
      findAction([
        "1H_Melee_Attack_Slice_Diagonal",
        "1H_Melee_Attack_Chop",
        "Unarmed_Melee_Attack_Punch_A",
        "Spellcast_Shoot",
        "Attack",
      ]) ?? null;
    if (!atk) return;
    atk.setLoop(THREE.LoopOnce, 1);
    atk.clampWhenFinished = true;
    atk.reset().fadeIn(0.05).play();
    const tid = setTimeout(() => atk.fadeOut(0.2), 600);
    return () => clearTimeout(tid);
  }, [attackKey, findAction]);

  useFrame((_, dt) => mixer && mixer.update(dt));

  const finalScale = scale * RACE_SCALE[race];

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={finalScale}>
      <primitive object={cloned} />
    </group>
  );
}

// Pre-warm GLB caches so first render is smooth.
useGLTF.preload("models/characters/human.glb");
useGLTF.preload("models/characters/highElf.glb");
useGLTF.preload("models/characters/darkElf.glb");
useGLTF.preload("models/characters/dwarf.glb");
useGLTF.preload("models/characters/orc.glb");
