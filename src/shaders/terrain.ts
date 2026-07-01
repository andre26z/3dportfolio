// Vertex shader: displace a flat plane into rippling waves. Bass raises the
// amplitude and the field scrolls over time for a fly-over feel.
//
// IMPORTANT: the `wave()` function below must stay in sync with `waveHeight()`
// in components/waveField.ts — that CPU mirror is what keeps the marble bouncing
// exactly on the visible surface.
export const terrainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  varying float vHeight;

  float wave(vec2 p) {
    float t = uTime;
    float amp = 0.6 + uBass * 5.0;
    float py = p.y + t * 1.5;
    float h = 0.0;
    h += sin(p.x * 0.6 + t * 0.4) * 0.6;
    h += sin(py * 0.5 - t * 0.3) * 0.6;
    h += sin((p.x + py) * 0.9 + t * 0.6) * 0.35;
    h += sin(length(vec2(p.x, py)) * 1.2 - t) * 0.25;
    h *= amp;
    h += uMid * 1.5 * sin(p.x * 2.0 + t * 2.0);
    return h;
  }

  void main() {
    vec3 pos = position;
    float h = wave(pos.xy);
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
