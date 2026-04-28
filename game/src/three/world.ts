import * as THREE from 'three';

export interface EnemySpawn {
  id: string;
  enemyDefId: string;
  position: [number, number]; // x,z
}

export const WORLD_SIZE = 40;

// Fixed spawn points for the prototype. Enemies respawn after combat ends.
export const ENEMY_SPAWNS: EnemySpawn[] = [
  { id: 'sp1', enemyDefId: 'e_goblin', position: [6, 4] },
  { id: 'sp2', enemyDefId: 'e_goblin', position: [-5, 6] },
  { id: 'sp3', enemyDefId: 'e_wolf', position: [10, -8] },
  { id: 'sp4', enemyDefId: 'e_wolf', position: [-10, -6] },
  { id: 'sp5', enemyDefId: 'e_orc_raider', position: [-14, 12] },
  { id: 'sp6', enemyDefId: 'e_orc_raider', position: [14, 12] },
  { id: 'sp7', enemyDefId: 'e_shade', position: [0, -15] },
];

export function buildWorld(scene: THREE.Scene): {
  ground: THREE.Mesh;
  cityGate: THREE.Group;
} {
  // Ground grass plane
  const groundGeom = new THREE.PlaneGeometry(WORLD_SIZE * 2, WORLD_SIZE * 2, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: '#2c3e2c', flatShading: true });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  scene.add(ground);

  // Randomly scatter trees and rocks (deterministic-ish via fixed seed list).
  const scatters: { type: 'tree' | 'rock'; x: number; z: number; scale: number }[] = [];
  // 30 trees
  for (let i = 0; i < 40; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const z = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const rx = (x - Math.floor(x)) * (WORLD_SIZE * 1.6) - WORLD_SIZE * 0.8;
    const rz = (z - Math.floor(z)) * (WORLD_SIZE * 1.6) - WORLD_SIZE * 0.8;
    if (Math.abs(rx) < 3 && Math.abs(rz) < 3) continue;
    scatters.push({ type: 'tree', x: rx, z: rz, scale: 0.8 + ((i * 7) % 5) * 0.2 });
  }
  for (let i = 0; i < 25; i++) {
    const x = (Math.sin(i * 31.1 + 1.3) * 43758.5453) % 1;
    const z = (Math.sin(i * 14.7 + 9.1) * 43758.5453) % 1;
    const rx = (x - Math.floor(x)) * (WORLD_SIZE * 1.6) - WORLD_SIZE * 0.8;
    const rz = (z - Math.floor(z)) * (WORLD_SIZE * 1.6) - WORLD_SIZE * 0.8;
    if (Math.abs(rx) < 3 && Math.abs(rz) < 3) continue;
    scatters.push({ type: 'rock', x: rx, z: rz, scale: 0.4 + ((i * 11) % 3) * 0.3 });
  }

  const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 1.0, 6);
  const foliageGeom = new THREE.ConeGeometry(0.8, 1.8, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5a3a22', flatShading: true });
  const foliageMat = new THREE.MeshStandardMaterial({ color: '#2a5a2a', flatShading: true });
  const rockGeom = new THREE.DodecahedronGeometry(0.6, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: '#7d7d7d', flatShading: true });

  for (const s of scatters) {
    if (s.type === 'tree') {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 0.5;
      trunk.castShadow = true;
      const foliage = new THREE.Mesh(foliageGeom, foliageMat);
      foliage.position.y = 1.8;
      foliage.castShadow = true;
      t.add(trunk, foliage);
      t.position.set(s.x, 0, s.z);
      t.scale.setScalar(s.scale);
      scene.add(t);
    } else {
      const r = new THREE.Mesh(rockGeom, rockMat);
      r.position.set(s.x, 0.3, s.z);
      r.scale.setScalar(s.scale);
      r.rotation.y = s.x;
      r.castShadow = true;
      scene.add(r);
    }
  }

  // Starting plaza — a stone disc at origin.
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: '#8a7a68', flatShading: true }),
  );
  plaza.position.y = 0.05;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // A devil-shrine totem at the center of the plaza to fit the lore.
  const totem = new THREE.Group();
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.4, 0.8),
    new THREE.MeshStandardMaterial({ color: '#3a2a3a', flatShading: true }),
  );
  pedestal.position.y = 0.25;
  const obelisk = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.6, 4),
    new THREE.MeshStandardMaterial({ color: '#6a2040', flatShading: true, emissive: '#300010' }),
  );
  obelisk.position.y = 1.3;
  totem.add(pedestal, obelisk);
  totem.position.set(0, 0, 0);
  scene.add(totem);

  // Placeholder city gate (used as visual hint; actual city is in city screen).
  const cityGate = new THREE.Group();
  const gateMatL = new THREE.MeshStandardMaterial({ color: '#5a4a3a', flatShading: true });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), gateMatL);
  p1.position.set(-2, 1.5, -WORLD_SIZE * 0.5);
  const p2 = p1.clone();
  p2.position.x = 2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.7), gateMatL);
  top.position.set(0, 3.25, -WORLD_SIZE * 0.5);
  cityGate.add(p1, p2, top);
  scene.add(cityGate);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe2b0, 1.0);
  sun.position.set(15, 25, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);
  scene.fog = new THREE.Fog(0x1b1425, 20, 55);

  return { ground, cityGate };
}
