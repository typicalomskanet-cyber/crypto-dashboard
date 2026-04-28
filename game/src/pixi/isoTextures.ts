// Procedurally drawn isometric tile diamonds (top + edges).
//
// We render each tile as a 64×48 sprite where the top diamond occupies the
// upper 32px and a short 16px "skirt" sits below to give the world a faint
// raised relief.

import { TILE_H, TILE_W } from './iso';

const SKIRT = 16;

function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

function noise(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1000) / 1000;
  };
}

function diamondPath(g: CanvasRenderingContext2D) {
  g.beginPath();
  g.moveTo(TILE_W / 2, 0);
  g.lineTo(TILE_W, TILE_H / 2);
  g.lineTo(TILE_W / 2, TILE_H);
  g.lineTo(0, TILE_H / 2);
  g.closePath();
}

interface TileOpts {
  topA: string;
  topB: string;
  skirtA: string;
  skirtB: string;
  cracks?: { color: string; count: number };
  specks?: { colors: string[]; count: number };
  outline?: string;
}

function drawTile(opts: TileOpts, seed: number): HTMLCanvasElement {
  const { c, g } = makeCanvas(TILE_W, TILE_H + SKIRT);
  const r = noise(seed);

  // Skirt (south face)
  const sg = g.createLinearGradient(0, TILE_H / 2, 0, TILE_H + SKIRT);
  sg.addColorStop(0, opts.skirtA);
  sg.addColorStop(1, opts.skirtB);
  g.fillStyle = sg;
  g.beginPath();
  g.moveTo(0, TILE_H / 2);
  g.lineTo(TILE_W / 2, TILE_H);
  g.lineTo(TILE_W, TILE_H / 2);
  g.lineTo(TILE_W, TILE_H / 2 + SKIRT);
  g.lineTo(TILE_W / 2, TILE_H + SKIRT);
  g.lineTo(0, TILE_H / 2 + SKIRT);
  g.closePath();
  g.fill();

  // Top
  g.save();
  diamondPath(g);
  g.clip();
  // Base gradient
  const tg = g.createLinearGradient(0, 0, 0, TILE_H);
  tg.addColorStop(0, opts.topA);
  tg.addColorStop(1, opts.topB);
  g.fillStyle = tg;
  g.fillRect(0, 0, TILE_W, TILE_H);
  // Speckle noise
  for (let i = 0; i < 80; i++) {
    g.fillStyle = `rgba(0,0,0,${r() * 0.18})`;
    g.fillRect((r() * TILE_W) | 0, (r() * TILE_H) | 0, 1, 1);
  }
  if (opts.cracks) {
    g.strokeStyle = opts.cracks.color;
    g.lineWidth = 1;
    for (let i = 0; i < opts.cracks.count; i++) {
      const x0 = r() * TILE_W;
      const y0 = r() * TILE_H;
      g.beginPath();
      g.moveTo(x0, y0);
      let x = x0, y = y0;
      for (let s = 0; s < 4; s++) {
        x += (r() - 0.5) * 14;
        y += (r() - 0.5) * 14;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  if (opts.specks) {
    for (let i = 0; i < opts.specks.count; i++) {
      g.fillStyle = opts.specks.colors[(r() * opts.specks.colors.length) | 0];
      g.fillRect((r() * TILE_W) | 0, (r() * TILE_H) | 0, 2, 2);
    }
  }
  g.restore();

  // Outline
  if (opts.outline) {
    g.strokeStyle = opts.outline;
    g.lineWidth = 1;
    diamondPath(g);
    g.stroke();
  }
  return c;
}

// ---- Tile presets ------------------------------------------------------

export function isoFrozenTile(seed = 7): HTMLCanvasElement {
  return drawTile({
    topA: '#3a4a64',
    topB: '#1a2438',
    skirtA: '#16203a',
    skirtB: '#080a18',
    cracks: { color: 'rgba(180, 220, 255, 0.4)', count: 5 },
    specks: { colors: ['#a0c0ff', '#ff5060', '#dcdcec'], count: 12 },
    outline: 'rgba(0,0,0,0.5)',
  }, seed);
}

export function isoStoneTile(seed = 11): HTMLCanvasElement {
  return drawTile({
    topA: '#4a4252',
    topB: '#26202c',
    skirtA: '#1a141e',
    skirtB: '#080608',
    cracks: { color: 'rgba(0,0,0,0.6)', count: 3 },
    outline: 'rgba(0,0,0,0.6)',
  }, seed);
}

export function isoPathTile(seed = 23): HTMLCanvasElement {
  return drawTile({
    topA: '#6a4438',
    topB: '#3a2418',
    skirtA: '#2a1812',
    skirtB: '#100806',
    specks: { colors: ['#8a5a3c', '#3a201a'], count: 14 },
    outline: 'rgba(0,0,0,0.45)',
  }, seed);
}

export function isoPlazaTile(seed = 5): HTMLCanvasElement {
  return drawTile({
    topA: '#5a4a30',
    topB: '#2c2218',
    skirtA: '#1a140e',
    skirtB: '#080604',
    specks: { colors: ['#806038', '#a0742e'], count: 10 },
    outline: 'rgba(220,180,60,0.4)',
  }, seed);
}

export function isoCorruptTile(seed = 17): HTMLCanvasElement {
  return drawTile({
    topA: '#3c2050',
    topB: '#1a0e26',
    skirtA: '#0e0420',
    skirtB: '#04010a',
    cracks: { color: 'rgba(160, 100, 255, 0.5)', count: 4 },
    specks: { colors: ['#a060ff', '#ff60a0'], count: 10 },
    outline: 'rgba(0,0,0,0.6)',
  }, seed);
}
