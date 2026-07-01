import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import {
  Camera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { Terrain, TERRAIN_SIZE } from "./Terrain";
import { Structure } from "./Structure";
import { CardTray, CardFace } from "./CardTray";
import { STRUCTURES } from "./structures";

export interface DeckCard {
  uid: number;
  id: string;
}

interface Placed {
  key: number;
  id: string;
  position: [number, number, number];
}

const HALF = TERRAIN_SIZE / 2 - 2; // keep spawns just inside the edge
const GROUND = new Plane(new Vector3(0, 1, 0), 0);

// One of every structure, side by side. Cards are reusable.
function freshDeck(): DeckCard[] {
  return STRUCTURES.map((s, i) => ({ uid: i, id: s.id }));
}

// A placed structure with a rotate handle and delete button that fade in on
// hover. A short close-delay bridges the gap between leaving the mesh and
// entering the floating controls so they don't flicker away.
function PlacedStructure({
  id,
  position,
  onDelete,
}: {
  id: string;
  position: [number, number, number];
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [yaw, setYaw] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = (v: boolean) => {
    clearTimeout(timer.current);
    if (v) setHover(true);
    else timer.current = setTimeout(() => setHover(false), 150);
  };

  return (
    <group
      position={position}
      rotation={[0, yaw, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        show(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        show(false);
      }}
    >
      <Structure id={id} />
      {hover && (
        <Html center position={[0, 4.5, 0]} zIndexRange={[20, 0]}>
          <div
            style={controls}
            onPointerEnter={() => show(true)}
            onPointerLeave={() => show(false)}
          >
            <button
              style={ctrlBtn}
              title="Rotate"
              onClick={() => setYaw((y) => y + Math.PI / 4)}
            >
              ⟳
            </button>
            <button
              style={{ ...ctrlBtn, ...deleteBtn }}
              title="Delete"
              onClick={onDelete}
            >
              ✕
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

// Grabs the R3F camera + canvas element so the DOM-level drop handler can
// raycast screen coordinates onto the ground plane.
function SceneProbe({
  camRef,
  canvasRef,
}: {
  camRef: React.MutableRefObject<Camera | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    camRef.current = camera;
    canvasRef.current = gl.domElement;
  }, [camera, gl]);
  return null;
}

export function TerrainProject() {
  const [deck] = useState<DeckCard[]>(freshDeck);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [drag, setDrag] = useState<{ card: DeckCard; x: number; y: number } | null>(
    null,
  );

  const camRef = useRef<Camera | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<typeof drag>(null);
  dragRef.current = drag;

  const raycaster = useMemo(() => new Raycaster(), []);

  // Converts a screen point to a ground-plane hit, or null if off the terrain.
  const groundPoint = (clientX: number, clientY: number) => {
    const cam = camRef.current;
    const canvas = canvasRef.current;
    if (!cam || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, cam);
    const hit = new Vector3();
    if (!raycaster.ray.intersectPlane(GROUND, hit)) return null;
    if (Math.abs(hit.x) > HALF || Math.abs(hit.z) > HALF) return null;
    return hit;
  };

  // Drag lifecycle lives on window so the card follows the cursor anywhere and
  // a release outside the terrain simply cancels.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragRef.current)
        setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const hit = groundPoint(e.clientX, e.clientY);
      if (hit) {
        setPlaced((prev) => [
          ...prev,
          {
            key: Date.now() + Math.random(),
            id: d.card.id,
            position: [hit.x, 0, hit.z],
          },
        ]);
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const grab = (card: DeckCard, e: React.PointerEvent) =>
    setDrag({ card, x: e.clientX, y: e.clientY });

  const remove = (key: number) =>
    setPlaced((prev) => prev.filter((p) => p.key !== key));

  return (
    <>
      <Canvas
        camera={{ position: [0, 42, 42], fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        shadows
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#0a0c12"]} />
        <fog attach="fog" args={["#0a0c12", 90, 220]} />
        <SceneProbe camRef={camRef} canvasRef={canvasRef} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[40, 60, 30]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-TERRAIN_SIZE / 2}
          shadow-camera-right={TERRAIN_SIZE / 2}
          shadow-camera-top={TERRAIN_SIZE / 2}
          shadow-camera-bottom={-TERRAIN_SIZE / 2}
          shadow-camera-far={200}
        />

        <Terrain />

        {placed.map((p) => (
          <PlacedStructure
            key={p.key}
            id={p.id}
            position={p.position}
            onDelete={() => remove(p.key)}
          />
        ))}

        {/* Zoom only: side-turn and pan disabled, focus locked on center. */}
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enablePan={false}
          enableRotate={false}
          minDistance={20}
          maxDistance={140}
        />
      </Canvas>

      <CardTray deck={deck} draggingUid={drag?.card.uid ?? null} onGrab={grab} />

      {/* Floating card that tracks the cursor while dragging. */}
      {drag && (
        <div
          style={{
            position: "fixed",
            left: drag.x,
            top: drag.y,
            transform: "translate(-50%,-50%) rotate(-4deg) scale(0.9)",
            pointerEvents: "none",
            zIndex: 30,
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.6))",
          }}
        >
          <CardFace id={drag.card.id} />
        </div>
      )}

      <div style={hud}>
        <span>
          Drag a card onto the land · scroll to zoom · hover a structure to
          rotate or delete
        </span>
        <span style={{ opacity: 0.7 }}>{placed.length} placed</span>
      </div>

      <div style={credits}>
        Models via poly.pizza (CC0 / CC-BY):{" "}
        {STRUCTURES.map((s) => s.credit).join(" · ")}. Textures: ambientCG (CC0).
      </div>
    </>
  );
}

const hud: React.CSSProperties = {
  position: "absolute",
  top: 72,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: 18,
  alignItems: "center",
  padding: "10px 20px",
  borderRadius: 999,
  background: "rgba(24,18,10,0.55)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(214,180,120,0.3)",
  color: "#f3e9d6",
  fontSize: 14,
  zIndex: 10,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const controls: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: 4,
  borderRadius: 999,
  background: "rgba(16,12,6,0.85)",
  border: "1px solid rgba(214,180,120,0.4)",
  transform: "translateY(-4px)",
};

const ctrlBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid rgba(214,180,120,0.5)",
  background: "rgba(36,26,16,0.95)",
  color: "#f3e9d6",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const deleteBtn: React.CSSProperties = {
  color: "#ff8a8a",
  borderColor: "rgba(255,120,120,0.5)",
};

const credits: React.CSSProperties = {
  position: "absolute",
  bottom: 6,
  left: 10,
  maxWidth: 360,
  fontSize: 10,
  lineHeight: 1.4,
  color: "#f3e9d6",
  opacity: 0.45,
  zIndex: 10,
  pointerEvents: "none",
};
