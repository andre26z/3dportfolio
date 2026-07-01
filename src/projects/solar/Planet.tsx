import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { DoubleSide, type Mesh } from 'three';
import type { PlanetDef } from './planets';
import { planetTexture } from './textures';

interface Props {
  def: PlanetDef;
  onDestroy: (def: PlanetDef, position: [number, number, number]) => void;
}

// A single orbiting planet: procedural texture, floating name label that turns
// into a "destroy" prompt on hover, optional ring. Reports its live world
// position on click so the explosion spawns exactly where it was.
export function Planet({ def, onDestroy }: Props) {
  const meshRef = useRef<Mesh>(null);
  const angle = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => planetTexture(def), [def]);

  useFrame((_, delta) => {
    angle.current += def.speed * delta;
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.x = Math.cos(angle.current) * def.orbit;
    mesh.position.z = Math.sin(angle.current) * def.orbit;
    mesh.rotation.y += def.spin * delta;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
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

      {/* floating label — turns into a destroy prompt on hover */}
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
    </mesh>
  );
}
