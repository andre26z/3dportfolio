import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import { palette } from '../palette';
import { useAnalyser } from './AnalyserContext';

const GRID = 12; // GRID x GRID columns
const COUNT = GRID * GRID;
const SPACING = 3.2;

// A grid of instanced columns. Each column maps to a frequency bin: its height
// pulses with that bin's energy, and color shifts base->hot with treble.
export function Architecture() {
  const { dataRef, bandsRef } = useAnalyser();
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const heights = useMemo(() => new Float32Array(COUNT).fill(0.1), []);
  const color = useMemo(() => new Color(), []);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        metalness: 0.6,
        roughness: 0.25,
        emissiveIntensity: 1.2,
      }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const freq = dataRef.current;
    const treble = bandsRef.current.treble;

    for (let i = 0; i < COUNT; i++) {
      const x = (i % GRID) - (GRID - 1) / 2;
      const z = Math.floor(i / GRID) - (GRID - 1) / 2;

      // sample a bin, skipping the very lowest to spread energy visually
      const bin = 4 + Math.floor((i / COUNT) * 180);
      const target = 0.2 + (freq[bin] / 255) * 14;
      heights[i] += (target - heights[i]) * 0.25; // smooth

      dummy.position.set(x * SPACING, heights[i] / 2 - 3.8, z * SPACING);
      dummy.scale.set(1, heights[i], 1);
      dummy.rotation.y = heights[i] * 0.05;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.copy(palette.archBase).lerp(palette.archHot, treble);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    material.emissive = palette.archHot;
    material.emissiveIntensity = 0.3 + treble * 1.5;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, material, COUNT]}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}
