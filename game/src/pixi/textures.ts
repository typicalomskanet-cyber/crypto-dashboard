import { Texture } from 'pixi.js';

// All in-game textures are generated procedurally on a hidden 2D canvas and
// uploaded to the GPU once. This avoids any external image downloads (load
// time stays very small) and keeps everything CC0 / fully owned.
//
// Style: dark fantasy pixel-art. Heavy black borders, jewel-tone fills,
// slightly grimy noise overlay, soft drop shadow.

type RGB = [number, number, number];

function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1000) / 1000;
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function noiseTexture(
  w: number,
  h: number,
  baseA: RGB,
  baseB: RGB,
  seed: number,
  scale = 1.0,
): HTMLCanvasElement {
  const { c, g } = makeCanvas(w, h);
  const r = rng(seed);
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (Math.sin(x * 0.7 + y * 0.3) * 0.25 + Math.cos(x * 0.2 - y * 0.6) * 0.25 + r() * 0.5) * scale;
      const tt = Math.max(0, Math.min(1, t));
      const c2 = lerpRGB(baseA, baseB, tt);
      const idx = (y * w + x) * 4;
      img.data[idx] = c2[0];
      img.data[idx + 1] = c2[1];
      img.data[idx + 2] = c2[2];
      img.data[idx + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function vignette(c: HTMLCanvasElement, strength = 0.5) {
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.2, c.width / 2, c.height / 2, c.width * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
}

// ---- Tile textures -----------------------------------------------------

export function frozenGroundTile(): HTMLCanvasElement {
  const c = noiseTexture(128, 128, [22, 28, 42], [40, 56, 78], 1337, 1.0);
  const g = c.getContext('2d')!;
  // Ice cracks
  g.strokeStyle = 'rgba(180, 220, 255, 0.18)';
  g.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    const x0 = Math.random() * 128;
    const y0 = Math.random() * 128;
    g.moveTo(x0, y0);
    let x = x0, y = y0;
    for (let s = 0; s < 6; s++) {
      x += (Math.random() - 0.5) * 30;
      y += (Math.random() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // Bone/blood specks
  for (let i = 0; i < 28; i++) {
    g.fillStyle = Math.random() < 0.3 ? 'rgba(120, 20, 30, 0.9)' : 'rgba(220, 220, 240, 0.7)';
    g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  return c;
}

export function stoneFloorTile(): HTMLCanvasElement {
  const c = noiseTexture(128, 128, [40, 38, 48], [78, 70, 86], 4242, 1.0);
  const g = c.getContext('2d')!;
  // Mortar grid (faux pavers)
  g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.lineWidth = 2;
  const tile = 32;
  for (let y = 0; y < 128; y += tile) {
    for (let x = 0; x < 128; x += tile) {
      g.strokeRect(x, y, tile, tile);
    }
  }
  // Cracks
  g.strokeStyle = 'rgba(0,0,0,0.4)';
  g.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    g.beginPath();
    const x0 = Math.random() * 128;
    const y0 = Math.random() * 128;
    g.moveTo(x0, y0);
    g.lineTo(x0 + (Math.random() - 0.5) * 18, y0 + (Math.random() - 0.5) * 18);
    g.stroke();
  }
  return c;
}

export function pathTile(): HTMLCanvasElement {
  const c = noiseTexture(128, 128, [60, 50, 50], [100, 86, 76], 9001, 1.0);
  const g = c.getContext('2d')!;
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(${30 + Math.random() * 40},${20 + Math.random() * 30},${20 + Math.random() * 20},0.6)`;
    g.beginPath();
    g.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2.5, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

// ---- Decoration sprites -----------------------------------------------

export function darkTreeSprite(seed = 7): HTMLCanvasElement {
  const W = 64;
  const H = 96;
  const { c, g } = makeCanvas(W, H);
  const r = rng(seed);
  // Trunk
  g.fillStyle = '#2a1a18';
  g.beginPath();
  g.moveTo(W / 2 - 5, H);
  g.lineTo(W / 2 - 4, H - 28);
  g.lineTo(W / 2 + 4, H - 28);
  g.lineTo(W / 2 + 5, H);
  g.closePath();
  g.fill();
  g.strokeStyle = '#0a0408';
  g.lineWidth = 2;
  g.stroke();

  // Skeletal branches
  g.strokeStyle = '#1a0d10';
  g.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    const x0 = W / 2 + (r() - 0.5) * 6;
    const y0 = H - 30 - r() * 25;
    g.moveTo(x0, y0);
    let x = x0, y = y0;
    for (let s = 0; s < 4; s++) {
      x += (r() - 0.5) * 14;
      y -= 4 + r() * 6;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // Foliage clumps (dark leaves with frost rim)
  for (let i = 0; i < 7; i++) {
    const cx = W / 2 + (r() - 0.5) * 26;
    const cy = 20 + r() * 26;
    const rad = 12 + r() * 8;
    const grad = g.createRadialGradient(cx, cy - rad * 0.3, 2, cx, cy, rad);
    grad.addColorStop(0, '#5a3a78');
    grad.addColorStop(0.55, '#1a0e26');
    grad.addColorStop(1, '#08040c');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, rad, 0, Math.PI * 2);
    g.fill();
    // Frost rim
    g.strokeStyle = 'rgba(180, 220, 255, 0.35)';
    g.lineWidth = 1;
    g.stroke();
  }
  return c;
}

export function rockSprite(seed = 1): HTMLCanvasElement {
  const { c, g } = makeCanvas(48, 32);
  const r = rng(seed);
  g.fillStyle = '#3a3640';
  g.beginPath();
  const cx = 24, cy = 22;
  const points = 7;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rad = 12 + r() * 6;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad * 0.6;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = '#0c0a10';
  g.lineWidth = 2;
  g.stroke();
  // Highlight
  g.fillStyle = 'rgba(220, 220, 240, 0.18)';
  g.beginPath();
  g.ellipse(cx - 4, cy - 4, 7, 3, -0.4, 0, Math.PI * 2);
  g.fill();
  return c;
}

export function shrineSprite(): HTMLCanvasElement {
  const W = 96, H = 128;
  const { c, g } = makeCanvas(W, H);
  // Pedestal
  g.fillStyle = '#181018';
  g.fillRect(W / 2 - 28, H - 24, 56, 22);
  g.strokeStyle = '#000';
  g.lineWidth = 2;
  g.strokeRect(W / 2 - 28, H - 24, 56, 22);
  // Obelisk
  g.fillStyle = '#240a18';
  g.beginPath();
  g.moveTo(W / 2 - 16, H - 24);
  g.lineTo(W / 2 - 12, 24);
  g.lineTo(W / 2 + 12, 24);
  g.lineTo(W / 2 + 16, H - 24);
  g.closePath();
  g.fill();
  g.strokeStyle = '#000';
  g.stroke();
  // Glowing rune
  const gradR = g.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, 22);
  gradR.addColorStop(0, '#ff406a');
  gradR.addColorStop(0.4, '#a01030');
  gradR.addColorStop(1, 'rgba(160, 16, 48, 0)');
  g.fillStyle = gradR;
  g.beginPath();
  g.arc(W / 2, H / 2, 22, 0, Math.PI * 2);
  g.fill();
  // Rune mark
  g.strokeStyle = '#ffd0e0';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(W / 2 - 8, H / 2 - 8);
  g.lineTo(W / 2 + 8, H / 2 + 8);
  g.moveTo(W / 2 + 8, H / 2 - 8);
  g.lineTo(W / 2 - 8, H / 2 + 8);
  g.stroke();
  return c;
}

export function gateSprite(): HTMLCanvasElement {
  const W = 192, H = 144;
  const { c, g } = makeCanvas(W, H);
  // Towers
  g.fillStyle = '#2a2030';
  g.fillRect(8, 24, 36, H - 24);
  g.fillRect(W - 44, 24, 36, H - 24);
  // Crenellations
  for (let i = 0; i < 3; i++) {
    g.fillRect(8 + i * 12, 16, 8, 12);
    g.fillRect(W - 44 + i * 12, 16, 8, 12);
  }
  // Arch
  g.fillStyle = '#3a2a3a';
  g.fillRect(44, 56, W - 88, H - 56);
  g.fillStyle = '#0a0610';
  g.beginPath();
  g.moveTo(W / 2 - 28, H);
  g.lineTo(W / 2 - 28, 92);
  g.quadraticCurveTo(W / 2, 60, W / 2 + 28, 92);
  g.lineTo(W / 2 + 28, H);
  g.closePath();
  g.fill();
  // Outline
  g.strokeStyle = '#000';
  g.lineWidth = 2;
  g.strokeRect(8, 24, 36, H - 24);
  g.strokeRect(W - 44, 24, 36, H - 24);
  return c;
}

// ---- Helpers -----------------------------------------------------------

export function canvasToTexture(c: HTMLCanvasElement): Texture {
  // Pixi v8: from(canvas) → Texture
  return Texture.from(c);
}

export function darkenedTile(tile: HTMLCanvasElement, amt = 0.35): HTMLCanvasElement {
  const { c, g } = makeCanvas(tile.width, tile.height);
  g.drawImage(tile, 0, 0);
  g.fillStyle = `rgba(0, 0, 0, ${amt})`;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

export { vignette };
