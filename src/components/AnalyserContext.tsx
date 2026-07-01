import { createContext, useContext } from 'react';
import type { useAudioAnalyser } from '../audio/useAudioAnalyser';

type Analyser = ReturnType<typeof useAudioAnalyser>;

export const AnalyserContext = createContext<Analyser | null>(null);

export function useAnalyser(): Analyser {
  const ctx = useContext(AnalyserContext);
  if (!ctx) throw new Error('useAnalyser must be used within AnalyserContext');
  return ctx;
}
