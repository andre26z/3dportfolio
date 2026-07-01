// Planet definitions for the solar-system scene. Distances/sizes are stylized,
// not to scale — tuned to look good and stay clickable.
export type PlanetKind = 'rocky' | 'gas';

export interface PlanetDef {
  id: string;
  name: string;
  radius: number; // sphere size
  orbit: number; // orbit distance from sun
  speed: number; // angular speed (rad/s)
  color: string;
  accent: string; // secondary color for texture bands/blotches
  kind: PlanetKind; // drives texture style
  spin: number; // self-rotation speed
  ring?: boolean; // draw a planet ring (Saturn)
}

export const PLANETS: PlanetDef[] = [
  { id: 'mercury', name: 'Mercury', radius: 0.5, orbit: 6, speed: 0.62, color: '#a9a29b', accent: '#6f6a63', kind: 'rocky', spin: 0.6 },
  { id: 'venus', name: 'Venus', radius: 0.9, orbit: 9, speed: 0.45, color: '#e6b873', accent: '#b07f3c', kind: 'rocky', spin: 0.4 },
  { id: 'earth', name: 'Earth', radius: 1.0, orbit: 12.5, speed: 0.36, color: '#3a7bd5', accent: '#3fae5a', kind: 'rocky', spin: 0.8 },
  { id: 'mars', name: 'Mars', radius: 0.75, orbit: 16, speed: 0.29, color: '#c1440e', accent: '#7a2c0a', kind: 'rocky', spin: 0.7 },
  { id: 'jupiter', name: 'Jupiter', radius: 2.4, orbit: 22, speed: 0.16, color: '#d8a06a', accent: '#9c6b3f', kind: 'gas', spin: 1.2 },
  { id: 'saturn', name: 'Saturn', radius: 2.0, orbit: 29, speed: 0.12, color: '#e3cfa0', accent: '#b39866', kind: 'gas', spin: 1.1, ring: true },
  { id: 'uranus', name: 'Uranus', radius: 1.5, orbit: 35, speed: 0.09, color: '#8fe3e0', accent: '#5fb8b4', kind: 'gas', spin: 0.9 },
  { id: 'neptune', name: 'Neptune', radius: 1.45, orbit: 40, speed: 0.07, color: '#3f66d6', accent: '#28408f', kind: 'gas', spin: 0.9 },
];
