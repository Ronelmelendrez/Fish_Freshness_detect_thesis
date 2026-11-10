/**
 * The real-time classification worklet.
 *
 * Runs on the VisionCamera frame-processing runtime (a SWM worklet thread).
 * It is intentionally self-contained: everything it calls is either a pure,
 * `'worklet'`-marked helper (see `preprocess`/`postprocess`) or a Nitro
 * HybridObject method, so the whole pipeline executes without crossing to the
 * JS thread until the final `runOnJS(onReading)`.
 *
 * @note Bounding-box note: the frame output is configured with
 * `pixelFormat: 'rgb'`, which the Camera pipeline delivers as interleaved
 * BGRA (`rgb-bgra-8-bit`). `prepareFrameTensor` therefore treats the buffer
 * as 4 bytes/pixel BGRA and converts to RGB before resizing to the model's
 * 640x640 input.
 */

import { runOnJS } from 'react-native-worklets';
import type { Frame } from 'react-native-vision-camera';
import { model } from '@/config/modelConfig';
import type { FrameReading, TfliteModelLike } from '@/features/detection/types';
import type { PartKey } from '@/shared/constants';
import { prepareFrameTensor } from './preprocess';
import { classifyCondition } from './postprocess';

export interface FrameProcessorOptions {
  part: PartKey;
  model: TfliteModelLike;
  backend: 'tflite';
  onReading: (reading: FrameReading) => void;
  onError: (message: string) => void;
}

export interface FrameProcessor {
  (frame: Frame): void;
}

/**
 * Create the `onFrame` worklet for `useFrameOutput`. Called once on the JS
 * thread; the returned worklet is what runs for every camera frame.
 */
export function createFrameProcessor(options: FrameProcessorOptions): FrameProcessor {
  const { part, model: tfliteModel, backend, onReading, onError } = options;
  const notifyReading = runOnJS(onReading);
  const notifyError = runOnJS(onError);
  const throttleEvery = 3;

  let skipped = 0;

  return function handleFrame(frame: Frame) {
    'worklet';

    if (!frame.isValid) {
      frame.dispose();
      return;
    }

    // Don't run inference on every frame — drop `throttleEvery - 1` of them.
    skipped++;
    if (skipped % throttleEvery !== 0) {
      frame.dispose();
      return;
    }

    const started = Date.now();
    try {
      const pixelBuffer = frame.getPixelBuffer();
      const tensor = prepareFrameTensor(pixelBuffer, frame.width, frame.height, frame.bytesPerRow);

      const outputs = tfliteModel.runSync([tensor.buffer as ArrayBuffer]);
      const scores = new Float32Array(outputs[model.output.classifierScoresIndex]);

      const { condition, confidence } = classifyCondition(part, scores, backend);
      const latencyMs = Date.now() - started;

      notifyReading({
        part,
        condition,
        confidence,
        box: null,
        latencyMs,
        backend,
        timestamp: Date.now(),
      });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : String(err));
    } finally {
      frame.dispose();
    }
  };
}