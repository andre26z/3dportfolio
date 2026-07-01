import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { DoubleSide, type Mesh } from 'three';
import type { PlanetDef } from './planets';
import { planetTexture } from './textures';

interface Props {
  def: PlanetDef;
  onDestroy: (def: PlanetDef, position: [number, number, number]) => void;
  // When true the planet spirals into the black hole, stretching under tidal
  // force, until consumed.
  collapsing?: boolean;
  onConsumed?: (def: PlanetDef, position: [number, number, number]) => void;
}

const HORIZON = 2.6; // distance at which a planet is swallowed

// A single orbiting planet: procedural texture, floating name label that turns
// into a "destroy" prompt on hover, optional ring. Reports its live world
// position on click so the explosion spawns exactly where it was.
export function Planet({ def, onDestroy, collapsing, onConsumed }: Props) {
  const meshRef = useRef<Mesh>(null);
  const angle = useRef(Math.random() * Math.PI * 2);
  const dist = useRef(def.orbit); // live orbit distance (shrinks on collapse)
  const consumed = useRef(false);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => planetTexture(def), [def]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (collapsing) {
      // pull accelerates as it nears the hole (fake gravity ~ 1/r)
      const gravity = 6 + (60 * def.orbit) / (dist.current * dist.current);
      dist.current = Math.max(0, dist.current - gravity * delta);
      // angular speed rises as radius shrinks (spin-up of the infall)
      angle.current += def.speed * delta * (def.orbit / Math.max(1, dist.current));

      const x = Math.cos(angle.current) * dist.current;
      const z = Math.sin(angle.current) * dist.current;
      mesh.position.set(x, 0, z);

      // tidal spaghettification: stretch toward the hole, squash across it.
      // Grows as the planet approaches the horizon.
      const closeness = 1 - Math.min(1, (dist.current - HORIZON) / def.orbit);
      const stretch = 1 + closeness * closeness * 6;
      const squash = 1 / Math.sqrt(stretch);
      mesh.lookAt(0, 0, 0); // local +Z now points at the hole
      mesh.scale.set(squash, squash, stretch);

      if (dist.current <= HORIZON && !consumed.current) {
        consumed.current = true;
        onConsumed?.(def, [x, 0, z]);
      }
      return;
    }

    // normal circular orbit
    angle.current += def.speed * delta;
    mesh.position.x = Math.cos(angle.current) * def.orbit;
    mesh.position.z = Math.sin(angle.current) * def.orbit;
    mesh.rotation.y += def.spin * delta;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (collapsing) return;
    e.stopPropagation();
    const m = meshRef.current;
    if (!m) return;
    setHovered(false);
    document.body.style.cursor = 'auto';
    onDestroy(def, [m.position.x, m.position.y, m.position.z]);
  };

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (collapsing) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      scale={hovered ? 1.12 : 1}
    >
      <sphereGeometry args={[def.radius, 48, 48]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0.1}
        emissive={def.color}
        emissiveIntensity={hovered ? 0.3 : 0.06}
      />

      {/* Saturn-style ring */}
      {def.ring && (
        <mesh rotation={[-Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[def.radius * 1.4, def.radius * 2.2, 64]} />
          <meshBasicMaterial
            map={texture}
            color={def.accent}
            side={DoubleSide}
            transparent
            opacity={0.55}
          />
        </mesh>
      )}

      {/* floating label — hidden once the planet is being pulled in */}
      {!collapsing && (
      <Html
        position={[0, def.radius + 0.9, 0]}
        center
        distanceFactor={18}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            padding: hovered ? '4px 12px' : '2px 8px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
            color: hovered ? '#0a0a12' : '#e9eaff',
            background: hovered
              ? 'linear-gradient(90deg,#ff2e88,#ff8a3d)'
              : 'rgba(10,12,30,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: hovered ? '0 0 18px rgba(255,46,136,0.6)' : 'none',
          }}
        >
          {hovered ? `✕ Destroy ${def.name}` : def.name}
        </div>
      </Html>
      )}
    </mesh>
  );
}
