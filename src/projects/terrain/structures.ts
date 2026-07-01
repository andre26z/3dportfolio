// Registry of placeable medieval structures. Each maps a card to a CC0/CC-BY
// GLB model under /public/terrain/models. `footprint` is the target width (in
// world units) the model is normalized to at spawn — actual model scales vary,
// so Structure.tsx fits each by bounding box rather than trusting raw units.
export interface StructureDef {
  id: string;
  label: string; // card title
  kind: string; // card type badge (Fortification / Siege / ...)
  description: string; // battle-card flavor text
  url: string; // glb path
  footprint: number; // normalized max horizontal size when placed
  credit: string; // attribution (models are CC0 / CC-BY via poly.pizza)
}

export const STRUCTURES: StructureDef[] = [
  {
    id: "castle",
    label: "Castle",
    kind: "Fortification",
    description:
      "A towering stone stronghold. The seat of power and the realm's last line of defense.",
    url: "/terrain/models/castle.glb",
    footprint: 9,
    credit: "Castle Fortress — Quaternius",
  },
  {
    id: "catapult",
    label: "Catapult",
    kind: "Siege Engine",
    description:
      "Torsion-powered siege weapon. Hurls heavy boulders over enemy walls.",
    url: "/terrain/models/catapult.glb",
    footprint: 4,
    credit: "Catapult — Poly by Google",
  },
  {
    id: "trebuchet",
    label: "Trebuchet",
    kind: "Siege Engine",
    description:
      "A giant siege bow. Looses massive bolts with punishing range and force.",
    url: "/terrain/models/trebuchet.glb",
    footprint: 4.5,
    credit: "Giant Crossbow — Aimé Tribolet",
  },
  {
    id: "barracks",
    label: "Barracks",
    kind: "Military",
    description:
      "A field encampment where troops muster, rest, and ready for battle.",
    url: "/terrain/models/barracks.glb",
    footprint: 4,
    credit: "Tent — Quaternius",
  },
  {
    id: "house",
    label: "House",
    kind: "Civilian",
    description:
      "A humble timber dwelling. Home to the villagers who feed the realm.",
    url: "/terrain/models/house.glb",
    footprint: 4,
    credit: "Fantasy House — Quaternius",
  },
  {
    id: "wall_plain",
    label: "Wall",
    kind: "Fortification",
    description:
      "A solid stone rampart. Chain them to ring your holdings in unbroken stone.",
    url: "/terrain/models/wall_plain.glb",
    footprint: 5,
    credit: "Brick Wall — Quaternius",
  },
  {
    id: "wall",
    label: "Gate Wall",
    kind: "Fortification",
    description:
      "A battlemented wall pierced by a gate. The guarded way in and out.",
    url: "/terrain/models/wall.glb",
    footprint: 5,
    credit: "Castle Wall — Corentin Fatus",
  },
  {
    id: "tower",
    label: "Tower",
    kind: "Fortification",
    description:
      "A tall watchtower. Anchors the wall line and guards against approach.",
    url: "/terrain/models/tower.glb",
    footprint: 3.5,
    credit: "Castle Tower — Corentin Fatus",
  },
  {
    id: "road",
    label: "Road",
    kind: "Infrastructure",
    description:
      "A worn stone path. Links the realm's holdings and speeds the march.",
    url: "/terrain/models/road.glb",
    footprint: 5,
    credit: "Path — Kay Lousberg",
  },
];

export function structureById(id: string): StructureDef {
  const s = STRUCTURES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown structure ${id}`);
  return s;
}
