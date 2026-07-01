import { useState } from 'react';
import { useAnalyser } from './AnalyserContext';

const wrap: React.CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  padding: '12px 20px',
  borderRadius: 999,
  background: 'rgba(10,12,30,0.55)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e9eaff',
  fontSize: 14,
  zIndex: 10,
};

const btn: React.CSSProperties = {
  cursor: 'pointer',
  border: 'none',
  borderRadius: 999,
  padding: '8px 18px',
  fontWeight: 600,
  background: 'linear-gradient(90deg,#ff2e88,#ff8a3d)',
  color: '#0a0a12',
};

export function Controls() {
  const { play, pause, playing, error, setVolume } = useAnalyser();
  const [vol, setVol] = useState(0.9);

  return (
    <div style={wrap}>
      <button
        style={btn}
        onClick={() => (playing ? pause() : play())}
      >
        {playing ? '❚❚ Pause' : '▶ Play'}
      </button>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        Vol
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={vol}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVol(v);
            setVolume(v);
          }}
        />
      </label>
      <span style={{ opacity: 0.7 }}>Ibiza Chillout Lounge</span>
      {error && (
        <span style={{ color: '#ff6b6b', maxWidth: 260 }}>{error}</span>
      )}
    </div>
  );
}
