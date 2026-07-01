import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Terrain } from './Terrain';
import { Marble } from './Marble';
import { palette } from '../palette';
import { useAnalyser } from './AnalyserContext';
import type { WaveState } from './waveField';

// Single owner of the per-frame analyser refresh + slow camera fly-over.
export function Scene() {
  const { refresh, bandsRef } = useAnalyser();
  const { camera } = useThree();

  // Shared wave surface state: Terrain writes it, Marble reads it.
  const waveRef = useRef<WaveState>({ time: 0, bass: 0, mid: 0 });

  useFrame((state) => {
    refresh(); // pull latest frequency frame once per frame

    const t = state.clock.elapsedTime;
    const bass = bandsRef.current.bass;
    // slow orbit, radius breathes with bass
    const radius = 34 + bass * 8;
    camera.position.x = Math.sin(t * 0.08) * radius;
    camera.position.z = Math.cos(t * 0.08) * radius;
    camera.position.y = 14 + bass * 6;
    camera.lookAt(0, -1, 0);
  });

  return (
    <>
      <color attach="background" args={[palette.bg.getHex()]} />
      <fog attach="fog" args={[palette.fog.getHex(), 30, 90]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <pointLight position={[0, 8, 0]} intensity={2} color={palette.archHot} />

      <Terrain waveRef={waveRef} />
      <Marble waveRef={waveRef} />

      <EffectComposer>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
