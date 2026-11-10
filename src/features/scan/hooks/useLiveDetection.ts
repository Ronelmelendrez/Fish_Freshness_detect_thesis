import { useCallback, useRef, useState } from 'react';
import type { FrameReading } from '@/features/detection/types';
import type { PartKey } from '@/shared/constants';

export interface LiveDetectionState {
  /** Most recent accepted reading (used to drive the overlay UI). */
  latest: FrameReading | null;
  /** Smoothed processing rate (frames/s) based on reading arrival gaps. */
  fps: number;
  /** Exponential moving average of per-frame inference time (ms). */
  avgLatencyMs: number;
  /** Total readings accepted so far. */
  count: number;
  pushReading: (reading: FrameReading) => void;
}

/**
 * Owns the rolling "live feed" bookkeeping. The upstream source (camera
 * worklet or remote scanner hands every reading to
 * `pushReading`; this hook turns the stream into throttled UI state.
 */
export function useLiveDetection(part: PartKey): LiveDetectionState {
  const [latest, setLatest] = useState<FrameReading | null>(null);
  const [fps, setFps] = useState(0);
  const [avgLatencyMs, setAvgLatencyMs] = useState(0);
  const [count, setCount] = useState(0);
  const lastAtRef = useRef(0);
  const latencyEmaRef = useRef(0);

  const pushReading = useCallback(
    (reading: FrameReading) => {
      if (reading.part !== part) return;
      const now = reading.timestamp || Date.now();
      if (lastAtRef.current > 0) {
        const dt = now - lastAtRef.current;
        if (dt > 0) setFps(Math.round((1000 / dt) * 10) / 10);
      }
      lastAtRef.current = now;

      latencyEmaRef.current = latencyEmaRef.current
        ? latencyEmaRef.current * 0.8 + reading.latencyMs * 0.2
        : reading.latencyMs;
      setAvgLatencyMs(Math.round(latencyEmaRef.current));

      setCount((c) => c + 1);
      setLatest(reading);
    },
    [part],
  );

  return { latest, fps, avgLatencyMs, count, pushReading };
}