export interface Bands {
  bass: number; // 0..1
  mid: number; // 0..1
  treble: number; // 0..1
}

// Split a raw byte-frequency array (0..255 per bin) into three averaged,
// normalized bands. Pure function — trivially unit-testable.
//
// Bins are linear in frequency. With a 44.1kHz context and fftSize 2048,
// each bin ~= 21.5 Hz. We carve rough ranges:
//   bass   : bins  1..8    (~20-180 Hz)
//   mid    : bins  9..64   (~200-1400 Hz)
//   treble : bins 65..220  (~1.4k-4.7k Hz)
export function splitBands(freq: Uint8Array<ArrayBuffer>): Bands {
  const avg = (start: number, end: number): number => {
    const lo = Math.max(0, start);
    const hi = Math.min(freq.length - 1, end);
    if (hi < lo) return 0;
    let sum = 0;
    for (let i = lo; i <= hi; i++) sum += freq[i];
    return sum / (hi - lo + 1) / 255;
  };

  return {
    bass: avg(1, 8),
    mid: avg(9, 64),
    treble: avg(65, 220),
  };
}
