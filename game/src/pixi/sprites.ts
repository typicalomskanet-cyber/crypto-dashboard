// Procedural pixel-art character & enemy sprites.
//
// Each character is composed of layered "armour pieces" drawn into a 64×96
// canvas in dark-fantasy style:
//   - Boots / greaves
//   - Body armour (plate / robe / leather)
//   - Cape
//   - Pauldrons
//   - Helmet (optional, replaces hair)
//   - Weapon (held to one side)
//
// Colours are derived from the race definition's accent colour so each race
// looks distinct.

import type { RaceDef } from '../types';

export interface SpriteFrames {
  idle: HTMLCanvasElement;
  attack: HTMLCanvasElement;
}

const W = 64;
const H = 96;

function newCanvas(): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

// Convert a CSS hex colour to RGB array.
function hexRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function shade([r, g, b]: [number, number, number], k: number): string {
  return `rgb(${Math.max(0, Math.min(255, r * k)) | 0},${Math.max(0, Math.min(255, g * k)) | 0},${Math.max(0, Math.min(255, b * k)) | 0})`;
}

function strokeBlack(g: CanvasRenderingContext2D) {
  g.strokeStyle = '#080408';
  g.lineWidth = 1.5;
}

interface DrawOpts {
  raceColor: string;
  skinTone: string;
  hairColor?: string;
  weapon: 'sword' | 'staff' | 'bow' | 'axe' | 'dagger';
  hasHelm: boolean;
  hasCape: boolean;
  buildKind: 'tall' | 'broad' | 'lithe';
  attackPose?: boolean;
}

function drawCharacter(g: CanvasRenderingContext2D, opts: DrawOpts) {
  const { raceColor, skinTone, weapon, hasHelm, hasCape, buildKind, attackPose, hairColor } = opts;
  const accent = hexRGB(raceColor);

  const cx = W / 2;
  const baseY = H - 6; // ground level for feet

  // Body proportions
  const shoulderW = buildKind === 'broad' ? 22 : buildKind === 'lithe' ? 14 : 18;
  const torsoH = buildKind === 'tall' ? 28 : 24;
  const headR = buildKind === 'broad' ? 8 : 7;

  const torsoTop = baseY - 32 - torsoH;

  // ---- Cape (behind body) ----
  if (hasCape) {
    g.fillStyle = shade(accent, 0.4);
    g.beginPath();
    g.moveTo(cx - shoulderW, torsoTop + 2);
    g.quadraticCurveTo(cx - shoulderW - 6, torsoTop + 18, cx - shoulderW - 4, torsoTop + torsoH + 8);
    g.lineTo(cx - 6, torsoTop + torsoH + 6);
    g.lineTo(cx + 6, torsoTop + torsoH + 6);
    g.lineTo(cx + shoulderW + 4, torsoTop + torsoH + 8);
    g.quadraticCurveTo(cx + shoulderW + 6, torsoTop + 18, cx + shoulderW, torsoTop + 2);
    g.closePath();
    g.fill();
    strokeBlack(g);
    g.stroke();
  }

  // ---- Legs / greaves ----
  g.fillStyle = '#1a1218';
  g.fillRect(cx - 8, baseY - 22, 7, 22); // left leg
  g.fillRect(cx + 1, baseY - 22, 7, 22); // right leg
  strokeBlack(g);
  g.strokeRect(cx - 8, baseY - 22, 7, 22);
  g.strokeRect(cx + 1, baseY - 22, 7, 22);
  // Boots
  g.fillStyle = '#0a0508';
  g.fillRect(cx - 10, baseY - 6, 11, 6);
  g.fillRect(cx, baseY - 6, 11, 6);
  g.strokeRect(cx - 10, baseY - 6, 11, 6);
  g.strokeRect(cx, baseY - 6, 11, 6);

  // ---- Torso / armour ----
  g.fillStyle = shade(accent, 0.55);
  g.fillRect(cx - shoulderW / 2 - 1, torsoTop, shoulderW + 2, torsoH);
  // Plate edges
  g.fillStyle = shade(accent, 0.85);
  g.fillRect(cx - shoulderW / 2 - 1, torsoTop, shoulderW + 2, 4);
  g.fillRect(cx - 1, torsoTop, 2, torsoH);
  // Rune highlight
  g.fillStyle = '#ffb0d0';
  g.fillRect(cx - 1, torsoTop + 8, 2, 6);
  strokeBlack(g);
  g.strokeRect(cx - shoulderW / 2 - 1, torsoTop, shoulderW + 2, torsoH);

  // ---- Pauldrons ----
  g.fillStyle = shade(accent, 0.65);
  g.beginPath();
  g.ellipse(cx - shoulderW / 2 - 2, torsoTop + 4, 6, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(cx + shoulderW / 2 + 2, torsoTop + 4, 6, 5, 0, 0, Math.PI * 2);
  g.fill();
  strokeBlack(g);
  g.beginPath();
  g.ellipse(cx - shoulderW / 2 - 2, torsoTop + 4, 6, 5, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.ellipse(cx + shoulderW / 2 + 2, torsoTop + 4, 6, 5, 0, 0, Math.PI * 2);
  g.stroke();

  // ---- Arms ----
  g.fillStyle = shade(accent, 0.45);
  g.fillRect(cx - shoulderW / 2 - 5, torsoTop + 6, 5, torsoH - 6);
  g.fillRect(cx + shoulderW / 2, torsoTop + 6, 5, torsoH - 6);
  strokeBlack(g);
  g.strokeRect(cx - shoulderW / 2 - 5, torsoTop + 6, 5, torsoH - 6);
  g.strokeRect(cx + shoulderW / 2, torsoTop + 6, 5, torsoH - 6);

  // ---- Hands ----
  g.fillStyle = skinTone;
  g.fillRect(cx - shoulderW / 2 - 5, torsoTop + torsoH, 5, 4);
  g.fillRect(cx + shoulderW / 2, torsoTop + torsoH, 5, 4);

  // ---- Head ----
  const headCY = torsoTop - headR + 2;
  g.fillStyle = skinTone;
  g.beginPath();
  g.arc(cx, headCY, headR, 0, Math.PI * 2);
  g.fill();
  strokeBlack(g);
  g.stroke();

  if (hasHelm) {
    // Horned/visored helm
    g.fillStyle = shade(accent, 0.6);
    g.beginPath();
    g.arc(cx, headCY, headR + 1, Math.PI, Math.PI * 2);
    g.lineTo(cx + headR + 1, headCY + 2);
    g.lineTo(cx - headR - 1, headCY + 2);
    g.closePath();
    g.fill();
    strokeBlack(g);
    g.stroke();
    // Eye slit
    g.fillStyle = '#ff5040';
    g.fillRect(cx - 3, headCY - 1, 6, 2);
    // Horns
    g.fillStyle = '#1a1218';
    g.beginPath();
    g.moveTo(cx - headR + 1, headCY - headR + 1);
    g.lineTo(cx - headR - 4, headCY - headR - 4);
    g.lineTo(cx - headR - 1, headCY - headR + 1);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(cx + headR - 1, headCY - headR + 1);
    g.lineTo(cx + headR + 4, headCY - headR - 4);
    g.lineTo(cx + headR + 1, headCY - headR + 1);
    g.closePath();
    g.fill();
  } else {
    // Hair
    g.fillStyle = hairColor ?? '#1a0a14';
    g.beginPath();
    g.arc(cx, headCY - 2, headR + 1, Math.PI, Math.PI * 2);
    g.lineTo(cx + headR + 1, headCY - 1);
    g.lineTo(cx - headR - 1, headCY - 1);
    g.closePath();
    g.fill();
    strokeBlack(g);
    g.stroke();
    // Eyes
    g.fillStyle = '#ffe0a0';
    g.fillRect(cx - 3, headCY, 2, 2);
    g.fillRect(cx + 1, headCY, 2, 2);
  }

  // ---- Weapon (right hand) ----
  const handX = cx + shoulderW / 2 + 2;
  const handY = torsoTop + torsoH + 2;
  g.save();
  g.translate(handX, handY);
  if (attackPose) g.rotate(-0.7);
  switch (weapon) {
    case 'sword': {
      // Blade
      g.fillStyle = '#c8d8ff';
      g.fillRect(2, -32, 3, 32);
      g.strokeStyle = '#000';
      g.strokeRect(2, -32, 3, 32);
      // Glow rim
      g.fillStyle = 'rgba(120, 180, 255, 0.3)';
      g.fillRect(0, -32, 1, 32);
      // Crossguard
      g.fillStyle = '#806038';
      g.fillRect(-2, -2, 11, 3);
      // Hilt
      g.fillStyle = '#3a2418';
      g.fillRect(2, 1, 3, 7);
      break;
    }
    case 'staff': {
      g.fillStyle = '#3a2418';
      g.fillRect(2, -34, 3, 38);
      g.strokeStyle = '#000';
      g.strokeRect(2, -34, 3, 38);
      // Crystal
      const grd = g.createRadialGradient(3, -36, 1, 3, -36, 8);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.3, '#a070ff');
      grd.addColorStop(1, 'rgba(120, 60, 200, 0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(3, -36, 8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#a070ff';
      g.beginPath();
      g.moveTo(3, -42);
      g.lineTo(7, -36);
      g.lineTo(3, -30);
      g.lineTo(-1, -36);
      g.closePath();
      g.fill();
      g.strokeStyle = '#000';
      g.stroke();
      break;
    }
    case 'bow': {
      g.strokeStyle = '#3a2418';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(2, -22);
      g.quadraticCurveTo(14, 0, 2, 22);
      g.stroke();
      g.strokeStyle = '#d8c8a0';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(2, -22);
      g.lineTo(2, 22);
      g.stroke();
      break;
    }
    case 'axe': {
      g.fillStyle = '#3a2418';
      g.fillRect(3, -28, 3, 36);
      g.strokeStyle = '#000';
      g.strokeRect(3, -28, 3, 36);
      g.fillStyle = '#a8a8b8';
      g.beginPath();
      g.moveTo(6, -28);
      g.lineTo(18, -34);
      g.lineTo(20, -22);
      g.lineTo(6, -16);
      g.closePath();
      g.fill();
      g.stroke();
      break;
    }
    case 'dagger': {
      g.fillStyle = '#c8d8ff';
      g.fillRect(2, -16, 3, 16);
      g.strokeStyle = '#000';
      g.strokeRect(2, -16, 3, 16);
      g.fillStyle = '#3a2418';
      g.fillRect(2, 0, 3, 5);
      break;
    }
  }
  g.restore();
}

function draw(opts: DrawOpts): HTMLCanvasElement {
  const { c, g } = newCanvas();
  // Soft drop shadow on the ground.
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath();
  g.ellipse(W / 2, H - 4, 14, 4, 0, 0, Math.PI * 2);
  g.fill();
  drawCharacter(g, opts);
  return c;
}

// Translate race id + chosen class into draw options.
export function characterFrames(race: RaceDef, classId?: string): SpriteFrames {
  const isMage = (classId ?? race.classes[0].id).includes('mage') || (classId ?? race.classes[0].id).includes('shaman') || (classId ?? race.classes[0].id).includes('priest');
  const isRanger = (classId ?? race.classes[0].id).includes('ranger') || (classId ?? race.classes[0].id).includes('archer') || (classId ?? race.classes[0].id).includes('hunter');
  const isAssassin = (classId ?? race.classes[0].id).includes('assassin') || (classId ?? race.classes[0].id).includes('rogue') || (classId ?? race.classes[0].id).includes('shadow');

  let weapon: DrawOpts['weapon'] = 'sword';
  if (isMage) weapon = 'staff';
  else if (isRanger) weapon = 'bow';
  else if (isAssassin) weapon = 'dagger';
  else if (race.id === 'dwarf' || race.id === 'orc') weapon = 'axe';

  let buildKind: DrawOpts['buildKind'] = 'tall';
  if (race.id === 'dwarf' || race.id === 'orc') buildKind = 'broad';
  else if (race.id === 'elf' || race.id === 'darkElf') buildKind = 'lithe';

  const skinTone = race.colorSkin ?? '#d4b89c';
  let hairColor: string | undefined = '#1a0a14';
  if (race.id === 'darkElf') { hairColor = '#e8d8f0'; }
  else if (race.id === 'orc') { hairColor = '#1a1010'; }
  else if (race.id === 'dwarf') { hairColor = '#a04020'; }
  else if (race.id === 'elf') { hairColor = '#d8c090'; }

  const opts: DrawOpts = {
    raceColor: race.colorPrimary,
    skinTone,
    hairColor,
    weapon,
    hasHelm: !isMage && !isRanger && Math.random() > 0.5 ? true : (race.id === 'human' || race.id === 'dwarf'),
    hasCape: !isRanger,
    buildKind,
  };
  return {
    idle: draw({ ...opts, attackPose: false }),
    attack: draw({ ...opts, attackPose: true }),
  };
}

// Enemy sprites: smaller, darker, glowing eyes.
export function enemySprite(color: string, kind: 'goblin' | 'wolf' | 'orc' | 'shade'): HTMLCanvasElement {
  const { c, g } = newCanvas();
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath();
  g.ellipse(W / 2, H - 4, 12, 3, 0, 0, Math.PI * 2);
  g.fill();
  const accent = hexRGB(color);

  if (kind === 'wolf') {
    // 4-legged silhouette
    g.fillStyle = shade(accent, 0.6);
    g.fillRect(W / 2 - 16, H - 30, 32, 14);
    g.fillRect(W / 2 - 14, H - 14, 4, 10);
    g.fillRect(W / 2 + 10, H - 14, 4, 10);
    g.fillRect(W / 2 - 6, H - 14, 4, 10);
    g.fillRect(W / 2 + 2, H - 14, 4, 10);
    // Head
    g.fillStyle = shade(accent, 0.5);
    g.beginPath();
    g.arc(W / 2 + 18, H - 26, 7, 0, Math.PI * 2);
    g.fill();
    // Eyes
    g.fillStyle = '#ff5050';
    g.fillRect(W / 2 + 16, H - 28, 2, 2);
    g.fillRect(W / 2 + 20, H - 28, 2, 2);
    strokeBlack(g);
    g.strokeRect(W / 2 - 16, H - 30, 32, 14);
    return c;
  }

  if (kind === 'shade') {
    // Wraith
    const cx = W / 2;
    const cy = H / 2 + 6;
    const grd = g.createRadialGradient(cx, cy, 4, cx, cy, 26);
    grd.addColorStop(0, '#a060ff');
    grd.addColorStop(0.5, '#3a1060');
    grd.addColorStop(1, 'rgba(20, 0, 30, 0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cy, 26, 0, Math.PI * 2);
    g.fill();
    // Hood
    g.fillStyle = '#100618';
    g.beginPath();
    g.moveTo(cx - 12, cy + 16);
    g.quadraticCurveTo(cx, cy - 26, cx + 12, cy + 16);
    g.closePath();
    g.fill();
    g.fillStyle = '#ff60a0';
    g.fillRect(cx - 4, cy - 4, 3, 4);
    g.fillRect(cx + 1, cy - 4, 3, 4);
    return c;
  }

  // goblin / orc humanoid
  const tall = kind === 'orc';
  const torsoH = tall ? 24 : 18;
  const torsoTop = H - 30 - torsoH;
  const cx = W / 2;
  // Legs
  g.fillStyle = '#1a1218';
  g.fillRect(cx - 6, H - 30 - 6, 5, 22);
  g.fillRect(cx + 1, H - 30 - 6, 5, 22);
  // Body
  g.fillStyle = shade(accent, 0.5);
  g.fillRect(cx - 9, torsoTop, 18, torsoH);
  // Head
  g.fillStyle = shade(accent, 0.7);
  g.beginPath();
  g.arc(cx, torsoTop - 6, 7, 0, Math.PI * 2);
  g.fill();
  // Eyes
  g.fillStyle = '#ffd040';
  g.fillRect(cx - 3, torsoTop - 8, 2, 2);
  g.fillRect(cx + 1, torsoTop - 8, 2, 2);
  // Tusks
  if (tall) {
    g.fillStyle = '#fff';
    g.fillRect(cx - 3, torsoTop - 3, 1, 2);
    g.fillRect(cx + 2, torsoTop - 3, 1, 2);
  }
  // Crude weapon (club)
  g.fillStyle = '#3a2418';
  g.fillRect(cx + 9, torsoTop, 4, torsoH);
  g.fillRect(cx + 7, torsoTop - 6, 8, 8);
  strokeBlack(g);
  g.strokeRect(cx - 9, torsoTop, 18, torsoH);
  return c;
}
