import { useCallback, useEffect, useRef, useState } from 'react';
import type { FrameReading, PartAssessment, StableReading } from '@/features/detection/types';
import { severityOf } from '@/features/detection/services/combineResults';
import { stability } from '@/config/modelConfig';
import type { PartKey } from '@/shared/constants';

export interface StabilityProgress {
  /** Condition currently being accumulated (null before any agreeing frame). */
  condition: string | null;
  /** Consecutive agreeing frames so far. */
  count: number;
  /** Frames required to lock. */
  needed: number;
  ready: boolean;
}

export interface UseStableReadingOptions {
  part: PartKey;
  /** Feed readings only while enabled (e.g. while the wizard is scanning). */
  enabled: boolean;
  /** Fixed when the tracker is created; configure via `modelConfig.ts`. */
  minConfidence?: number;
  consecutiveFrames?: number;
  /** Called once with the winning reading when the gate is met. */
  onLocked?: (reading: FrameReading, progress: StabilityProgress) => void;
}

export interface StabilityTracker {
  progress: StabilityProgress;
  /** True once N agreeing, confident frames have arrived. */
  locked: boolean;
  emit: (reading: FrameReading) => void;
  reset: () => void;
}

/**
 * Pure, replayable debounce: N consistent, confident frames -> locked.
 * Exported for unit tests; the hook is a thin wrapper over it.
 */
export function createStabilityTracker(
  part: PartKey,
  opts: {
    minConfidence?: number;
    consecutiveFrames?: number;
    onLocked?: (reading: FrameReading, progress: StabilityProgress) => void;
  } = {},
): StabilityTracker {
  const minConfidence = opts.minConfidence ?? stability.minConfidence;
  const needed = opts.consecutiveFrames ?? stability.consecutiveFrames;

  const tracker: StabilityTracker = {
    progress: { condition: null, count: 0, needed, ready: false },
    locked: false,
    emit: (reading: FrameReading) => {
      if (reading.part !== part || tracker.locked) return;

      const candidate = reading.confidence >= minConfidence ? reading.condition : null;

      if (candidate && candidate === tracker.progress.condition) {
        const count = tracker.progress.count + 1;
        tracker.progress = { condition: candidate, count, needed, ready: count >= needed };
        if (tracker.progress.ready) {
          tracker.locked = true;
          opts.onLocked?.(reading, tracker.progress);
        }
      } else {
        tracker.progress = {
          condition: candidate,
          count: candidate ? 1 : 0,
          needed,
          ready: false,
        };
      }
    },
    reset: () => {
      tracker.locked = false;
      tracker.progress = { condition: null, count: 0, needed, ready: false };
    },
  };

  return tracker;
}

/** Turn the winning per-frame reading into a persistable assessment. */
export function toStableReading(reading: FrameReading, count: number): StableReading {
  const assessment: PartAssessment = {
    part: reading.part,
    condition: reading.condition as PartAssessment['condition'],
    confidence: reading.confidence,
    severity: severityOf(reading.part, reading.condition),
    box: reading.box ?? null,
    durationMs: reading.latencyMs,
    backend: reading.backend,
  };
  return { assessment, stableSamples: count, lockedAt: new Date().toISOString() };
}

/** Hook wrapper that mirrors a {@link StabilityTracker} into React state. */
export function useStableReading(opts: UseStableReadingOptions): StabilityTracker {
  const { part, enabled, minConfidence, consecutiveFrames, onLocked } = opts;

  // Part is fixed for the lifetime of a mounted scan screen (eye vs skin are
  // separate screens), so a single context-stable tracker built in state is safe.
  const [tracker] = useState(() =>
    createStabilityTracker(part, { minConfidence, consecutiveFrames }),
  );

  // Latest-callback ref, updated during an effect (never during render).
  const onLockedRef = useRef(onLocked);
  useEffect(() => {
    onLockedRef.current = onLocked;
  }, [onLocked]);

  const [, setTick] = useState(0);
  const invalidate = useCallback(() => setTick((t) => t + 1), []);

  const emit = useCallback(
    (reading: FrameReading) => {
      if (!enabled) return;
      if (tracker.locked) return;
      tracker.emit(reading);
      onLockedRef.current?.(reading, tracker.progress);
      invalidate();
    },
    [enabled, tracker, invalidate],
  );

  const reset = useCallback(() => {
    tracker.reset();
    invalidate();
  }, [tracker, invalidate]);

  return { progress: tracker.progress, locked: tracker.locked, emit, reset };
}