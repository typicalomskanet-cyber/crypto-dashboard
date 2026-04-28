import * as THREE from 'three';
import type { RaceDef } from '../types';

// Create a low-poly procedural character. Uses only primitive shapes so we
// don't need any external 3D assets. Proportions vary per race.
export function createCharacterMesh(race: RaceDef): THREE.Group {
  const g = new THREE.Group();
  g.name = `char_${race.id}`;

  const heightMul = race.height;
  const slim = race.build === 'slim';
  const stocky = race.build === 'stocky';
  const bodyWidth = stocky ? 0.85 : slim ? 0.55 : 0.7;
  const bodyDepth = stocky ? 0.55 : 0.4;
  const legLen = 0.75 * heightMul;
  const torsoLen = 0.85 * heightMul;
  const armLen = 0.8 * heightMul;
  const headRadius = 0.27 * heightMul;

  const skin = new THREE.Color(race.colorSkin);
  const primary = new THREE.Color(race.colorPrimary);
  const secondary = new THREE.Color(race.colorSecondary);

  const skinMat = new THREE.MeshStandardMaterial({ color: skin, flatShading: true });
  const primaryMat = new THREE.MeshStandardMaterial({ color: primary, flatShading: true });
  const secondaryMat = new THREE.MeshStandardMaterial({ color: secondary, flatShading: true });

  // Legs (two boxes)
  const legGeom = new THREE.BoxGeometry(bodyWidth * 0.3, legLen, bodyDepth * 0.9);
  const legL = new THREE.Mesh(legGeom, secondaryMat);
  legL.position.set(-bodyWidth * 0.2, legLen / 2, 0);
  legL.castShadow = true;
  const legR = legL.clone();
  legR.position.x = bodyWidth * 0.2;
  g.add(legL, legR);

  // Torso
  const torsoGeom = new THREE.BoxGeometry(bodyWidth, torsoLen, bodyDepth);
  const torso = new THREE.Mesh(torsoGeom, primaryMat);
  torso.position.y = legLen + torsoLen / 2;
  torso.castShadow = true;
  g.add(torso);

  // Shoulders / arms (two boxes attached at upper torso)
  const armGeom = new THREE.BoxGeometry(bodyWidth * 0.25, armLen, bodyDepth * 0.85);
  const armL = new THREE.Mesh(armGeom, primaryMat);
  armL.position.set(-bodyWidth / 2 - bodyWidth * 0.12, legLen + torsoLen - armLen / 2, 0);
  armL.castShadow = true;
  const armR = armL.clone();
  armR.position.x = bodyWidth / 2 + bodyWidth * 0.12;
  g.add(armL, armR);

  // Head (octahedron for low-poly feel)
  const headGeom = new THREE.IcosahedronGeometry(headRadius, 0);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = legLen + torsoLen + headRadius * 0.8;
  head.castShadow = true;
  g.add(head);

  // Hair / helm: a cone or box on top depending on race.
  if (race.id === 'human' || race.id === 'elf' || race.id === 'darkElf') {
    const hair = new THREE.Mesh(
      new THREE.ConeGeometry(headRadius * 1.05, headRadius * 0.9, 6),
      new THREE.MeshStandardMaterial({ color: secondary, flatShading: true }),
    );
    hair.position.y = head.position.y + headRadius * 0.7;
    g.add(hair);
  }
  if (race.id === 'elf' || race.id === 'darkElf') {
    // Pointy ears: small cones on sides of head.
    const earGeom = new THREE.ConeGeometry(0.06, 0.18, 4);
    const earMat = skinMat;
    const earL = new THREE.Mesh(earGeom, earMat);
    earL.position.set(-headRadius, head.position.y + 0.05, 0);
    earL.rotation.z = Math.PI / 2;
    const earR = earL.clone();
    earR.position.x = headRadius;
    earR.rotation.z = -Math.PI / 2;
    g.add(earL, earR);
  }
  if (race.id === 'dwarf') {
    // Beard: triangular box under chin
    const beard = new THREE.Mesh(
      new THREE.ConeGeometry(headRadius * 0.9, headRadius * 1.4, 6),
      new THREE.MeshStandardMaterial({ color: '#b88a4a', flatShading: true }),
    );
    beard.position.set(0, head.position.y - headRadius * 0.8, headRadius * 0.3);
    beard.rotation.x = Math.PI;
    g.add(beard);
    // Helmet dome
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#8a8a8a', flatShading: true }),
    );
    helm.position.y = head.position.y + headRadius * 0.1;
    g.add(helm);
  }
  if (race.id === 'orc') {
    // Tusks: two tiny cones sticking up from mouth.
    const tuskGeom = new THREE.ConeGeometry(0.04, 0.12, 4);
    const tuskMat = new THREE.MeshStandardMaterial({ color: '#f2e6c4', flatShading: true });
    const tuskL = new THREE.Mesh(tuskGeom, tuskMat);
    tuskL.position.set(-0.08, head.position.y - headRadius * 0.4, headRadius * 0.7);
    const tuskR = tuskL.clone();
    tuskR.position.x = 0.08;
    g.add(tuskL, tuskR);
  }

  // Weapon placeholder in right hand.
  const weapon = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 1.0, 0.1),
    new THREE.MeshStandardMaterial({ color: '#b0b0b0', flatShading: true }),
  );
  weapon.position.set(bodyWidth / 2 + bodyWidth * 0.12, legLen + torsoLen - armLen / 2 - 0.15, 0.35);
  weapon.castShadow = true;
  g.add(weapon);

  // Small glow aura for legendary feel (using PointLight-less disc under feet)
  const aura = new THREE.Mesh(
    new THREE.CircleGeometry(bodyWidth * 0.9, 16),
    new THREE.MeshBasicMaterial({
      color: primary,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.01;
  g.add(aura);

  return g;
}

export function createEnemyMesh(color: string, size = 1): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35 * size, 0.7 * size, 4, 8), mat);
  body.position.y = 0.6 * size;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25 * size, 0), mat);
  head.position.y = 1.25 * size;
  head.castShadow = true;
  g.add(head);
  // Menacing red eyes
  const eyeGeom = new THREE.SphereGeometry(0.05 * size, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#ff3030' });
  const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.08, 1.3 * size, 0.22);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08;
  g.add(eyeL, eyeR);
  return g;
}
