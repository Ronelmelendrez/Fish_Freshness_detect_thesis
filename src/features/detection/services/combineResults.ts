/**
 * Turns the two per-part assessments into a single overall verdict.
 * Pure and side-effect free — used by the store when the scan completes and
 * unit-tested directly.
 */

import { combine } from '@/config/modelConfig';
import type { FreshnessLevel, PartKey } from '@/shared/constants';
import type { CombinedFreshnessResult, PartAssessment } from '../types';

const { severity, weights, thresholds, strategy } = combine;

/** Map PartAssessment condition -> severity (0 freshest … 2 most spoiled). */
export function severityOf(part: PartKey, condition: string): number {
  const map = severity[part] as Record<string, number>;
  return map[condition] ?? 1;
}

const severityToLevel: Record<number, Exclude<FreshnessLevel, 'fresh'>> = {
  1: 'not_fresh',
  2: 'not_fresh',
};

export function combineResults(
  eye: PartAssessment,
  skin: PartAssessment,
): CombinedFreshnessResult {
  let level: FreshnessLevel;
  let confidence: number;

  if (strategy === 'severe-wins') {
    const worst = severityOf('eye', eye.condition) >= severityOf('skin', skin.condition) ? eye : skin;
    const s = severityOf(worst.part, worst.condition);
    level = s === 0 ? 'fresh' : severityToLevel[s];
    confidence = worst.confidence;
  } else {
    const score =
      severityOf('eye', eye.condition) * weights.eye +
      severityOf('skin', skin.condition) * weights.skin;
    level = score < thresholds.moderatelyFresh ? 'fresh' : 'not_fresh';
    confidence = eye.confidence * weights.eye + skin.confidence * weights.skin;
  }

  return { level, confidence, eye, skin, strategy };
}