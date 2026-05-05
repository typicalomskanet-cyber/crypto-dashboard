import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { MobDef } from "../types";

/**
 * Map mob def IDs → KayKit Skeleton GLB.
 * Mobs without a mapping return null and the parent falls back to procedural <Mob>.
 */
const MOB_TO_GLB: Record<string, string> = {
  rat_grave: "models/mobs/skeleton_minion.glb",
  goblin_raider: "models/mobs/skeleton_rogue.glb",
  skeleton_warrior: "models/mobs/skeleton_warrior.glb",
  ogre_brute: "models/mobs/skeleton_warrior.glb",
  imp_pit: "models/mobs/skeleton_rogue.glb",
  lich_frost: "models/mobs/skeleton_mage.glb",
};

/** Optional emissive aura per mob — gives readable silhouettes in dark scenes. */
const MOB_AURA: Record<string, string | null> = {
  rat_grave: null,
  goblin_raider: "#7aff70",
  skeleton_warrior: "#fff5d8",
  ogre_brute: "#ff7a3a",
  imp_pit: "#ff3a30",
  lich_frost: "#80c8ff",
};

/** Per-mob extra scale on top of def.scale. */
const MOB_GLB_SCALE: Record<string, number> = {
  rat_grave: 0.85,
  goblin_raider: 1.0,
  skeleton_warrior: 1.05,
  ogre_brute: 1.7,
  imp_pit: 1.0,
  lich_frost: 1.6,
};

export interface GLTFMobProps {
  def: MobDef;
  position: [number, number, number];
  walking?: boolean;
  attackKey?: number;
  onPick?: () => void;
}

export function hasGLTFMob(defId: string) {
  return defId in MOB_TO_GLB;
}

export function GLTFMobInner({ def, position, walking, attackKey, onPick }: GLTFMobProps) {
  const url = MOB_TO_GLB[def.id]!;
  const { scene, animations } = useGLTF(url);
  const cloned = useMemo(() => cloneSkinned(scene), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, groupRef);
  const lastAttackKey = useRef(0);

  const aura = MOB_AURA[def.id];

  useEffect(() => {
    cloned.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        if (aura) {
          const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
          const apply = (mt: THREE.MeshStandardMaterial) => {
            if (!mt || !("emissive" in mt)) return;
            mt.emissive = new THREE.Color(aura);
            mt.emissiveIntensity = def.bossy ? 0.45 : 0.18;
          };
          if (Array.isArray(mat)) mat.forEach(apply);
          else apply(mat);
        }
      }
    });
  }, [cloned, aura, def.bossy]);

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

  useEffect(() => {
    const idle = findAction(["Idle", "Stand"]);
    const walk = findAction(["Walking_A", "Running_A", "Walking", "Running", "Walk"]);
    const desired = walking ? walk ?? idle : idle ?? walk;
    if (!desired) return;
    desired.reset().fadeIn(0.18).play();
    return () => {
      desired.fadeOut(0.18);
    };
  }, [walking, findAction]);

  useEffect(() => {
    if (attackKey === undefined || attackKey === lastAttackKey.current) return;
    lastAttackKey.current = attackKey;
    const atk = findAction([
      "1H_Melee_Attack_Slice_Diagonal",
      "1H_Melee_Attack_Chop",
      "Spellcast_Shoot",
      "Attack",
    ]);
    if (!atk) return;
    atk.setLoop(THREE.LoopOnce, 1);
    atk.clampWhenFinished = true;
    atk.reset().fadeIn(0.05).play();
    const tid = setTimeout(() => atk.fadeOut(0.2), 600);
    return () => clearTimeout(tid);
  }, [attackKey, findAction]);

  useFrame((_, dt) => mixer && mixer.update(dt));

  const finalScale = (def.scale ?? 1) * (MOB_GLB_SCALE[def.id] ?? 1);

  return (
    <group ref={groupRef} position={position} scale={finalScale} onPointerDown={onPick}>
      <primitive object={cloned} />
      {def.bossy && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.4, 1.6, 32]} />
          <meshStandardMaterial
            color={aura ?? "#80c8ff"}
            emissive={aura ?? "#80c8ff"}
            emissiveIntensity={1.2}
            transparent
            opacity={0.55}
            side={2}
          />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload("models/mobs/skeleton_minion.glb");
useGLTF.preload("models/mobs/skeleton_rogue.glb");
useGLTF.preload("models/mobs/skeleton_warrior.glb");
useGLTF.preload("models/mobs/skeleton_mage.glb");
