import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCharacterMesh } from '../three/characters';
import type { RaceDef } from '../types';

// Small rotating 3D preview of a race used on the race-select screen.
export function RacePreview({ race }: { race: RaceDef }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 200;
    const height = mount.clientHeight || 160;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    camera.position.set(0, 2.2, 4.8);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const key = new THREE.DirectionalLight(0xffe2b0, 1.0);
    key.position.set(3, 4, 3);
    const rim = new THREE.DirectionalLight(0x6a8cff, 0.4);
    rim.position.set(-2, 3, -2);
    scene.add(ambient, key, rim);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 24),
      new THREE.MeshStandardMaterial({ color: '#201030', flatShading: true }),
    );
    disc.rotation.x = -Math.PI / 2;
    scene.add(disc);

    const char = createCharacterMesh(race);
    scene.add(char);

    let raf = 0;
    const t0 = performance.now();
    const animate = () => {
      const t = (performance.now() - t0) * 0.001;
      char.rotation.y = t * 0.6;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        const m = (o as THREE.Mesh).material;
        if (m) {
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [race]);

  return <div ref={mountRef} className="race-preview" />;
}
