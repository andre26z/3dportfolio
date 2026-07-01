import { CanvasTexture, type Texture } from 'three';
import type { PlanetDef } from './planets';

// Procedurally paints a planet surface onto a canvas -> CanvasTexture. No image
// assets. Gas giants get flowing horizontal bands; rocky worlds get mottled
// noise blotches and a few craters. Cached per planet id.
const cache = new Map<string, Texture>();

function mix(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function planetTexture(def: PlanetDef): Texture {
  const cached = cache.get(def.id);
  if (cached) return cached;

  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = def.color;
  ctx.fillRect(0, 0, W, H);

  if (def.kind === 'gas') {
    // horizontal bands with wavy edges
    let y = 0;
    while (y < H) {
      const band = 8 + Math.random() * 22;
      const t = Math.random();
      ctx.fillStyle = mix(def.color, def.accent, t * 0.8);
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 16) {
        const wobble = Math.sin(x * 0.05 + y) * 3;
        ctx.lineTo(x, y + wobble);
      }
      for (let x = W; x >= 0; x -= 16) {
        const wobble = Math.sin(x * 0.05 + y + band) * 3;
        ctx.lineTo(x, y + band + wobble);
      }
      ctx.closePath();
      ctx.fill();
      y += band;
    }
    // a "storm" spot on Jupiter-like giants
    if (def.radius > 2) {
      ctx.fillStyle = mix(def.accent, '#ff5522', 0.4);
      ctx.beginPath();
      ctx.ellipse(W * 0.65, H * 0.6, 34, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // rocky: scattered mottled blotches
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = 2 + Math.random() * 14;
      ctx.fillStyle = mix(def.color, def.accent, Math.random());
      ctx.globalAlpha = 0.25 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // a few craters
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = 3 + Math.random() * 8;
      ctx.strokeStyle = mix(def.accent, '#000000', 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 4;
  cache.set(def.id, tex);
  return tex;
}
