import type { ModelBackend, EyeCondition, SkinCondition } from '@/config/modelConfig';
import type { FreshnessLevel, PartKey } from '@/shared/constants';

/** Bounding box in relative image coordinates (0..1), produced when the model localizes a part. */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

/** Result of classifying a *single frame* on the live feed (raw per-frame reading). */
export interface FrameReading {
  part: PartKey;
  /** One of the part's condition labels (see `modelConfig.partLabels`). */
  condition: string;
  /** Confidence in `[0, 1]`. */
  confidence: number;
  box?: BoundingBox | null;
  /** Inference wall-time for this frame (ms) — used for FPS/latency measurement. */
  latencyMs: number;
  backend: ModelBackend;
  /** Arrival timestamp (epoch ms) of this frame. */
  timestamp: number;
}

/** The outcome of running inference on a *single* part — the locked reading used downstream. */
export interface PartAssessment {
  part: PartKey;
  condition: EyeCondition | SkinCondition;
  confidence: number;
  /** Severity 0 (freshest) to 2 (most spoiled); denormalized from `modelConfig.combine.severity`. */
  severity: number;
  box?: BoundingBox | null;
  durationMs: number;
  backend: ModelBackend;
}

/** A `PartAssessment` that passed the stability/auto-lock gate. */
export interface StableReading {
  assessment: PartAssessment;
  /** Consecutive agreeing frames that produced the lock. */
  stableSamples: number;
  /** ISO timestamp when the reading was locked. */
  lockedAt: string;
}

/** The result of combining the eye + skin assessments into a single verdict. */
export interface CombinedFreshnessResult {
  level: FreshnessLevel;
  confidence: number;
  eye: PartAssessment;
  skin: PartAssessment;
  strategy: 'severe-wins' | 'weighted';
}

/** Minimal structural type for a react-native-fast-tflite model (keeps the worklet decoupled). */
export interface TfliteTensorInfo {
  name: string;
  shape: number[];
}

export interface TfliteModelLike {
  readonly inputs: TfliteTensorInfo[];
  readonly outputs: TfliteTensorInfo[];
  runSync(inputs: ArrayBuffer[]): ArrayBuffer[];
  dispose(): void;
}

/** Common type for a loaded model, independent of backend. */
export type LoadedModel =
  | { kind: 'tflite'; backend: 'tflite'; model: TfliteModelLike }
  | { kind: 'roboflow'; backend: 'roboflow' };