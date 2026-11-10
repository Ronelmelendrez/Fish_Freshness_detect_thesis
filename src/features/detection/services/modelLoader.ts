/**
 * Unifies model loading across backends.
 *
 * - `tflite` — legacy real inference. The module is dynamically imported so that
 *   environments without Nitro native code (Expo Go) are never affected.
 */

import { model, type ModelBackend } from '@/config/modelConfig';
import type { LoadedModel } from '../types';

export async function loadModel(
  backend: ModelBackend = model.backend,
): Promise<LoadedModel> {
  if (backend === 'roboflow') return { kind: 'roboflow', backend: 'roboflow' };

  try {
    const { loadTfliteBackend } = await import('./tfliteBackend');
    return await loadTfliteBackend();
  } catch (err) {
    throw new Error(
      `TFLite backend failed to initialize (${err instanceof Error ? err.message : String(err)}). ` +
        'Ensure the real model is in assets/models and you are running a development client.',
    );
  }
}