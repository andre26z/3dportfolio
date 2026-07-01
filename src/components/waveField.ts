// Shared definition of the wave surface, used by BOTH the terrain vertex shader
// (to displace the mesh) and the CPU (to bounce the marble on it). Keeping the
// height formula in one conceptual place is what lets the marble sit exactly on
// the visible waves. If you edit waveHeight here, mirror it in shaders/terrain.ts.

export interface WaveState {
  time: number;
  bass: number; // 0..1, smoothed (matches the shader uniform)
  mid: number;
}

// World Y of the flat plane before displacement (terrain mesh position.y).
export const BASE_Y = -4;
// Marble stays inside this half-extent box on X and Z (invisible walls).
export const PLAY_HALF = 18;

// Height (world units, added on top of BASE_Y) at plane-local coords (lx, ly).
// The plane is rotated -PI/2 about X, so local +Z displacement becomes world +Y.
export function waveHeight(lx: number, ly: number, s: WaveState): number {
  const t = s.time;
  const amp = 0.6 + s.bass * 5;
  const py = ly + t * 1.5; // scrolling for the fly-over feel
  let h = 0;
  h += Math.sin(lx * 0.6 + t * 0.4) * 0.6;
  h += Math.sin(py * 0.5 - t * 0.3) * 0.6;
  h += Math.sin((lx + py) * 0.9 + t * 0.6) * 0.35;
  h += Math.sin(Math.hypot(lx, py) * 1.2 - t) * 0.25;
  h *= amp;
  h += s.mid * 1.5 * Math.sin(lx * 2 + t * 2);
  return h;
}

// World-space surface height at world (wx, wz).
// Plane rotation -PI/2 about X maps world (x, z) -> local (x, -z).
export function surfaceY(wx: number, wz: number, s: WaveState): number {
  return BASE_Y + waveHeight(wx, -wz, s);
}
