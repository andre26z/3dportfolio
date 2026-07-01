// Registry of placeable furniture. Each maps a card to a self-contained GLB
// under /public/room/models. `footprint` is the target width (in world units)
// the model is normalized to at spawn — raw model scales vary, so Furniture.tsx
// fits each by bounding box rather than trusting raw units.
export interface FurnitureDef {
  id: string;
  label: string; // card title
  kind: string; // card type badge (Seating / Electronics / ...)
  description: string; // room-card flavor text
  url: string; // glb path
  footprint: number; // normalized max horizontal size when placed
  credit: string; // attribution (models are CC0 via Kenney / KayKit)
}

export const FURNITURE: FurnitureDef[] = [
  {
    id: "couch",
    label: "Couch",
    kind: "Seating",
    description:
      "A wide, cushioned sofa. The heart of the living room and prime spot for lazy Sundays.",
    url: "/room/models/couch.glb",
    footprint: 6,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "armchair",
    label: "Armchair",
    kind: "Seating",
    description:
      "A single cozy armchair. Pull it by the window for reading light.",
    url: "/room/models/armchair.glb",
    footprint: 3.6,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "chair",
    label: "Chair",
    kind: "Seating",
    description: "A simple wooden chair. Tuck it under a table or desk.",
    url: "/room/models/chair.glb",
    footprint: 2.6,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "table",
    label: "Table",
    kind: "Surface",
    description: "A sturdy dining table. Gather round for meals and games.",
    url: "/room/models/table.glb",
    footprint: 4.5,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "desk",
    label: "Desk",
    kind: "Surface",
    description: "A work desk with drawers. Home base for the computer setup.",
    url: "/room/models/desk.glb",
    footprint: 5,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "monitor",
    label: "Computer",
    kind: "Electronics",
    description: "A desktop monitor. Sit it on the desk and get to work.",
    url: "/room/models/monitor.glb",
    footprint: 2.2,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "keyboard",
    label: "Keyboard",
    kind: "Electronics",
    description: "A mechanical keyboard. Clack away in front of the monitor.",
    url: "/room/models/keyboard.glb",
    footprint: 2,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "television",
    label: "TV",
    kind: "Electronics",
    description: "A modern flat-screen television. Mount it opposite the couch.",
    url: "/room/models/television.glb",
    footprint: 4,
    credit: "Furniture Kit — Kenney",
  },
  {
    id: "bookshelf",
    label: "Bookshelf",
    kind: "Storage",
    description: "A tall open shelf. Line it with books, plants, and clutter.",
    url: "/room/models/bookshelf.glb",
    footprint: 4,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "bed",
    label: "Bed",
    kind: "Bedroom",
    description: "A double bed with headboard. Push it against the far wall.",
    url: "/room/models/bed.glb",
    footprint: 7,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "lamp",
    label: "Floor Lamp",
    kind: "Lighting",
    description: "A standing floor lamp. Cast a warm glow into the corner.",
    url: "/room/models/lamp.glb",
    footprint: 2.4,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "rug",
    label: "Rug",
    kind: "Decor",
    description: "A patterned area rug. Anchor the seating and warm the floor.",
    url: "/room/models/rug.glb",
    footprint: 7,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "painting",
    label: "Tapestry",
    kind: "Decor",
    description:
      "A large framed tapestry. Prop it against a wall to dress the room.",
    url: "/room/models/painting.glb",
    footprint: 4,
    credit: "Furniture Bits — KayKit",
  },
  {
    id: "plant",
    label: "Plant",
    kind: "Decor",
    description: "A big potted cactus. A splash of green in any corner.",
    url: "/room/models/plant.glb",
    footprint: 2.6,
    credit: "Furniture Bits — KayKit",
  },
];

export function furnitureById(id: string): FurnitureDef {
  const f = FURNITURE.find((x) => x.id === id);
  if (!f) throw new Error(`unknown furniture ${id}`);
  return f;
}
