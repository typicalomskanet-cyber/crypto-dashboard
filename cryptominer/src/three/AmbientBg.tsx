// Ambient 3D background rendered behind app content. Cheap, always-on
// canvas with floating coins and a slowly-drifting neon grid plane.
//
// Pinned to the document so all tabs share the same backdrop without
// remounting between navigations.

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Coin({
  position,
  color,
  speed,
  scale,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  scale: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * speed;
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + position[0]) * 0.4;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.95}
        roughness={0.25}
      />
    </mesh>
  );
}

function GridPlane() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.z = ((t * 0.5) % 4) - 2;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[0, -3, 0]}>
      <planeGeometry args={[40, 40, 20, 20]} />
      <meshBasicMaterial color="#222858" wireframe transparent opacity={0.3} />
    </mesh>
  );
}

export default function AmbientBg3D() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at top, #1a1f4a 0%, #0a0d20 60%, #050614 100%)",
      }}
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 8], fov: 55 }}
      >
        <color attach="background" args={["#050614"]} />
        <ambientLight intensity={0.5} color="#9aa8ff" />
        <pointLight position={[0, 4, 4]} intensity={1.2} color="#3a64ff" />
        <Suspense fallback={null}>
          <GridPlane />
          <Coin position={[-4, 1, -2]} color="#f7931a" speed={1.0} scale={1.2} />
          <Coin position={[4, -1, -1]} color="#80c8ff" speed={0.7} scale={1.0} />
          <Coin position={[-2, -2, -3]} color="#a78bfa" speed={1.4} scale={0.7} />
          <Coin position={[3, 2, -4]} color="#34ff7a" speed={0.5} scale={0.9} />
          <Coin position={[-5, -1, -5]} color="#eab308" speed={1.1} scale={0.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}
