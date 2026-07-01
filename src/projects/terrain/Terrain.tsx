import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  RepeatWrapping,
  ShaderMaterial,
  Vector3,
  DoubleSide,
  SRGBColorSpace,
  type Texture,
} from "three";
export const TERRAIN_SIZE = 80;

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Grass in the middle, sand toward the edges: blend by radial distance from the
// world origin. A little value noise softens the seam so it doesn't read as a
// perfect circle. Lighting is a simple lambert term against one light dir.
const fragment = /* glsl */ `
  uniform sampler2D uGrass;
  uniform sampler2D uSand;
  uniform vec3 uLightDir;
  uniform float uTile;
  uniform float uInner;
  uniform float uOuter;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }

  void main() {
    vec2 uv = vUv * uTile;
    vec3 grass = texture2D(uGrass, uv).rgb;
    vec3 sand = texture2D(uSand, uv).rgb;

    float d = length(vWorld.xz);
    float n = (hash(floor(vWorld.xz * 0.35)) - 0.5) * 6.0;
    float t = smoothstep(uInner, uOuter, d + n);
    vec3 albedo = mix(grass, sand, t);

    float diff = max(dot(vec3(0.0, 1.0, 0.0), normalize(uLightDir)), 0.0);
    vec3 color = albedo * (0.45 + 0.75 * diff);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Flat ground plane. Placement raycasts against the y=0 plane directly, so this
// mesh only needs to render.
export function Terrain() {
  const [grass, sand] = useTexture([
    "/terrain/tex/grass.jpg",
    "/terrain/tex/sand.jpg",
  ]);

  const material = useMemo(() => {
    [grass, sand].forEach((t: Texture) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
    });
    return new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: DoubleSide,
      uniforms: {
        uGrass: { value: grass },
        uSand: { value: sand },
        uLightDir: { value: new Vector3(0.4, 1.0, 0.6) },
        uTile: { value: 24 },
        uInner: { value: TERRAIN_SIZE * 0.28 },
        uOuter: { value: TERRAIN_SIZE * 0.5 },
      },
    });
  }, [grass, sand]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE, 1, 1]} />
    </mesh>
  );
}
