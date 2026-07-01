import { Canvas } from '@react-three/fiber';
import { useAudioAnalyser } from '../audio/useAudioAnalyser';
import { AnalyserContext } from '../components/AnalyserContext';
import { Scene } from '../components/Scene';
import { Controls } from '../components/Controls';

// The radio stream now sends CORS headers (Access-Control-Allow-Origin), so we
// can hit it directly with crossOrigin="anonymous" and the AnalyserNode still
// gets real, non-tainted data — no same-origin proxy required. Works in both
// dev and production (the dev /stream proxy in vite.config.ts is a fallback).
const STREAM_URL =
  'https://0nlineradio.radioho.st/lounge-ibiza-chillout-lounge?ref=rb26';

// The Sound project: the audio-reactive terrain + architecture visualizer.
export function SoundProject() {
  const analyser = useAudioAnalyser(STREAM_URL);

  return (
    <AnalyserContext.Provider value={analyser}>
      <Canvas
        camera={{ position: [0, 14, 34], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>
      <Controls />
    </AnalyserContext.Provider>
  );
}
