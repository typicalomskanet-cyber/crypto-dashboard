// 3D city scene rendered via react-three-fiber.
//
// Visualises the player's city as a procedural low-poly skyline. Each
// building from `BUILDINGS` has a fixed lot in a hex around the central
// plaza; its level (`city[id]`) drives its height, decoration and glow
// intensity. Clicking a lot upgrades the corresponding building if the
// player can afford it.

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Float,
  Html,
  OrbitControls,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import { BUILDINGS, BuildingDef, buildingCost } from "./buildings";

const LOT_RADIUS = 6.5; // distance from plaza to each lot
const GRID = 22; // ground extent (square)

interface CitySceneProps {
  city: Record<string, number>;
  balance: number;
  onUpgrade: (id: string, cost: number) => void;
  exchangeOpen?: boolean;
}

function lotPositionFor(idx: number): [number, number, number] {
  // 6 lots arranged in a hex around the plaza.
  const angle = (idx / 6) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(angle) * LOT_RADIUS, 0, Math.sin(angle) * LOT_RADIUS];
}

function Ground() {
  // Procedural neon-grid ground.
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0a0d20";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(80, 100, 180, 0.55)";
    g.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 512);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(512, i);
      g.stroke();
    }
    g.strokeStyle = "rgba(120, 200, 255, 0.85)";
    g.lineWidth = 2;
    g.strokeRect(192, 192, 128, 128); // central plaza highlight
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[GRID * 2, GRID * 2]} />
      <meshStandardMaterial
        map={tex}
        roughness={0.7}
        metalness={0.15}
        emissive={"#0a1640"}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

function Roads() {
  // Glowing radial roads from plaza out to each lot.
  const mat = (
    <meshStandardMaterial
      color="#2a2f55"
      emissive="#3a64ff"
      emissiveIntensity={0.3}
      roughness={0.4}
      metalness={0.2}
    />
  );
  return (
    <group>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return (
          <mesh
            key={i}
            position={[
              (Math.cos(angle) * LOT_RADIUS) / 2,
              0.011,
              (Math.sin(angle) * LOT_RADIUS) / 2,
            ]}
            rotation-y={-angle}
            rotation-x={-Math.PI / 2}
          >
            <planeGeometry args={[LOT_RADIUS, 1.2]} />
            {mat}
          </mesh>
        );
      })}
    </group>
  );
}

function Plaza() {
  // Central pad with rotating bitcoin hologram.
  const ringRef = useRef<THREE.Mesh>(null);
  const coinRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z = state.clock.elapsedTime * 0.6;
    if (coinRef.current) coinRef.current.rotation.y = state.clock.elapsedTime;
  });
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.4, 2.4, 0.1, 32]} />
        <meshStandardMaterial
          color="#1a1c3a"
          emissive="#3a4cff"
          emissiveIntensity={0.4}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.11, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.7, 1.95, 32]} />
        <meshBasicMaterial color="#80c8ff" transparent opacity={0.65} />
      </mesh>
      <Float speed={2} rotationIntensity={0} floatIntensity={1.5}>
        <mesh ref={coinRef} position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.18, 32]} />
          <meshStandardMaterial
            color="#f7931a"
            emissive="#f7931a"
            emissiveIntensity={0.8}
            roughness={0.3}
            metalness={0.95}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Building({
  def,
  level,
  position,
  affordable,
  onUpgrade,
  exchangeOpen,
}: {
  def: BuildingDef;
  level: number;
  position: [number, number, number];
  affordable: boolean;
  onUpgrade: () => void;
  exchangeOpen?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  // Building grows with level, capped to keep things readable.
  const heightUnits = level === 0 ? 0.35 : Math.min(1.2 + level * 0.55, 6);
  const widthUnits = 1.4 + Math.min(level, 6) * 0.1;
  const depthUnits = 1.4 + Math.min(level, 6) * 0.1;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle hover bob for unbuilt lots.
    if (level === 0) {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    } else {
      groupRef.current.position.y = 0;
    }
  });

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.45,
        metalness: 0.55,
        emissive: def.color,
        emissiveIntensity: level === 0 ? 0.05 : 0.18 + Math.min(level, 6) * 0.04,
      }),
    [def.color, level],
  );
  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0a0a1a",
        roughness: 0.65,
        metalness: 0.35,
      }),
    [],
  );
  // Procedural window strips painted onto the side of the tower.
  const windowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0a0a1a";
    g.fillRect(0, 0, 128, 256);
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 6; col++) {
        const lit = Math.random() < 0.7;
        if (lit) {
          g.fillStyle =
            Math.random() < 0.15 ? "#ffaa50" : Math.random() < 0.3 ? "#80c8ff" : "#fff8a0";
          g.fillRect(8 + col * 20, 8 + row * 14, 14, 8);
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group ref={groupRef} position={position}>
      {/* Lot pad */}
      <mesh
        position={[0, 0.025, 0]}
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (typeof document !== "undefined") document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          if (typeof document !== "undefined") document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (affordable) onUpgrade();
        }}
      >
        <boxGeometry args={[2.4, 0.05, 2.4]} />
        <meshStandardMaterial
          color={hovered ? "#384270" : "#1a1f3a"}
          emissive={affordable ? def.color : "#000000"}
          emissiveIntensity={hovered ? 0.5 : level === 0 ? 0.25 : 0.1}
          roughness={0.35}
          metalness={0.5}
        />
      </mesh>

      {level > 0 ? (
        <>
          {/* Main tower */}
          <mesh
            position={[0, heightUnits / 2 + 0.05, 0]}
            castShadow
            receiveShadow
            material={bodyMaterial}
          >
            <boxGeometry args={[widthUnits, heightUnits, depthUnits]} />
          </mesh>
          {/* Window strip on each side */}
          {[0, 1, 2, 3].map((side) => (
            <mesh
              key={side}
              position={[
                side === 0 ? 0 : side === 1 ? widthUnits / 2 + 0.001 : side === 2 ? 0 : -widthUnits / 2 - 0.001,
                heightUnits / 2 + 0.05,
                side === 0 ? depthUnits / 2 + 0.001 : side === 1 ? 0 : side === 2 ? -depthUnits / 2 - 0.001 : 0,
              ]}
              rotation-y={(Math.PI / 2) * side}
            >
              <planeGeometry args={[widthUnits * 0.85, heightUnits * 0.85]} />
              <meshStandardMaterial
                map={windowTex}
                emissiveMap={windowTex}
                emissive={"#ffffff"}
                emissiveIntensity={0.4}
                transparent={false}
              />
            </mesh>
          ))}
          {/* Roof */}
          <mesh
            position={[0, heightUnits + 0.18, 0]}
            castShadow
            material={accentMat}
          >
            <boxGeometry args={[widthUnits * 1.05, 0.25, depthUnits * 1.05]} />
          </mesh>
          {/* Crown / icon depending on building type */}
          <BuildingCrown
            def={def}
            level={level}
            top={heightUnits + 0.32}
            width={widthUnits}
            exchangeOpen={exchangeOpen}
          />
          {/* Floor numbers */}
          {Array.from({ length: Math.min(level, 6) }).map((_, i) => (
            <mesh
              key={i}
              position={[0, 0.6 + i * 0.55, 0]}
              rotation-y={(i * Math.PI) / 8}
            >
              <torusGeometry args={[widthUnits / 2 + 0.02, 0.025, 4, 24]} />
              <meshStandardMaterial
                color={def.color}
                emissive={def.color}
                emissiveIntensity={1.2}
              />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* Empty lot fence + holographic preview */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[2.0, 0.8, 2.0]} />
            <meshStandardMaterial
              color={def.color}
              transparent
              opacity={hovered ? 0.35 : 0.15}
              emissive={def.color}
              emissiveIntensity={hovered ? 0.7 : 0.3}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1.05, 1.15, 16]} />
            <meshBasicMaterial color={def.color} transparent opacity={0.85} />
          </mesh>
        </>
      )}

      {/* Hover label */}
      {hovered && (
        <Html
          position={[0, Math.max(heightUnits + 0.6, 1.4), 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(10, 12, 30, 0.92)",
              color: "#fff",
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${def.color}`,
              fontSize: 12,
              fontFamily: "system-ui, -apple-system, sans-serif",
              whiteSpace: "nowrap",
              textShadow: "0 1px 2px rgba(0,0,0,0.7)",
              boxShadow: `0 0 18px ${def.color}55`,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {def.icon} {def.name} <span style={{ opacity: 0.7 }}>Lv.{level}</span>
            </div>
            <div style={{ opacity: 0.85, marginTop: 2 }}>{def.effectStr}</div>
            <div style={{ marginTop: 4, color: affordable ? "#7eff9a" : "#ff7a7a" }}>
              {affordable ? "Click to upgrade" : "Not enough $"}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function BuildingCrown({
  def,
  level,
  top,
  width,
  exchangeOpen,
}: {
  def: BuildingDef;
  level: number;
  top: number;
  width: number;
  exchangeOpen?: boolean;
}) {
  void exchangeOpen;
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.5;
  });
  switch (def.id) {
    case "bank":
      return (
        <Float speed={1.6} floatIntensity={0.4}>
          <mesh ref={ref} position={[0, top + 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 24]} />
            <meshStandardMaterial
              color="#ffd864"
              emissive="#ffd864"
              emissiveIntensity={1.5}
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        </Float>
      );
    case "farm":
      // Two chimneys
      return (
        <group>
          {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, top + 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.16, 0.8, 12]} />
              <meshStandardMaterial color="#1a1d2c" roughness={0.9} />
            </mesh>
          ))}
        </group>
      );
    case "hospital":
      return (
        <group>
          <mesh position={[0, top + 0.4, 0]} castShadow>
            <boxGeometry args={[0.16, 0.6, 0.16]} />
            <meshStandardMaterial color="#ff5050" emissive="#ff3030" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0, top + 0.4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.16, 0.16]} />
            <meshStandardMaterial color="#ff5050" emissive="#ff3030" emissiveIntensity={1.2} />
          </mesh>
        </group>
      );
    case "academy":
      // Pyramid / dome
      return (
        <mesh position={[0, top + 0.45, 0]} castShadow>
          <coneGeometry args={[0.65, 0.9, 4]} />
          <meshStandardMaterial color="#0d6b46" emissive="#0d6b46" emissiveIntensity={0.4} />
        </mesh>
      );
    case "hub":
      // Holographic chart sign rotating above the roof
      return (
        <group>
          <Float speed={2} floatIntensity={0.6}>
            <mesh ref={ref} position={[0, top + 0.7, 0]} rotation-x={Math.PI / 2}>
              <planeGeometry args={[1.2, 0.6]} />
              <meshBasicMaterial color="#a78bfa" transparent opacity={0.65} />
            </mesh>
          </Float>
        </group>
      );
    case "park":
      // Tree
      return (
        <group position={[0, top + 0.05, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.4, 6]} />
            <meshStandardMaterial color="#3a2618" />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[0.45, 0.9, 7]} />
            <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    default:
      void width;
      void level;
      return null;
  }
}

function CityLights() {
  // Floating particles representing transactions / hash flow.
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const t = state.clock.elapsedTime + idx;
      child.position.y = 1 + (Math.sin(t * 0.7 + idx) * 0.5 + 0.5) * 5;
      child.rotation.y = t * 0.8;
    });
  });
  return (
    <group ref={groupRef}>
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const r = 4 + (i % 3);
        return (
          <mesh key={i} position={[Math.cos(a) * r, 1, Math.sin(a) * r]}>
            <octahedronGeometry args={[0.08, 0]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#ffd864" : "#80c8ff"}
              transparent
              opacity={0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function CityScene({
  city,
  balance,
  onUpgrade,
  exchangeOpen,
}: CitySceneProps) {
  // Hex layout (deterministic). Each BUILDINGS[i] takes lotPositionFor(i).
  return (
    <div
      style={{
        width: "100%",
        height: "min(60vh, 520px)",
        minHeight: 360,
        borderRadius: 16,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at top, #1a1f4a 0%, #0a0d20 60%, #050614 100%)",
        boxShadow: "0 0 30px rgba(80, 100, 220, 0.25) inset",
        border: "1px solid rgba(100, 130, 220, 0.25)",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [9, 9, 14], fov: 45 }}
      >
        <color attach="background" args={["#070815"]} />
        <fog attach="fog" args={["#070815", 18, 45]} />
        <ambientLight intensity={0.4} color="#9aa8ff" />
        <directionalLight
          position={[8, 14, 6]}
          intensity={1.6}
          color="#fff8e0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <pointLight position={[0, 4, 0]} intensity={1.2} color="#3a64ff" distance={20} />
        <Suspense fallback={null}>
          <Stars
            radius={80}
            depth={20}
            count={1600}
            factor={3}
            saturation={0}
            fade
            speed={0.6}
          />
          <Ground />
          <Roads />
          <Plaza />
          <CityLights />
          {BUILDINGS.map((def, i) => {
            const level = city[def.id] || 0;
            const cost = buildingCost(def, level);
            const affordable = balance >= cost;
            return (
              <Building
                key={def.id}
                def={def}
                level={level}
                position={lotPositionFor(i)}
                affordable={affordable}
                exchangeOpen={exchangeOpen}
                onUpgrade={() => onUpgrade(def.id, cost)}
              />
            );
          })}
          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.55}
            scale={GRID}
            blur={1.6}
            far={10}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={26}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={0.2}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
