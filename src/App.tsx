import { Canvas } from '@react-three/fiber';
import { useAudioAnalyser } from './audio/useAudioAnalyser';
import { AnalyserContext } from './components/AnalyserContext';
import { Scene } from './components/Scene';
import { Controls } from './components/Controls';

// Same-origin proxy path (see vite.config.ts) so the AnalyserNode gets real,
// non-tainted frequency data from the radio stream.
const STREAM_URL = '/stream';

export default function App() {
  const analyser = useAudioAnalyser(STREAM_URL);

  return (
    <AnalyserContext.Provider value={analyser}>
      <Canvas
        camera={{ position: [0, 14, 34], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      <Controls />
    </AnalyserContext.Provider>
  );
}
