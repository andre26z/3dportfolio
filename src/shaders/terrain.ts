// Vertex shader: displace a flat plane into rippling terrain. Bass raises the
// amplitude and the whole field scrolls over time for a fly-over feel.
export const terrainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  varying float vHeight;

  // cheap value-noise via stacked sines — no texture needed
  float ridged(vec2 p) {
    float h = 0.0;
    h += sin(p.x * 0.6 + uTime * 0.4) * 0.6;
    h += sin(p.y * 0.5 - uTime * 0.3) * 0.6;
    h += sin((p.x + p.y) * 0.9 + uTime * 0.6) * 0.35;
    h += sin(length(p) * 1.2 - uTime) * 0.25;
    return h;
  }

  void main() {
    vec3 pos = position;
    float amp = 0.6 + uBass * 5.0;
    float h = ridged(pos.xy + vec2(0.0, uTime * 1.5)) * amp;
    h += uMid * 1.5 * sin(pos.x * 2.0 + uTime * 2.0);
    pos.z += h;
    vHeight = h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader: color by height, low->high gradient, glow on peaks.
export const terrainFragment = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform float uBass;
  varying float vHeight;

  void main() {
    float t = clamp(vHeight * 0.15 + 0.5, 0.0, 1.0);
    vec3 col = mix(uLow, uHigh, t);
    col += uHigh * uBass * 0.6 * smoothstep(0.4, 1.0, t);
    gl_FragColor = vec4(col, 1.0);
  }
`;
