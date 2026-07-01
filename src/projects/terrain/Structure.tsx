import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { STRUCTURES, structureById } from "./structures";

// Preload every model so the first drop doesn't stall.
STRUCTURES.forEach((s) => useGLTF.preload(s.url));

interface StructureProps {
  id: string;
  position?: [number, number, number];
  preview?: boolean; // card thumbnail: fit whole model into a small box, centered
  ghost?: boolean; // translucent drag preview that ignores pointer events
  onClick?: () => void;
}

// Renders one placed structure (or a centered card-preview). Source GLBs come
// at wildly different scales, so we fit each by bounding box — no per-model
// magic numbers. Placed models rest on y=0; previews are centered at origin.
export function Structure({
  id,
  position,
  preview,
  ghost,
  onClick,
}: StructureProps) {
  const def = structureById(id);
  const { scene } = useGLTF(def.url);

  const object = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    if (preview) {
      // Fit the entire model (all axes) into ~2.2 units and center it.
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.2 / maxDim;
      clone.scale.setScalar(scale);
      clone.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale,
      );
    } else {
      // Fit horizontal footprint and rest on the ground.
      const maxXZ = Math.max(size.x, size.z) || 1;
      const scale = def.footprint / maxXZ;
      clone.scale.setScalar(scale);
      clone.position.y = -box.min.y * scale;
    }

    clone.traverse((o: Object3D) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = !preview && !ghost;
      m.receiveShadow = !preview && !ghost;
      if (ghost) {
        const mats = (Array.isArray(m.material) ? m.material : [m.material]).map(
          (src) => {
            const g = (src as MeshStandardMaterial).clone();
            g.transparent = true;
            g.opacity = 0.5;
            g.depthWrite = false;
            g.emissive?.setRGB(0.12, 0.4, 0.22);
            return g;
          },
        );
        m.material = mats.length === 1 ? mats[0] : mats;
      }
    });

    return clone;
  }, [scene, def.footprint, preview, ghost]);

  return (
    <group
      position={position}
      raycast={ghost ? () => null : undefined}
      onClick={
        onClick && !ghost
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      <primitive object={object} />
    </group>
  );
}
