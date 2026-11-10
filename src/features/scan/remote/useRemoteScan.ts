import { useCallback, useEffect, useRef, useState } from 'react';
import type { PartKey } from '@/shared/constants';
import type { FrameReading } from '@/features/detection/types';
import { gate, grade, type GradeResponse } from './api';
import { createRemoteStability } from './stability';

export type RemoteScanState = 'searching' | 'hint' | 'detected' | 'grading' | 'result' | 'rescan' | 'offline';

interface UseRemoteScanOptions {
  part: PartKey;
  enabled: boolean;
  capture: () => Promise<Blob>;
  onReading: (reading: FrameReading) => void;
  onError: (message: string) => void;
  onResult?: (result: GradeResponse) => void;
}

export function useRemoteScan({ part, enabled, capture, onReading, onError, onResult }: UseRemoteScanOptions) {
  const [state, setState] = useState<RemoteScanState>('searching');
  const [hint, setHint] = useState<string>('Point at the fish');
  const [progress, setProgress] = useState({ count: 0, needed: 3, ready: false });
  const inFlight = useRef(false);
  const stability = useRef(createRemoteStability(3));
  const stopped = useRef(false);

  const poll = useCallback(async () => {
    if (!enabled || inFlight.current || stopped.current) return;
    inFlight.current = true;
    try {
      const uri = await capture();
      const response = await gate(uri, part);
      const ok = response.status === 'ok';
      const next = stability.current.accept(ok);
      setProgress(next);
      setHint(response.message);
      setState(ok ? (next.ready ? 'grading' : 'detected') : response.status === 'searching' ? 'searching' : 'hint');

      if (next.ready) {
        const finalUri = await capture();
        const result = await grade(finalUri, part);
        onResult?.(result);
        setState(result.status === 'result' ? 'result' : result.status === 'offline' ? 'offline' : 'rescan');
        stability.current.reset();
        setProgress(stability.current.progress);
      }
    } catch (error) {
      stability.current.reset();
      setProgress(stability.current.progress);
      setState('offline');
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      inFlight.current = false;
    }
  }, [capture, enabled, onError, onResult, part]);

  useEffect(() => {
    stopped.current = false;
    if (!enabled) return;
    const id = setInterval(() => void poll(), 700);
    return () => {
      stopped.current = true;
      clearInterval(id);
    };
  }, [enabled, poll]);

  return { state, hint, progress, poll };
}
