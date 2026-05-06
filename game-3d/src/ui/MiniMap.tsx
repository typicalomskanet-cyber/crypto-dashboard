import { useEffect, useRef } from "react";
import type { MobInstance } from "../three/World";
import type { PlacedBuilding } from "../types";
import { CITY_TILE_SIZE } from "../data/buildings";

const WORLD_HALF = 24;
const MAP_PX = 160;

export interface MiniMapProps {
  player: [number, number];
  mobs: MobInstance[];
  city: PlacedBuilding[];
  selectedMob: string | null;
}

/**
 * Top-left mini-map (canvas). Player at the centre, world coords mapped to
 * a square. Refreshed on every prop change at ~4 Hz.
 */
export function MiniMap({ player, mobs, city, selectedMob }: MiniMapProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== MAP_PX * dpr) {
      cv.width = MAP_PX * dpr;
      cv.height = MAP_PX * dpr;
      cv.style.width = `${MAP_PX}px`;
      cv.style.height = `${MAP_PX}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, MAP_PX, MAP_PX);

    // Background ring
    ctx.fillStyle = "rgba(8,10,24,0.85)";
    ctx.beginPath();
    ctx.arc(MAP_PX / 2, MAP_PX / 2, MAP_PX / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3a2d4a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // North marker
    ctx.fillStyle = "#ffd864";
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", MAP_PX / 2, 11);

    const project = (wx: number, wz: number): [number, number] => {
      // Translate so player at centre.
      const dx = wx - player[0];
      const dz = wz - player[1];
      // Each world unit = (MAP_PX/2) / (WORLD_HALF) px (zoom-out).
      const scale = (MAP_PX / 2) / WORLD_HALF;
      return [MAP_PX / 2 + dx * scale, MAP_PX / 2 + dz * scale];
    };

    // Buildings
    ctx.fillStyle = "#d8b878";
    for (const b of city) {
      const [px, py] = project(b.tx * CITY_TILE_SIZE, b.tz * CITY_TILE_SIZE);
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    // Mobs
    for (const m of mobs) {
      if (m.deadUntil) continue;
      const [px, py] = project(m.pos[0], m.pos[2]);
      // Cull outside circle
      const dx = px - MAP_PX / 2;
      const dy = py - MAP_PX / 2;
      if (Math.hypot(dx, dy) > MAP_PX / 2 - 6) continue;
      ctx.fillStyle = m.uid === selectedMob ? "#ffd864" : m.aggro ? "#ff5a3a" : "#a05a5a";
      ctx.beginPath();
      ctx.arc(px, py, m.uid === selectedMob ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player (centre, golden triangle)
    ctx.fillStyle = "#ffd864";
    ctx.beginPath();
    ctx.arc(MAP_PX / 2, MAP_PX / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [player, mobs, city, selectedMob]);

  return (
    <div className="minimap">
      <canvas ref={ref} />
      <div className="minimap-coords">
        {Math.round(player[0])}, {Math.round(player[1])}
      </div>
    </div>
  );
}
