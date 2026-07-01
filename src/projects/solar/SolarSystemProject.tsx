import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { DoubleSide } from 'three';
import { PLANETS, type PlanetDef } from './planets';
import { Planet } from './Planet';
import { Explosion } from './Explosion';
import { playExplosion } from './sound';

interface Burst {
  key: number;
  position: [number, number, number];
  color: string;
  radius: number;
}

// Faint ring marking a planet's orbit path.
function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 128]} />
      <meshBasicMaterial
        color="#2a2f52"
        side={DoubleSide}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

// The glowing sun at the center.
function Sun() {
  return (
    <mesh>
      <sphereGeometry args={[3, 64, 64]} />
      <meshBasicMaterial color="#ffcf5c" />
    </mesh>
  );
}

export function SolarSystemProject() {
  const [alive, setAlive] = useState<PlanetDef[]>(PLANETS);
  const [bursts, setBursts] = useState<Burst[]>([]);

  const destroy = (def: PlanetDef, position: [number, number, number]) => {
    playExplosion(Math.min(1.4, 0.6 + def.radius * 0.3));
    setAlive((prev) => prev.filter((p) => p.id !== def.id));
    setBursts((prev) => [
      ...prev,
      { key: Date.now() + Math.random(), position, color: def.color, radius: def.radius },
    ]);
  };

  const reset = () => setAlive(PLANETS);

  const rings = useMemo(
    () => PLANETS.map((p) => <OrbitRing key={p.id} radius={p.orbit} />),
    [],
  );

  return (
    <>
      <Canvas
        camera={{ position: [0, 30, 55], fov: 55, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#03040a']} />
        <ambientLight intensity={0.15} />
        {/* sun acts as the light source */}
        <pointLight position={[0, 0, 0]} intensity={800} distance={200} decay={2} color="#fff3d6" />

        <Stars radius={200} depth={80} count={6000} factor={4} fade speed={1} />
        <Sun />
        {rings}

        {alive.map((def) => (
          <Planet key={def.id} def={def} onDestroy={destroy} />
        ))}

        {bursts.map((b) => (
          <Explosion
            key={b.key}
            position={b.position}
            color={b.color}
            radius={b.radius}
            onDone={() =>
              setBursts((prev) => prev.filter((x) => x.key !== b.key))
            }
          />
        ))}

        <OrbitControls
          enablePan={false}
          minDistance={12}
          maxDistance={140}
          autoRotate
          autoRotateSpeed={0.2}
        />

        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      <div style={hud}>
        <span>Click a planet to destroy it · drag to orbit · scroll to zoom</span>
        <span style={{ opacity: 0.7 }}>
          {alive.length}/{PLANETS.length} planets remain
        </span>
        {alive.length < PLANETS.length && (
          <button style={resetBtn} onClick={reset}>
            ↺ Restore system
          </button>
        )}
      </div>
    </>
  );
}

const hud: React.CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 18,
  alignItems: 'center',
  padding: '12px 20px',
  borderRadius: 999,
  background: 'rgba(10,12,30,0.55)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e9eaff',
  fontSize: 14,
  zIndex: 10,
  whiteSpace: 'nowrap',
};

const resetBtn: React.CSSProperties = {
  cursor: 'pointer',
  border: 'none',
  borderRadius: 999,
  padding: '8px 16px',
  fontWeight: 600,
  background: 'linear-gradient(90deg,#00e5c7,#3a7bd5)',
  color: '#0a0a12',
};
