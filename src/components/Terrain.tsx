import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial } from 'three';
import { terrainFragment, terrainVertex } from '../shaders/terrain';
import { palette } from '../palette';
import { useAnalyser } from './AnalyserContext';
import { BASE_Y, type WaveState } from './waveField';

interface Props {
  // Terrain writes its live, smoothed wave params here each frame so the marble
  // can sample the exact same surface it renders.
  waveRef: React.MutableRefObject<WaveState>;
}

// Displaced wireframe plane forming the reactive wave surface.
export function Terrain({ waveRef }: Props) {
  const { bandsRef } = useAnalyser();

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

    // publish for the marble
    waveRef.current.time = u.uTime.value;
    waveRef.current.bass = u.uBass.value;
    waveRef.current.mid = u.uMid.value;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, BASE_Y, 0]}
      material={material}
    >
      <planeGeometry args={[80, 80, 200, 200]} />
    </mesh>
  );
}
