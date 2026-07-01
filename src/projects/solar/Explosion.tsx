import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  InstancedMesh,
  Object3D,
  Points,
  PointLight,
  type BufferGeometry,
  type Mesh,
  type MeshBasicMaterial,
  type PointsMaterial,
} from 'three';

interface Props {
  position: [number, number, number];
  color: string;
  radius: number;
  onDone: () => void;
}

const LIFETIME = 2.4; // seconds — longest-lived layer governs cleanup

// Hot fire gradient: white-hot core -> yellow -> orange -> deep red.
const FIRE_STOPS = ['#fff6d0', '#ffd23f', '#ff7a1a', '#e02200'].map(
  (c) => new Color(c),
);

function fireColor(t: number, out: Color): Color {
  const seg = t * (FIRE_STOPS.length - 1);
  const i = Math.min(FIRE_STOPS.length - 2, Math.floor(seg));
  return out.copy(FIRE_STOPS[i]).lerp(FIRE_STOPS[i + 1], seg - i);
}

// A dramatic, multi-layer explosion:
//   1. flash        — brief point light spike
//   2. fireball     — glowing additive sphere that swells then fades
//   3. fire         — hot additive particles with turbulence + buoyancy
//   4. debris       — solid instanced chunks tumbling outward under gravity
//   5. shockwave    — expanding flat ring
// Self-reports completion via onDone.
export function Explosion({ position, color, radius, onDone }: Props) {
  const age = useRef(0);

  const lightRef = useRef<PointLight>(null);
  const fireballRef = useRef<Mesh>(null);
  const shockRef = useRef<Mesh>(null);
  const fireRef = useRef<Points>(null);
  const debrisRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const fireCount = Math.floor(260 + radius * 160);
  const debrisCount = Math.floor(26 + radius * 18);

  // --- fire particle buffers ---
  const fire = useMemo(() => {
    const positions = new Float32Array(fireCount * 3);
    const velocities = new Float32Array(fireCount * 3);
    const colors = new Float32Array(fireCount * 3);
    const c = new Color();
    for (let i = 0; i < fireCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = [
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ];
      const speed = (3 + Math.random() * 6) * (0.6 + radius * 0.35);
      velocities[i * 3] = dir[0] * speed;
      velocities[i * 3 + 1] = dir[1] * speed;
      velocities[i * 3 + 2] = dir[2] * speed;
      positions[i * 3] = dir[0] * radius * 0.4;
      positions[i * 3 + 1] = dir[1] * radius * 0.4;
      positions[i * 3 + 2] = dir[2] * radius * 0.4;
      fireColor(Math.random() * 0.5, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, velocities, colors };
  }, [fireCount, radius]);

  // --- debris chunk kinematics ---
  const debris = useMemo(() => {
    const pos: [number, number, number][] = [];
    const vel: [number, number, number][] = [];
    const rot: [number, number, number][] = [];
    const rotVel: [number, number, number][] = [];
    const scale: number[] = [];
    for (let i = 0; i < debrisCount; i++) {
      pos.push([0, 0, 0]);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (2.5 + Math.random() * 5) * (0.6 + radius * 0.4);
      vel.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + 1.5,
        Math.cos(phi) * speed,
      ]);
      rot.push([Math.random() * 6, Math.random() * 6, Math.random() * 6]);
      rotVel.push([
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ]);
      scale.push((0.12 + Math.random() * 0.28) * (0.6 + radius * 0.5));
    }
    return { pos, vel, rot, rotVel, scale };
  }, [debrisCount, radius]);

  const debrisColor = useMemo(() => new Color(color).multiplyScalar(0.8), [color]);

  useFrame((_, delta) => {
    age.current += delta;
    const t = age.current / LIFETIME;
    if (t >= 1) {
      onDone();
      return;
    }

    // 1. flash — sharp spike in the first ~0.25s
    if (lightRef.current) {
      const f = Math.max(0, 1 - age.current / 0.25);
      lightRef.current.intensity = f * f * (120 + radius * 120);
    }

    // 2. fireball — swell then fade over first ~0.7s
    if (fireballRef.current) {
      const ft = Math.min(1, age.current / 0.7);
      const s = radius * (0.6 + ft * 3.2);
      fireballRef.current.scale.setScalar(s);
      const mat = fireballRef.current.material as MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - ft) * 0.9;
      fireColor(ft, mat.color);
    }

    // 3. fire particles — turbulence + buoyant rise, decelerate, fade
    const firePts = fireRef.current;
    if (firePts) {
      const geom = firePts.geometry as BufferGeometry;
      const attr = geom.getAttribute('position') as BufferAttribute;
      const arr = attr.array as Float32Array;
      const drag = 1 - delta * 1.6;
      for (let i = 0; i < fireCount; i++) {
        fire.velocities[i * 3] *= drag;
        fire.velocities[i * 3 + 1] = fire.velocities[i * 3 + 1] * drag + delta * 1.2;
        fire.velocities[i * 3 + 2] *= drag;
        arr[i * 3] += fire.velocities[i * 3] * delta;
        arr[i * 3 + 1] += fire.velocities[i * 3 + 1] * delta;
        arr[i * 3 + 2] += fire.velocities[i * 3 + 2] * delta;
      }
      attr.needsUpdate = true;
      const mat = firePts.material as PointsMaterial;
      mat.opacity = Math.max(0, 1 - t * 1.1);
      mat.size = (0.6 + radius * 0.25) * (1 - t * 0.5);
    }

    // 4. debris — tumble outward, gravity pulls down, lingers longest
    const inst = debrisRef.current;
    if (inst) {
      for (let i = 0; i < debrisCount; i++) {
        const v = debris.vel[i];
        v[1] -= delta * 4.5; // gravity
        const p = debris.pos[i];
        p[0] += v[0] * delta;
        p[1] += v[1] * delta;
        p[2] += v[2] * delta;
        const r = debris.rot[i];
        r[0] += debris.rotVel[i][0] * delta;
        r[1] += debris.rotVel[i][1] * delta;
        r[2] += debris.rotVel[i][2] * delta;
        dummy.position.set(p[0], p[1], p[2]);
        dummy.rotation.set(r[0], r[1], r[2]);
        dummy.scale.setScalar(debris.scale[i] * Math.max(0.2, 1 - t));
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    }

    // 5. shockwave — flat expanding ring, quick
    if (shockRef.current) {
      const st = Math.min(1, age.current / 0.6);
      shockRef.current.scale.setScalar(radius * (0.5 + st * 6));
      const mat = shockRef.current.material as MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - st) * 0.7;
    }
  });

  return (
    <group position={position}>
      <pointLight ref={lightRef} color="#ffb24d" distance={60} decay={2} />

      {/* fireball */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#ffd23f"
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* shockwave */}
      <mesh ref={shockRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 48]} />
        <meshBasicMaterial
          color="#ffdca0"
          transparent
          opacity={0.7}
          blending={AdditiveBlending}
          depthWrite={false}
          side={2}
        />
      </mesh>

      {/* fire particles */}
      <points ref={fireRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fire.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[fire.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.7}
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      {/* solid debris chunks */}
      <instancedMesh
        ref={debrisRef}
        args={[undefined, undefined, debrisCount]}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={debrisColor}
          emissive={new Color('#5a1500')}
          emissiveIntensity={0.4}
          roughness={0.9}
          metalness={0.1}
        />
      </instancedMesh>
    </group>
  );
}
