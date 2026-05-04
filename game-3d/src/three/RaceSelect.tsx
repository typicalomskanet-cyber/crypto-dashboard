import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { RACES, CLASSES } from "../data/races";
import type { ClassId, RaceId } from "../types";
import { useMemo, useState } from "react";

export interface RaceSelectProps {
  onConfirm(payload: { name: string; race: RaceId; cls: ClassId }): void;
}

export default function RaceSelect({ onConfirm }: RaceSelectProps) {
  const [picked, setPicked] = useState<RaceId>("human");
  const [cls, setCls] = useState<ClassId>("knight");
  const [name, setName] = useState("");

  const raceDef = useMemo(() => RACES.find(r => r.id === picked)!, [picked]);
  const classOptions = useMemo(
    () => CLASSES.filter(c => raceDef.startingClasses.includes(c.id)),
    [raceDef],
  );

  // If switching race invalidates the class, fall back to first allowed
  if (!classOptions.find(c => c.id === cls)) {
    setCls(classOptions[0].id);
  }

  const radius = 4.5;

  return (
    <div className="race-select">
      <div className="race-canvas">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 3.6, 7.8], fov: 38 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#080918"]} />
          <fog attach="fog" args={["#080918", 14, 28]} />
          <ambientLight intensity={0.45} color="#9aa8ff" />
          <hemisphereLight args={["#5a78ff", "#101428", 0.6]} />
          <directionalLight
            position={[5, 8, 4]}
            intensity={1.6}
            color="#fff8e0"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[0, 4, 0]} intensity={1.2} color="#a060ff" distance={14} />

          {/* Ground disc */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <circleGeometry args={[10, 48]} />
            <meshStandardMaterial color="#0d1024" roughness={0.95} />
          </mesh>

          {/* Glowing rune ring */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
            <ringGeometry args={[5.6, 5.85, 64]} />
            <meshStandardMaterial color="#a060ff" emissive="#a060ff" emissiveIntensity={1.4} side={2} />
          </mesh>

          {RACES.map((r, i) => {
            const angle = (i / RACES.length) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const isPicked = r.id === picked;
            return (
              <group key={r.id} position={[x, 0, z]} rotation={[0, -angle - Math.PI / 2, 0]}>
                {/* pedestal */}
                <mesh
                  position={[0, 0.15, 0]}
                  receiveShadow
                  castShadow
                  onPointerDown={() => setPicked(r.id)}
                >
                  <cylinderGeometry args={[0.85, 0.95, 0.3, 8]} />
                  <meshStandardMaterial
                    color={isPicked ? "#3a2a6a" : "#1a1d2c"}
                    emissive={isPicked ? "#7a3aff" : "#000000"}
                    emissiveIntensity={isPicked ? 0.45 : 0}
                    roughness={0.7}
                  />
                </mesh>
                <Avatar
                  race={r.id}
                  cls={r.startingClasses[0]}
                  position={[0, 0.3, 0]}
                  scale={1.1}
                />
                {/* selection halo */}
                {isPicked && (
                  <mesh position={[0, 0.32, 0]} rotation-x={-Math.PI / 2}>
                    <ringGeometry args={[1.0, 1.1, 32]} />
                    <meshStandardMaterial
                      color="#ffd864"
                      emissive="#ffd864"
                      emissiveIntensity={1.4}
                      transparent
                      opacity={0.8}
                      side={2}
                    />
                  </mesh>
                )}
              </group>
            );
          })}

          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={6}
            maxDistance={14}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 1, 0]}
          />
        </Canvas>
      </div>

      <div className="race-panel">
        <h1 className="rs-title">Chronicle of Devil Gods</h1>
        <p className="rs-sub">Choose your bloodline. Carve your fate.</p>

        <div className="rs-races">
          {RACES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`rs-race-pill ${r.id === picked ? "picked" : ""}`}
              onClick={() => setPicked(r.id)}
            >
              <span
                className="rs-race-dot"
                style={{ background: r.accent, boxShadow: `0 0 12px ${r.accent}` }}
              />
              {r.name}
            </button>
          ))}
        </div>

        <h2 className="rs-section">{raceDef.name}</h2>
        <p className="rs-tag">{raceDef.tagline}</p>
        <p className="rs-desc">{raceDef.description}</p>

        <div className="rs-bonus">
          <span>HP +{raceDef.bonus.hp}</span>
          <span>MP +{raceDef.bonus.mp}</span>
          <span>ATK +{raceDef.bonus.atk}</span>
          <span>DEF +{raceDef.bonus.def}</span>
          <span>CRIT +{raceDef.bonus.crit}</span>
        </div>

        <h3 className="rs-section">Starting class</h3>
        <div className="rs-classes">
          {classOptions.map(c => (
            <button
              key={c.id}
              type="button"
              className={`rs-class ${c.id === cls ? "picked" : ""}`}
              onClick={() => setCls(c.id)}
            >
              <strong>{c.name}</strong>
              <small>{c.desc}</small>
            </button>
          ))}
        </div>

        <input
          className="rs-name"
          placeholder="Name your hero"
          maxLength={18}
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <button
          className="rs-confirm"
          disabled={!name.trim()}
          onClick={() => onConfirm({ name: name.trim() || "Hero", race: picked, cls })}
        >
          Enter the world →
        </button>
      </div>
    </div>
  );
}
