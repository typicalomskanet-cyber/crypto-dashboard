// 2.5D isometric helpers.
//
// We use a continuous world coordinate system in "tiles" (gx, gy) where
// gx grows to the south-east and gy grows to the south-west. The classic
// 2:1 diamond projection then gives:
//
//   screenX = (gx - gy) * TILE_HW
//   screenY = (gx + gy) * TILE_HH
//
// Where TILE_HW = TILE_W / 2 and TILE_HH = TILE_H / 2. With TILE_W = 64 and
// TILE_H = 32 the tiles are perfect 2:1 diamonds.

export const TILE_W = 64;
export const TILE_H = 32;
export const TILE_HW = TILE_W / 2;
export const TILE_HH = TILE_H / 2;

export function worldToScreen(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * TILE_HW,
    y: (gx + gy) * TILE_HH,
  };
}

// Inverse projection: convert screen-space (sx, sy) — relative to the world
// origin — to world-tile coordinates.
export function screenToWorld(sx: number, sy: number): { gx: number; gy: number } {
  // Solve the system:
  //   sx = (gx - gy) * TILE_HW
  //   sy = (gx + gy) * TILE_HH
  // -> gx = sx / (2*TILE_HW) + sy / (2*TILE_HH)
  // -> gy = sy / (2*TILE_HH) - sx / (2*TILE_HW)
  return {
    gx: sx / (2 * TILE_HW) + sy / (2 * TILE_HH),
    gy: sy / (2 * TILE_HH) - sx / (2 * TILE_HW),
  };
}

// Y-sort key for an entity at tile (gx, gy). Larger key = drawn on top.
export function isoDepth(gx: number, gy: number): number {
  return (gx + gy) * TILE_HH;
}
