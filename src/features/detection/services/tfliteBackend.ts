/**
 * Real on-device inference via react-native-fast-tflite (Nitro).
 *
 * ⚠️ This module must ONLY be loaded lazily (dynamic `import()` guarded by
 * the `tflite` backend selection in `modelLoader.ts`): merely importing
 * `react-native-fast-tflite` creates a Nitro HybridObject, which throws in
 * environments without native code (Expo Go). Metro will still bundle this
 * file — that is fine — but it must never be *executed* unless running on a
 * dev client with the Phase-5 model exported.
 */

import { loadTensorflowModel } from 'react-native-fast-tflite';
import type { LoadedModel, TfliteModelLike } from '../types';

// Metro asset id. Static require keeps the model in the JS bundle; loading the
// actual bytes happens via `loadTensorflowModel`.
import modelAsset from '../../../../assets/models/fish_freshness_yolov8n.tflite';

export async function loadTfliteBackend(): Promise<Extract<LoadedModel, { kind: 'tflite' }>> {
  let tflite: TfliteModelLike;
  try {
    const native = await loadTensorflowModel(modelAsset, []);
    tflite = {
      get inputs() {
        return native.inputs;
      },
      get outputs() {
        return native.outputs;
      },
      runSync: (inputs: ArrayBuffer[]) => native.runSync(inputs),
      dispose: () => native.dispose(),
    };
  } catch (err) {
    throw new Error(
      'Could not load the TFLite model. Is fish_freshness_yolov8n.tflite a real model? ' +
        (err instanceof Error ? err.message : String(err)),
    );
  }

  return { kind: 'tflite', backend: 'tflite', model: tflite };
}