/**
 * Pure, worklet-safe helpers that turn raw model logits/scores into readable
 * condition labels and confidence values. No native calls — callable both on
 * the JS thread and inside a frame processor worklet.
 */

import { partLabels, type ModelBackend, type EyeCondition, type SkinCondition } from '@/config/modelConfig';
import type { PartKey } from '@/shared/constants';

/** Softmax over an array of logits -> probabilities summing to ~1. */
export function softmax(logits: Float32Array | number[]): Float32Array {
  const values = Array.from(logits);
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return new Float32Array(exps.map((v) => v / sum));
}

/** Index of the highest-probability class. */
export function argmax(probs: Float32Array | number[]): number {
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
  return best;
}

export interface ClassificationResult {
  condition: EyeCondition | SkinCondition;
  confidence: number;
}

export function classifyCondition(
  part: PartKey,
  scores: Float32Array | number[],
  backend: ModelBackend,
): ClassificationResult {
  const probs = softmax(scores);
  const idx = argmax(probs);
  return {
    condition: partLabels[part][idx] as EyeCondition | SkinCondition,
    confidence: probs[idx],
  };
}