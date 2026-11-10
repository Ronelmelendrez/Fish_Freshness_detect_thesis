/**
 * Loads the detection model once (module-level cache) and exposes lifecycle
 * state. Used by LiveCameraView (real inference) and scan screens (to gate
 * the flow on readiness).
 */

import { useCallback, useEffect, useState } from 'react';
import { model as modelConfig } from '@/config/modelConfig';
import type { LoadedModel } from '../types';
import { loadModel } from '../services/modelLoader';

let cachedPromise: Promise<LoadedModel> | null = null;

export function ensureModel(): Promise<LoadedModel> {
  if (!cachedPromise) cachedPromise = loadModel(modelConfig.backend);
  return cachedPromise;
}

export interface FreshnessDetectionState {
  backend: 'tflite' | 'roboflow';
  model: LoadedModel | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFreshnessDetection(): FreshnessDetectionState {
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    ensureModel()
      .then((loaded) => {
        setModel(loaded);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
        // A failed load stays cached; clear it so `reload` can truly retry.
        cachedPromise = null;
      });
  }, []);

  const reload = useCallback(() => {
    setError(null);
    setIsLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    backend: model?.backend ?? modelConfigBackend(),
    model,
    isLoading,
    error,
    reload,
  };
}

function modelConfigBackend(): 'tflite' | 'roboflow' {
  return modelConfig.backend;
}