import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, type Mesh } from 'three';
import { terrainFragment, terrainVertex } from '../shaders/terrain';
import { palette } from '../palette';
import { useAnalyser } from './AnalyserContext';

// Displaced wireframe plane forming the reactive terrain floor.
export function Terrain() {
  const { bandsRef } = useAnalyser();
  const meshRef = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: terrainVertex,
        fragmentShader: terrainFragment,
        wireframe: true,
        uniforms: {
          uTime: { value: 0 },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uLow: { value: palette.terrainLow },
          uHigh: { value: palette.terrainHigh },
        },
      }),
    [],
  );

  useFrame((_, delta) => {
    const u = material.uniforms;
    u.uTime.value += delta;
    // ease toward live band levels so motion stays smooth
    u.uBass.value += (bandsRef.current.bass - u.uBass.value) * 0.2;
    u.uMid.value += (bandsRef.current.mid - u.uMid.value) * 0.2;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2.2, 0, 0]}
      position={[0, -4, 0]}
      material={material}
    >
      <planeGeometry args={[80, 80, 160, 160]} />
    </mesh>
  );
}
