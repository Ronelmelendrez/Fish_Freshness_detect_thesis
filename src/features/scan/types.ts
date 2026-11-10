import type { PartKey } from '@/shared/constants';

/** The two parts of the fish scanned in sequence. */
export type ScanPart = PartKey;

/**
 * Wizard state machine (`useScanFlow` / appStore):
 * `idle → eyeScanning → eyeLocked → skinScanning → skinLocked → assessing → done`
 */
export type ScanFlowState =
  | 'idle'
  | 'eyeScanning'
  | 'eyeLocked'
  | 'skinScanning'
  | 'skinLocked'
  | 'assessing'
  | 'done';

export const SCAN_STEPS: readonly ScanPart[] = ['eye', 'skin'] as const;

export const scanStepIndex = (step: ScanFlowState): number => {
  if (step === 'eyeScanning') return 1;
  if (step === 'eyeLocked') return 2;
  if (step === 'skinScanning') return 3;
  if (step === 'skinLocked') return 4;
  if (step === 'assessing') return 5;
  if (step === 'done') return 6;
  return 0;
};