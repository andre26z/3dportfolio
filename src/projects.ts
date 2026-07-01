// Central registry of portfolio projects. Add new entries here and the navbar
// + routes pick them up automatically.
export interface ProjectMeta {
  slug: string; // route path segment, '' = home
  title: string;
  nav: string; // navbar label
}

export const projects: ProjectMeta[] = [
  { slug: "", title: "Solar System", nav: "Solar System" },
  { slug: "sound", title: "Soundwave", nav: "Soundwave" },
  // future: { slug: 'shaders', title: 'Shaders', nav: 'Shaders' },
];
