/**
 * Model configuration — the single source of truth for how the on-device
 * model is loaded, how frames are preprocessed, and how the two-part verdict
 * is computed.
 *
 * The hosted backend polls a gateway for gate results and grades one
 * high-resolution frame.
 */

export type ModelBackend = 'tflite' | 'roboflow';

export type EyeCondition = 'clear' | 'cloudy' | 'sunken';
export type SkinCondition = 'firm_shiny' | 'slimy' | 'discolored';

const readEnum = <T extends string>(key: string, fallback: T, allowed: readonly T[]): T => {
  // Keys are compile-time literals passed at each call site below.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const raw = process.env[key];
  if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
  return fallback;
};

export const model = {
  /** Name of the `.tflite` asset in `assets/models/`. */
  fileName: 'fish_freshness_yolov8n.tflite',
  /** `tflite` (legacy on-device) or `roboflow` (hosted gateway). */
  backend: readEnum<ModelBackend>('EXPO_PUBLIC_MODEL_BACKEND', 'roboflow', ['tflite', 'roboflow']),

  /** Square input size the model was exported with. */
  inputSize: 640,
  /** Channels of the model input tensor. */
  inputChannels: 3,
  /** Pixel normalization applied before inference (YOLO convention: 0..1). */
  normalize: (v: number) => v / 255,

  /**
   * Output tensor layout. Confirm with Netron after exporting the model:
   *   classifierScoresIndex — tensor holding per-condition class scores.
   *   boxesIndex           — tensor holding raw bounding boxes (−1 when the
   *                          model does not localize parts).
   */
  output: {
    classifierScoresIndex: 0,
    boxesIndex: -1,
    classScoreLength: 3,
  },
} as const;

/**
 * Live-frame tuning (Section 7 of the plan: *don't* run inference on every
 * frame, downscale before inferring, keep the UI thread responsive).
 */
export const live = {
  /** Camera frame output target resolution — modest, not full 4K. */
  frameTarget: { width: 1280, height: 720 },
  /** Process 1 of every N frames (throttle). Tune on the 4GB-RAM device. */
  throttleEvery: 3,
  /** Frame output pixel format; `rgb` gives a CPU-accessible pixel buffer. */
  pixelFormat: 'rgb' as 'rgb' | 'yuv' | 'native',
} as const;

/** QR-style auto-lock: require the label to stay consistent for N frames. */
export const stability = {
  /** Minimum per-frame confidence required to count toward a lock. */
  minConfidence: 0.7,
  /** Consecutive agreeing frames required before locking. */
  consecutiveFrames: 10,
} as const;

/** Label maps — one condition per class, in the order the model was trained. */
export const partLabels: Record<'eye' | 'skin', readonly string[]> = {
  eye: ['clear', 'cloudy', 'sunken'],
  skin: ['firm_shiny', 'slimy', 'discolored'],
};

/**
 * Rule that turns the two per-part assessments into a single overall verdict,
 * which is always one of two labels: `fresh` or `not_fresh`.
 * - `severe-wins`: the *worst* of the two conditions dominates (clear eye +
 *   slimy skin -> Not Fresh overall). Default per the plan §5.
 * - `weighted`: weighted average of each part's severity using `weights`.
 *
 * This is the single place to change if the Chapter-3 rubric changes.
 */
export const combine = {
  strategy: readEnum<'severe-wins' | 'weighted'>(
    'EXPO_PUBLIC_COMBINE_STRATEGY',
    'severe-wins',
    ['severe-wins', 'weighted'],
  ),
  /** Severity of each condition, from 0 (best) to 2 (worst). */
  severity: {
    eye: { clear: 0, cloudy: 1, sunken: 2 },
    skin: { firm_shiny: 0, slimy: 1, discolored: 2 },
  },
  /** Relative importance of each part when `strategy` is `weighted`. */
  weights: { eye: 0.6, skin: 0.4 },
  /** Severity-score cut-offs for the weighted strategy. */
  thresholds: { moderatelyFresh: 0.6, notFresh: 1.2 },
} as const;