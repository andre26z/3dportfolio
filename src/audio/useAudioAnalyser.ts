import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { splitBands, type Bands } from './bands';

export interface AudioAnalyser {
  /** Live byte-frequency data, updated in place each frame. Read in useFrame. */
  dataRef: React.MutableRefObject<Uint8Array<ArrayBuffer>>;
  /** Live per-band levels, mutated in place (do not rely on identity change). */
  bandsRef: React.MutableRefObject<Bands>;
  play: () => Promise<void>;
  pause: () => void;
  playing: boolean;
  loading: boolean;
  ready: boolean;
  error: string | null;
  setVolume: (v: number) => void;
}

/**
 * Owns the whole Web Audio graph:
 *   <audio> -> MediaElementSource -> AnalyserNode -> destination
 *
 * The <audio> element streams `src` (a same-origin proxy path so the analyser
 * is not tainted). `refresh()` pulls the latest frequency frame into dataRef;
 * call it once per render frame from the R3F loop.
 */
export function useAudioAnalyser(src: string): AudioAnalyser & {
  refresh: () => void;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const dataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(1024));
  const bandsRef = useRef<Bands>({ bass: 0, mid: 0, treble: 0 });

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the graph lazily on first play (AudioContext must start after a
  // user gesture, else browsers keep it suspended).
  const ensureGraph = useCallback(() => {
    if (ctxRef.current) return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = src;
    audio.preload = 'none';
    audio.addEventListener('error', () => {
      setError('Stream failed to load (check proxy / stream URL).');
      setLoading(false);
    });
    // fires once audio actually starts producing sound -> stop the spinner
    audio.addEventListener('playing', () => {
      setLoading(false);
      setPlaying(true);
    });
    audioRef.current = audio;

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const sourceNode = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;

    sourceNode.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    gainRef.current = gain;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    setReady(true);
  }, [src]);

  const play = useCallback(async () => {
    try {
      setError(null);
      setLoading(true); // spinner until the 'playing' event fires
      ensureGraph();
      await ctxRef.current?.resume();
      await audioRef.current?.play();
      // note: keep loading true here; the 'playing' listener clears it once
      // the stream actually starts producing sound.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback failed.');
      setLoading(false);
    }
  }, [ensureGraph]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setLoading(false);
  }, []);

  const setVolume = useCallback((v: number) => {
    if (gainRef.current) gainRef.current.gain.value = v;
  }, []);

  const refresh = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    analyser.getByteFrequencyData(dataRef.current);
    const b = splitBands(dataRef.current);
    bandsRef.current.bass = b.bass;
    bandsRef.current.mid = b.mid;
    bandsRef.current.treble = b.treble;
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      ctxRef.current?.close();
    };
  }, []);

  return useMemo(
    () => ({
      dataRef,
      bandsRef,
      play,
      pause,
      playing,
      loading,
      ready,
      error,
      setVolume,
      refresh,
    }),
    [play, pause, playing, loading, ready, error, setVolume, refresh],
  );
}
