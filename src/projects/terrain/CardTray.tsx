import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Structure } from "./Structure";
import { structureById } from "./structures";
import type { DeckCard } from "./TerrainProject";

// Slowly turntables the card's mini model.
function Spin({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return <group ref={ref}>{children}</group>;
}

// Tiny 3D turntable thumbnail of the structure, rendered on the card face.
function CardPreview({ id }: { id: string }) {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 3.4], fov: 32 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: 96 }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 2]} intensity={1.3} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} />
      <Spin>
        <Structure id={id} preview />
      </Spin>
    </Canvas>
  );
}

interface CardTrayProps {
  deck: DeckCard[];
  draggingUid: number | null;
  onGrab: (card: DeckCard, e: React.PointerEvent) => void;
}

const KIND_COLOR: Record<string, string> = {
  Fortification: "#7fa8ff",
  "Siege Engine": "#ff9d5c",
  Military: "#e06b6b",
  Civilian: "#8fd48a",
  Infrastructure: "#c7a9e0",
};

// Static face of a single card (also reused for the floating drag ghost).
export function CardFace({ id, dim }: { id: string; dim?: boolean }) {
  const def = structureById(id);
  const accent = KIND_COLOR[def.kind] ?? "#d6b478";
  return (
    <div style={{ ...face, ...(dim ? { opacity: 0.25 } : null) }}>
      <div style={{ ...banner, color: accent }}>
        <span style={title}>{def.label}</span>
        <span style={{ ...badge, borderColor: accent, color: accent }}>
          {def.kind}
        </span>
      </div>
      <div style={{ ...preview, borderColor: `${accent}44` }}>
        <CardPreview id={id} />
      </div>
      <p style={desc}>{def.description}</p>
    </div>
  );
}

// The deck: one of each structure, fanned side by side. Cards are reusable —
// dragging spawns a structure without consuming the card.
export function CardTray({ deck, draggingUid, onGrab }: CardTrayProps) {
  return (
    <div style={wrap}>
      <div style={hand}>
        {deck.map((c) => (
          <div
            key={c.uid}
            style={{
              ...slot,
              ...(draggingUid === c.uid ? { opacity: 0.3 } : null),
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              onGrab(c, e);
            }}
          >
            <CardFace id={c.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "absolute",
  bottom: 16,
  left: 0,
  right: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  zIndex: 15,
};

const hand: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 8,
  padding: "0 16px",
  maxWidth: "100vw",
  overflowX: "auto",
};

const slot: React.CSSProperties = {
  cursor: "grab",
  touchAction: "none",
  transition: "transform 0.12s, opacity 0.12s",
  flex: "0 0 auto",
};

export const face: React.CSSProperties = {
  width: 132,
  height: 208,
  padding: 8,
  borderRadius: 12,
  background: "linear-gradient(160deg,#241a10,#150f08)",
  border: "1px solid rgba(214,180,120,0.45)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
  color: "#f3e9d6",
  display: "flex",
  flexDirection: "column",
  userSelect: "none",
};

const banner: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  marginBottom: 4,
};

const title: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: "0.01em",
};

const badge: React.CSSProperties = {
  alignSelf: "flex-start",
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "1px 6px",
  borderRadius: 999,
  border: "1px solid",
};

const preview: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid",
  background: "radial-gradient(circle at 50% 40%,#2c2114,#0d0a06)",
  overflow: "hidden",
};

const desc: React.CSSProperties = {
  margin: "6px 2px 0",
  fontSize: 10,
  lineHeight: 1.35,
  opacity: 0.82,
  flex: 1,
};

