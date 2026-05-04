// 3D mining warehouse view rendered with react-three-fiber.
//
// Reflects the player's racks: each rack becomes a server-rack mesh with
// 4 stacked GPU/ASIC blocks. Empty slots are unlit. Spinning fans and
// blinking diodes give the room life. Camera orbits the room.

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface RackSlotLite {
  id: string;
  minerId: string | null;
  durability: number;
}
interface RackLite {
  id: string;
  slots: RackSlotLite[];
}
interface MinerLite {
  id: string;
  color: string;
  coin: "BTC" | "ETH" | "SOL" | "MULTI";
}

interface Props {
  racks: RackLite[];
  miners: MinerLite[];
  miningMode: "BTC" | "ETH" | "SOL";
  totalPow: number;
}

function FloorTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a0d20";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(60, 80, 140, 0.7)";
  g.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 256);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(256, i);
    g.stroke();
  }
  // metallic specks
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(${100 + Math.random() * 80},${100 + Math.random() * 80},${
      150 + Math.random() * 80
    },0.18)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

function Fan({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z -= dt * 12;
  });
  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[0.18, 0.025, 6, 18]} />
        <meshStandardMaterial color="#3a3f5a" roughness={0.6} />
      </mesh>
      <mesh ref={ref}>
        <boxGeometry args={[0.04, 0.32, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Diode({ position, on }: { position: [number, number, number]; on: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current || !on) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 6 + position[0] * 5));
    m.transparent = true;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.025, 6, 6]} />
      <meshBasicMaterial color={on ? "#34ff7a" : "#202533"} />
    </mesh>
  );
}

function Rig({
  slot,
  miners,
  position,
  miningMode,
}: {
  slot: RackSlotLite;
  miners: MinerLite[];
  position: [number, number, number];
  miningMode: "BTC" | "ETH" | "SOL";
}) {
  const empty = !slot.minerId;
  const miner = slot.minerId ? miners.find((m) => m.id === slot.minerId) : null;
  const baseColor = miner ? miner.color : "#1a1f3a";
  const isMatch =
    !!miner &&
    (miner.coin === miningMode ||
      miner.coin === "MULTI" ||
      (miningMode === "BTC" && miner.coin === "BTC") ||
      (miningMode === "ETH" && miner.coin === "ETH") ||
      (miningMode === "SOL" && miner.coin === "SOL"));
  const tempT = (100 - slot.durability) / 100; // 0 cool, 1 hot
  const heatColor = new THREE.Color().lerpColors(
    new THREE.Color("#34ff7a"),
    new THREE.Color("#ff3030"),
    tempT,
  );
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 0.7]} />
        <meshStandardMaterial
          color={empty ? "#15182a" : baseColor}
          roughness={0.45}
          metalness={0.55}
          emissive={empty ? "#000" : baseColor}
          emissiveIntensity={empty ? 0 : isMatch ? 0.55 : 0.2}
        />
      </mesh>
      {!empty && (
        <>
          <Fan position={[-0.45, 0, 0.36]} color={isMatch ? "#34ff7a" : "#ffd864"} />
          <Fan position={[0.45, 0, 0.36]} color={isMatch ? "#34ff7a" : "#ffd864"} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Diode
              key={i}
              position={[-0.6 + i * 0.3, 0.18, 0.36]}
              on={isMatch}
            />
          ))}
          {/* Heat indicator strip */}
          <mesh position={[0, 0.25, 0.36]}>
            <boxGeometry args={[1.2, 0.04, 0.01]} />
            <meshBasicMaterial color={`#${heatColor.getHexString()}`} />
          </mesh>
        </>
      )}
      {empty && (
        <mesh position={[0, 0, 0.36]}>
          <planeGeometry args={[1.3, 0.3]} />
          <meshBasicMaterial color="#1a1f3a" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Rack({
  rack,
  miners,
  position,
  miningMode,
}: {
  rack: RackLite;
  miners: MinerLite[];
  position: [number, number, number];
  miningMode: "BTC" | "ETH" | "SOL";
}) {
  return (
    <group position={position}>
      {/* Rack frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.7, 2.6, 0.9]} />
        <meshStandardMaterial color="#11141f" roughness={0.85} metalness={0.2} />
      </mesh>
      {/* Lit side strip */}
      <mesh position={[0.86, 0, 0]}>
        <boxGeometry args={[0.02, 2.2, 0.02]} />
        <meshBasicMaterial color="#34a8ff" />
      </mesh>
      <mesh position={[-0.86, 0, 0]}>
        <boxGeometry args={[0.02, 2.2, 0.02]} />
        <meshBasicMaterial color="#34a8ff" />
      </mesh>
      {/* Slots stacked vertically */}
      {rack.slots.map((slot, i) => (
        <Rig
          key={slot.id}
          slot={slot}
          miners={miners}
          position={[0, 1.0 - i * 0.6, 0.05]}
          miningMode={miningMode}
        />
      ))}
      {/* Top bar */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[1.8, 0.12, 1.0]} />
        <meshStandardMaterial color="#0a0c18" roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function MiningRoom3D({ racks, miners, miningMode, totalPow }: Props) {
  const floorTex = useMemo(FloorTexture, []);
  // Lay out racks in a row, with extra rows when count grows.
  const rackPositions: [number, number, number][] = racks.map((_, i) => {
    const perRow = 4;
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return [(col - (perRow - 1) / 2) * 2.4, 1.3, row * 2.6 - racks.length * 0.3];
  });

  return (
    <div
      style={{
        width: "100%",
        height: "min(48vh, 420px)",
        minHeight: 280,
        borderRadius: 14,
        overflow: "hidden",
        background: "radial-gradient(ellipse at top, #1a234a 0%, #0a0d20 80%)",
        border: "1px solid rgba(80, 120, 220, 0.25)",
        boxShadow: "0 0 30px rgba(80, 100, 220, 0.2) inset",
        marginBottom: 20,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [6, 5, 7], fov: 45 }}
      >
        <color attach="background" args={["#0a0f25"]} />
        <fog attach="fog" args={["#0a0f25", 16, 40]} />
        <ambientLight intensity={0.85} color="#aab8ff" />
        <hemisphereLight args={["#5a78ff", "#101428", 0.6]} />
        <directionalLight
          position={[6, 10, 5]}
          intensity={1.4}
          color="#fff8e0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 5, 0]} intensity={1.8} color="#3a64ff" distance={18} />
        <pointLight position={[-6, 4, 4]} intensity={1.0} color="#34a8ff" distance={14} />
        <pointLight position={[6, 4, -4]} intensity={1.0} color="#a78bfa" distance={14} />
        <Suspense fallback={null}>
          {/* Floor */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.2} />
          </mesh>
          {/* Walls */}
          <mesh position={[0, 4, -8]} receiveShadow>
            <boxGeometry args={[24, 8, 0.2]} />
            <meshStandardMaterial color="#0d1124" roughness={0.9} />
          </mesh>
          <mesh position={[-12, 4, 0]} rotation-y={Math.PI / 2} receiveShadow>
            <boxGeometry args={[24, 8, 0.2]} />
            <meshStandardMaterial color="#0d1124" roughness={0.9} />
          </mesh>
          {/* Pipes overhead */}
          {[-3, 0, 3].map((x) => (
            <mesh key={x} position={[x, 6.2, 0]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.08, 0.08, 16, 8]} />
              <meshStandardMaterial color="#1a233f" roughness={0.6} />
            </mesh>
          ))}
          {/* Racks */}
          {racks.map((rack, i) => (
            <Rack
              key={rack.id}
              rack={rack}
              miners={miners}
              position={rackPositions[i]}
              miningMode={miningMode}
            />
          ))}
          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.55}
            scale={20}
            blur={1.6}
            far={10}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minPolarAngle={0.1}
          enableDamping
        />
      </Canvas>
      <div
        style={{
          position: "absolute",
          marginTop: -36,
          marginLeft: 14,
          padding: "4px 10px",
          background: "rgba(10, 12, 30, 0.7)",
          color: "#fff",
          borderRadius: 6,
          fontSize: 12,
          border: "1px solid rgba(120, 180, 255, 0.3)",
          pointerEvents: "none",
        }}
      >
        Total hash: <b>{totalPow.toFixed(1)}</b> · {miningMode} mode · {racks.length} rack(s)
      </div>
    </div>
  );
}
