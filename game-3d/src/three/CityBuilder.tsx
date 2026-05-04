import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PlacedBuilding, BuildingDef } from "../types";
import { BUILDINGS, CITY_HALF, CITY_TILE_SIZE } from "../data/buildings";

export interface CityBuilderProps {
  city: PlacedBuilding[];
  gold: number;
  selectedDefId: string | null;
  onPlace: (b: PlacedBuilding) => void;
  onRemove: (idx: number) => void;
  onSelectDef: (id: string | null) => void;
}

export default function CityBuilder(props: CityBuilderProps) {
  const def = useMemo(
    () => BUILDINGS.find(b => b.id === props.selectedDefId) ?? null,
    [props.selectedDefId],
  );
  return (
    <div className="city-builder">
      <div className="cb-canvas">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 16, 18], fov: 45 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#080918"]} />
          <fog attach="fog" args={["#080918", 28, 60]} />
          <ambientLight intensity={0.6} color="#9aa8ff" />
          <hemisphereLight args={["#5a78ff", "#101428", 0.6]} />
          <directionalLight
            position={[10, 18, 6]}
            intensity={1.6}
            color="#fff8e0"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <Suspense fallback={null}>
            <Grid />
            <PlacedBuildings city={props.city} onRemove={props.onRemove} />
            <Cursor
              def={def}
              gold={props.gold}
              city={props.city}
              onPlace={(p) => props.onPlace(p)}
            />
          </Suspense>
          <OrbitControls
            enablePan
            enableZoom
            minDistance={8}
            maxDistance={36}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      <aside className="cb-panel">
        <h2>Build your stronghold</h2>
        <p className="cb-help">
          Click a tile to place. Click a placed building to remove it (refunds 50%).
        </p>
        <div className="cb-list">
          {BUILDINGS.map(b => {
            const sel = b.id === props.selectedDefId;
            const cant = props.gold < b.cost;
            return (
              <button
                key={b.id}
                className={`cb-card ${sel ? "sel" : ""} ${cant ? "cant" : ""}`}
                onClick={() => props.onSelectDef(sel ? null : b.id)}
              >
                <span className="cb-icon">{b.icon}</span>
                <span className="cb-info">
                  <strong>{b.name}</strong>
                  <small>{b.description}</small>
                  <em>${b.cost}</em>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function Grid() {
  const tex = useMemo(() => buildGridTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[CITY_HALF * 2 * CITY_TILE_SIZE, CITY_HALF * 2 * CITY_TILE_SIZE]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
}

function PlacedBuildings({
  city,
  onRemove,
}: {
  city: PlacedBuilding[];
  onRemove: (idx: number) => void;
}) {
  return (
    <group>
      {city.map((b, idx) => {
        const def = BUILDINGS.find(d => d.id === b.defId);
        if (!def) return null;
        return (
          <BuildingMesh
            key={idx}
            def={def}
            tx={b.tx}
            tz={b.tz}
            rot={b.rot}
            onClick={() => onRemove(idx)}
          />
        );
      })}
    </group>
  );
}

function BuildingMesh({
  def,
  tx,
  tz,
  rot,
  ghost,
  invalid,
  onClick,
}: {
  def: BuildingDef;
  tx: number;
  tz: number;
  rot: number;
  ghost?: boolean;
  invalid?: boolean;
  onClick?: () => void;
}) {
  const wx = tx * CITY_TILE_SIZE + ((def.size - 1) * CITY_TILE_SIZE) / 2;
  const wz = tz * CITY_TILE_SIZE + ((def.size - 1) * CITY_TILE_SIZE) / 2;
  const w = def.size * CITY_TILE_SIZE * 0.95;
  const h = def.size * 1.4 + 0.4;
  const color = invalid ? "#ff3a3a" : def.color;
  const opacity = ghost ? 0.5 : 1;

  return (
    <group position={[wx, 0, wz]} rotation={[0, (rot * Math.PI) / 2, 0]} onPointerDown={onClick}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={color} roughness={0.85} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh castShadow position={[0, h + 0.35, 0]}>
        <coneGeometry args={[w * 0.75, 0.7, 4]} />
        <meshStandardMaterial color="#2a2538" transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Door */}
      {!ghost && def.id !== "wall" && def.id !== "tower" && (
        <mesh position={[0, 0.35, w / 2 + 0.001]}>
          <planeGeometry args={[0.4, 0.7]} />
          <meshStandardMaterial color="#1a120a" />
        </mesh>
      )}
    </group>
  );
}

function Cursor({
  def,
  gold,
  city,
  onPlace,
}: {
  def: BuildingDef | null;
  gold: number;
  city: PlacedBuilding[];
  onPlace: (b: PlacedBuilding) => void;
}) {
  const { raycaster, mouse, camera } = useThree();
  const [tx, setTx] = useState(0);
  const [tz, setTz] = useState(0);
  const ground = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!def || !ground.current) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(ground.current);
    if (hits[0]) {
      const p = hits[0].point;
      const ix = Math.floor(p.x / CITY_TILE_SIZE);
      const iz = Math.floor(p.z / CITY_TILE_SIZE);
      setTx(Math.max(-CITY_HALF, Math.min(CITY_HALF - def.size, ix)));
      setTz(Math.max(-CITY_HALF, Math.min(CITY_HALF - def.size, iz)));
    }
  });

  const collide = useMemo(() => {
    if (!def) return false;
    return city.some(b => {
      const bDef = BUILDINGS.find(d => d.id === b.defId);
      if (!bDef) return false;
      const overlapX = tx < b.tx + bDef.size && tx + def.size > b.tx;
      const overlapZ = tz < b.tz + bDef.size && tz + def.size > b.tz;
      return overlapX && overlapZ;
    });
  }, [def, city, tx, tz]);

  const invalid = !def || gold < def.cost || collide;

  return (
    <group>
      <mesh
        ref={ground}
        rotation-x={-Math.PI / 2}
        position={[0, 0.001, 0]}
        onPointerDown={() => {
          if (!def || invalid) return;
          onPlace({ defId: def.id, tx, tz, rot: 0 });
        }}
      >
        <planeGeometry args={[CITY_HALF * 2 * CITY_TILE_SIZE, CITY_HALF * 2 * CITY_TILE_SIZE]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {def && (
        <BuildingMesh def={def} tx={tx} tz={tz} rot={0} ghost invalid={invalid} />
      )}
    </group>
  );
}

function buildGridTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d")!;
  const grd = ctx.createRadialGradient(512, 512, 80, 512, 512, 720);
  grd.addColorStop(0, "#1a2030");
  grd.addColorStop(1, "#080a18");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.strokeStyle = "rgba(120,140,200,0.35)";
  ctx.lineWidth = 1;
  // 24 tiles across (CITY_HALF*2). 1024 / 24 ~ 42.66 px per tile
  const step = 1024 / 24;
  for (let i = 0; i <= 24; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(1024, i * step);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
