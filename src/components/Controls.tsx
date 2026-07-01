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

const spinner: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  border: '2px solid rgba(10,10,18,0.35)',
  borderTopColor: '#0a0a12',
  animation: 'marble-spin 0.7s linear infinite',
  display: 'inline-block',
};

// inject the keyframes once
if (typeof document !== 'undefined' && !document.getElementById('spin-kf')) {
  const style = document.createElement('style');
  style.id = 'spin-kf';
  style.textContent =
    '@keyframes marble-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}

export function Controls() {
  const { play, pause, playing, loading, error, setVolume } = useAnalyser();
  const [vol, setVol] = useState(0.9);

  return (
    <div style={wrap}>
      <button
        style={{ ...btn, opacity: loading ? 0.8 : 1 }}
        onClick={() => (playing ? pause() : play())}
        disabled={loading}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={spinner} />
            Loading
          </span>
        ) : playing ? (
          '❚❚ Pause'
        ) : (
          '▶ Play'
        )}
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
