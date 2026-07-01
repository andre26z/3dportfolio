import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { FURNITURE, furnitureById } from "./furniture";

// Preload every model so the first drop doesn't stall.
FURNITURE.forEach((f) => useGLTF.preload(f.url));

// World-space height of a placed model after footprint normalization. Lets the
// hover controls sit right on top of each piece instead of a fixed gap.
export function useModelHeight(id: string): number {
  const def = furnitureById(id);
  const { scene } = useGLTF(def.url);
  return useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    const maxXZ = Math.max(size.x, size.z) || 1;
    return size.y * (def.footprint / maxXZ);
  }, [scene, def.footprint]);
}

interface FurnitureProps {
  id: string;
  position?: [number, number, number];
  preview?: boolean; // card thumbnail: fit whole model into a small box, centered
  ghost?: boolean; // translucent drag preview that ignores pointer events
  highlight?: boolean; // solid green tint on the piece you're editing/moving
  onClick?: () => void;
}

// Renders one placed furniture piece (or a centered card-preview). Source GLBs
// come at varying scales, so we fit each by bounding box — no per-model magic
// numbers. Placed models rest on y=0; previews are centered at origin.
export function Furniture({
  id,
  position,
  preview,
  ghost,
  highlight,
  onClick,
}: FurnitureProps) {
  const def = furnitureById(id);
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
      // Fit horizontal footprint, center over the origin (so yaw spins in
      // place instead of orbiting), and rest on the floor.
      const maxXZ = Math.max(size.x, size.z) || 1;
      const scale = def.footprint / maxXZ;
      clone.scale.setScalar(scale);
      clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
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
      } else if (highlight) {
        const mats = (Array.isArray(m.material) ? m.material : [m.material]).map(
          (src) => {
            const g = (src as MeshStandardMaterial).clone();
            g.emissive?.setRGB(0.1, 0.55, 0.2);
            return g;
          },
        );
        m.material = mats.length === 1 ? mats[0] : mats;
      }
    });

    return clone;
  }, [scene, def.footprint, preview, ghost, highlight]);

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
