// Procedural explosion sound — no audio asset needed. A burst of filtered
// white noise with a fast attack and exponential decay, plus a low "boom"
// sine that drops in pitch. One shared AudioContext, created lazily on first
// use (after a user gesture, so browsers allow it).
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctx();
  }
  return ctx;
}

export function playExplosion(intensity = 1): void {
  const ac = getCtx();
  if (ac.state === 'suspended') void ac.resume();
  const now = ac.currentTime;
  const dur = 0.6 + intensity * 0.3;

  // --- noise burst ---
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = buffer;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1800, now);
  lp.frequency.exponentialRampToValueAtTime(120, now + dur);

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.9 * intensity, now + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  noise.connect(lp).connect(noiseGain).connect(ac.destination);

  // --- low boom ---
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + dur * 0.8);

  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.6 * intensity, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.9);

  osc.connect(oscGain).connect(ac.destination);

  noise.start(now);
  noise.stop(now + dur);
  osc.start(now);
  osc.stop(now + dur);
}
