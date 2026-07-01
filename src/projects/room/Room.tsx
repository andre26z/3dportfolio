import { MeshStandardMaterial } from "three";
import { useMemo } from "react";

export const ROOM_SIZE = 40;
const WALL_H = 16;

// A cozy empty room: wood floor plus two back walls (left + far) so the space
// reads as a corner without boxing in the camera. Placement raycasts against
// the y=0 plane directly, so these meshes only need to render. Furniture rests
// on the floor; walls receive shadows for depth.
export function Room() {
  const floorMat = useMemo(
    () =>
      new MeshStandardMaterial({ color: "#b08858", roughness: 0.9, metalness: 0 }),
    [],
  );
  const wallMat = useMemo(
    () =>
      new MeshStandardMaterial({ color: "#e7dccb", roughness: 1, metalness: 0 }),
    [],
  );
  const trimMat = useMemo(
    () =>
      new MeshStandardMaterial({ color: "#cbb89b", roughness: 1, metalness: 0 }),
    [],
  );

  const half = ROOM_SIZE / 2;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
      </mesh>

      {/* Far wall (along -Z) */}
      <mesh
        position={[0, WALL_H / 2, -half]}
        receiveShadow
        material={wallMat}
      >
        <boxGeometry args={[ROOM_SIZE, WALL_H, 0.6]} />
      </mesh>
      <mesh position={[0, 0.4, -half + 0.3]} material={trimMat}>
        <boxGeometry args={[ROOM_SIZE, 0.8, 0.4]} />
      </mesh>

      {/* Left wall (along -X) */}
      <mesh
        position={[-half, WALL_H / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <boxGeometry args={[0.6, WALL_H, ROOM_SIZE]} />
      </mesh>
      <mesh position={[-half + 0.3, 0.4, 0]} material={trimMat}>
        <boxGeometry args={[0.4, 0.8, ROOM_SIZE]} />
      </mesh>
    </group>
  );
}
