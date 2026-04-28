import { useEffect, useRef } from 'react';
import { characterFrames } from '../pixi/sprites';
import type { RaceDef } from '../types';

// Small 2D portrait of a race used on the race-select screen.
// Procedural pixel-art canvas with a soft glow halo and gentle bobbing.
export function RacePreview({ race }: { race: RaceDef }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const width = canvas.clientWidth || 200;
    const height = canvas.clientHeight || 200;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const frames = characterFrames(race);

    const t0 = performance.now();
    let raf = 0;
    let lastDraw = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const now = performance.now();
      // 30 fps cap — preview is decorative.
      if (now - lastDraw < 1000 / 30) return;
      lastDraw = now;
      if (document.hidden) return;

      const t = (now - t0) * 0.001;

      // Background halo
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, width * 0.55);
      grad.addColorStop(0, race.colorPrimary + 'aa');
      grad.addColorStop(0.5, '#1a0e26');
      grad.addColorStop(1, '#08040c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Stone disc
      ctx.fillStyle = '#1a1018';
      ctx.beginPath();
      ctx.ellipse(width / 2, height * 0.85, 50, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Subtle floating particles
      for (let i = 0; i < 8; i++) {
        const px = (Math.sin(t + i) * 0.5 + 0.5) * width;
        const py = ((Math.cos(t * 0.8 + i * 1.3) * 0.5 + 0.5) * height * 0.7) + height * 0.1;
        ctx.fillStyle = `rgba(180, 220, 255, ${0.15 + 0.15 * Math.sin(t * 2 + i)})`;
        ctx.fillRect(px, py, 2, 2);
      }

      // Character sprite, centered, gently bobbing.
      const bob = Math.sin(t * 1.6) * 3;
      const sw = 96;
      const sh = 144;
      const sx = (width - sw) / 2;
      const sy = (height - sh) / 2 + bob - 6;
      ctx.drawImage(frames.idle, sx, sy, sw, sh);
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [race]);

  return <canvas ref={canvasRef} className="race-preview" />;
}
