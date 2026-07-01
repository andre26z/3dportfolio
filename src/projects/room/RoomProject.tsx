import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Camera, Plane, Raycaster, Vector2, Vector3 } from "three";
import { Room, ROOM_SIZE } from "./Room";
import { Furniture } from "./Furniture";
import { CardTray } from "./CardTray";
import { FURNITURE } from "./furniture";

export interface DeckCard {
  uid: number;
  id: string;
}

interface Placed {
  key: number;
  id: string;
  position: [number, number, number];
}

const HALF = ROOM_SIZE / 2 - 2; // keep spawns just inside the walls
const GROUND = new Plane(new Vector3(0, 1, 0), 0);

// One of every piece, side by side. Cards are reusable.
function freshDeck(): DeckCard[] {
  return FURNITURE.map((f, i) => ({ uid: i, id: f.id }));
}

// A placed piece with a rotate handle and delete button that fade in on hover.
// A short close-delay bridges the gap between leaving the mesh and entering the
// floating controls so they don't flicker away.
function PlacedFurniture({
  id,
  position,
  moving,
  onMoveStart,
  onDelete,
}: {
  id: string;
  position: [number, number, number];
  moving: boolean;
  onMoveStart: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [yaw, setYaw] = useState(0);
  const [lift, setLift] = useState(0); // vertical offset above the floor
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
      onPointerDown={(e) => {
        e.stopPropagation();
        onMoveStart();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        show(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        show(false);
      }}
    >
      <group position={[0, lift, 0]}>
        <Furniture id={id} highlight={hover || moving} />
      </group>
      {hover && !moving && (
        <Html center position={[0, lift + 4.5, 0]} zIndexRange={[20, 0]}>
          <div
            style={controls}
            onPointerEnter={() => show(true)}
            onPointerLeave={() => show(false)}
          >
            <button
              style={ctrlBtn}
              title="Raise"
              onClick={() => setLift((v) => v + 0.5)}
            >
              ▲
            </button>
            <button
              style={ctrlBtn}
              title="Lower"
              onClick={() => setLift((v) => Math.max(0, v - 0.5))}
            >
              ▼
            </button>
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
// raycast screen coordinates onto the floor plane.
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

export function RoomProject() {
  const [deck] = useState<DeckCard[]>(freshDeck);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [drag, setDrag] = useState<DeckCard | null>(null);
  const [ghost, setGhost] = useState<[number, number, number] | null>(null);
  const [moving, setMoving] = useState<number | null>(null); // placed key being repositioned

  const camRef = useRef<Camera | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<DeckCard | null>(null);
  const ghostRef = useRef<[number, number, number] | null>(null);
  const movingRef = useRef<number | null>(null);
  dragRef.current = drag;
  ghostRef.current = ghost;
  movingRef.current = moving;

  const raycaster = useMemo(() => new Raycaster(), []);

  // Converts a screen point to a floor-plane hit, or null if off the room.
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

  // Drag lifecycle lives on window: pressing a card arms it, a translucent 3D
  // model follows the cursor across the floor, and releasing drops it (or
  // cancels if released off the room).
  useEffect(() => {
    const move = (e: PointerEvent) => {
      // Repositioning an existing piece.
      if (movingRef.current != null) {
        const hit = groundPoint(e.clientX, e.clientY);
        if (hit)
          setPlaced((prev) =>
            prev.map((p) =>
              p.key === movingRef.current
                ? { ...p, position: [hit.x, 0, hit.z] }
                : p,
            ),
          );
        return;
      }
      // Dragging a new piece off a card.
      if (!dragRef.current) return;
      const hit = groundPoint(e.clientX, e.clientY);
      setGhost(hit ? [hit.x, 0, hit.z] : null);
    };
    const up = () => {
      if (movingRef.current != null) {
        setMoving(null);
        return;
      }
      const d = dragRef.current;
      const pos = ghostRef.current;
      if (d && pos) {
        setPlaced((prev) => [
          ...prev,
          { key: Date.now() + Math.random(), id: d.id, position: pos },
        ]);
      }
      setDrag(null);
      setGhost(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const grab = (card: DeckCard, e: React.PointerEvent) => {
    const hit = groundPoint(e.clientX, e.clientY);
    setDrag(card);
    setGhost(hit ? [hit.x, 0, hit.z] : null);
  };

  const remove = (key: number) =>
    setPlaced((prev) => prev.filter((p) => p.key !== key));

  return (
    <>
      <Canvas
        camera={{ position: [0, 34, 38], fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        shadows
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#efe7d8"]} />
        <SceneProbe camRef={camRef} canvasRef={canvasRef} />

        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#fff7e6", "#8a7a5c", 0.5]} />
        <directionalLight
          position={[30, 50, 25]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-ROOM_SIZE / 2}
          shadow-camera-right={ROOM_SIZE / 2}
          shadow-camera-top={ROOM_SIZE / 2}
          shadow-camera-bottom={-ROOM_SIZE / 2}
          shadow-camera-far={200}
        />

        <Room />

        {placed.map((p) => (
          <PlacedFurniture
            key={p.key}
            id={p.id}
            position={p.position}
            moving={moving === p.key}
            onMoveStart={() => setMoving(p.key)}
            onDelete={() => remove(p.key)}
          />
        ))}

        {drag && ghost && <Furniture id={drag.id} position={ghost} ghost />}

        {/* Free camera: orbit, pan, and zoom anywhere. */}
        <OrbitControls
          makeDefault
          enabled={moving == null && drag == null}
          enablePan
          screenSpacePanning
          minDistance={5}
          maxDistance={200}
        />
      </Canvas>

      <CardTray deck={deck} draggingUid={drag?.uid ?? null} onGrab={grab} />

      <div style={hud}>
        <span>
          Drag a card onto the floor · drag a piece to move it · left-drag orbits ·
          right-drag pans · scroll to zoom · hover to raise, lower, rotate, delete
        </span>
        <span style={{ opacity: 0.7 }}>{placed.length} placed</span>
      </div>

      <div style={credits}>
        Models CC0 via Kenney & KayKit (Kay Lousberg). Furniture Bits & Furniture
        Kit.
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
  background: "rgba(255,250,240,0.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(120,95,60,0.3)",
  color: "#3a2f22",
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
  background: "rgba(255,250,240,0.95)",
  border: "1px solid rgba(120,95,60,0.4)",
  transform: "translateY(-4px)",
};

const ctrlBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid rgba(120,95,60,0.5)",
  background: "rgba(250,244,232,0.98)",
  color: "#3a2f22",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const deleteBtn: React.CSSProperties = {
  color: "#c0392b",
  borderColor: "rgba(192,57,43,0.5)",
};

const credits: React.CSSProperties = {
  position: "absolute",
  bottom: 6,
  left: 10,
  maxWidth: 360,
  fontSize: 10,
  lineHeight: 1.4,
  color: "#3a2f22",
  opacity: 0.5,
  zIndex: 10,
  pointerEvents: "none",
};
