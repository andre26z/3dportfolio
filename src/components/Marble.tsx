import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Mesh, type MeshStandardMaterial } from 'three';
import { useAnalyser } from './AnalyserContext';
import { PLAY_HALF, surfaceY, type WaveState } from './waveField';

interface Props {
  waveRef: React.MutableRefObject<WaveState>;
}

const RADIUS = 0.8;
const GRAVITY = 20;
const RESTITUTION = 0.45; // bounciness on impact
const ROLL = 16; // how strongly slopes push the marble
const WALL_BOUNCE = 0.6; // velocity kept when hitting an invisible wall
const MAX_DT = 1 / 30; // clamp physics step to stay stable on frame hitches

// A marble that rides the wave surface: gravity pulls it down, rising waves
// launch it upward (real bounce), slopes roll it around, and invisible walls at
// ±PLAY_HALF keep it from falling off the edge of the field.
export function Marble({ waveRef }: Props) {
  const { bandsRef } = useAnalyser();
  const meshRef = useRef<Mesh>(null);

  const state = useRef({ x: 2, z: 2, y: 8, vx: 0, vy: 0, vz: 0 });
  const prevSurf = useRef(0);

  const emissive = useMemo(() => new Color('#ffcf00'), []);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(rawDelta, MAX_DT);
    const s = state.current;
    const wave = waveRef.current;

    // --- horizontal: roll downhill along the surface gradient ---
    const here = surfaceY(s.x, s.z, wave);
    const eps = 0.5;
    const gx = (surfaceY(s.x + eps, s.z, wave) - here) / eps;
    const gz = (surfaceY(s.x, s.z + eps, wave) - here) / eps;
    s.vx += -gx * ROLL * dt;
    s.vz += -gz * ROLL * dt;
    s.vx *= 0.985; // rolling friction
    s.vz *= 0.985;
    s.x += s.vx * dt;
    s.z += s.vz * dt;

    // invisible walls
    if (s.x > PLAY_HALF) { s.x = PLAY_HALF; s.vx = -Math.abs(s.vx) * WALL_BOUNCE; }
    if (s.x < -PLAY_HALF) { s.x = -PLAY_HALF; s.vx = Math.abs(s.vx) * WALL_BOUNCE; }
    if (s.z > PLAY_HALF) { s.z = PLAY_HALF; s.vz = -Math.abs(s.vz) * WALL_BOUNCE; }
    if (s.z < -PLAY_HALF) { s.z = -PLAY_HALF; s.vz = Math.abs(s.vz) * WALL_BOUNCE; }

    // --- vertical: gravity + bounce off the (moving) surface ---
    s.vy -= GRAVITY * dt;
    s.y += s.vy * dt;

    const surf = surfaceY(s.x, s.z, wave) + RADIUS;
    const surfVel = dt > 0 ? (surf - prevSurf.current) / dt : 0; // wave rise speed
    prevSurf.current = surf;

    if (s.y <= surf) {
      s.y = surf;
      // bounce, and let a rising wave fling the marble upward
      s.vy = -s.vy * RESTITUTION;
      if (surfVel > 0) s.vy += surfVel * 1.3;
      // small floor so it never fully settles — keeps it lively
      if (s.vy < 1.5) s.vy = 1.5 + bandsRef.current.bass * 6;
    }

    mesh.position.set(s.x, s.y, s.z);
    mesh.rotation.x += s.vz * dt * 0.5;
    mesh.rotation.z -= s.vx * dt * 0.5;

    const mat = mesh.material as MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + bandsRef.current.bass * 2.5;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[RADIUS, 48, 48]} />
      <meshStandardMaterial
        color="#ffd23f"
        metalness={0.85}
        roughness={0.2}
        emissive={emissive}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
