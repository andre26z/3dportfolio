import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, DoubleSide, type Mesh } from 'three';

// Radial accretion-disk texture: transparent central hole -> blazing photon
// ring -> hot orange -> fade out, with faint swirl streaks. Built on a canvas,
// no image asset.
function diskTexture(): CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const cx = S / 2;

  const grad = ctx.createRadialGradient(cx, cx, S * 0.14, cx, cx, S * 0.5);
  grad.addColorStop(0.0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.28, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.38, 'rgba(255,196,92,0.9)');
  grad.addColorStop(0.62, 'rgba(255,110,20,0.5)');
  grad.addColorStop(1.0, 'rgba(120,20,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // swirl streaks for a sense of rotation
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 220; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = S * (0.16 + Math.random() * 0.32);
    ctx.strokeStyle = `rgba(255,${180 + Math.random() * 60},120,${0.06 + Math.random() * 0.1})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(cx, cx, r, a, a + 0.4 + Math.random() * 0.5);
    ctx.stroke();
  }

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// The black hole that replaces the sun on collapse: a pure-black event horizon,
// a bright photon ring, and a spinning tilted accretion disk.
export function BlackHole() {
  const diskRef = useRef<Mesh>(null);
  const tex = useMemo(() => diskTexture(), []);

  useFrame((_, delta) => {
    if (diskRef.current) diskRef.current.rotation.z += delta * 0.6;
  });

  return (
    <group>
      {/* event horizon — swallows light */}
      <mesh>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* photon ring hugging the horizon */}
      <mesh rotation={[-Math.PI / 2.15, 0, 0]}>
        <ringGeometry args={[2.5, 2.75, 96]} />
        <meshBasicMaterial
          color="#ffe6b0"
          side={DoubleSide}
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* accretion disk */}
      <mesh ref={diskRef} rotation={[-Math.PI / 2.15, 0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* faint lensing halo */}
      <mesh>
        <sphereGeometry args={[3.0, 32, 32]} />
        <meshBasicMaterial
          color="#5a3b8c"
          transparent
          opacity={0.12}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
