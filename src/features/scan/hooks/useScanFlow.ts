import { useAppStore } from '@/store/appStore';

/**
 * Thin adapter over the scan slice of the app store. Screens talk to the
 * store exclusively through this hook (no cross-feature imports elsewhere).
 */
export function useScanFlow() {
  const scan = useAppStore((s) => s.scan);
  const startScan = useAppStore((s) => s.startScan);
  const lockPart = useAppStore((s) => s.lockPart);
  const nextPart = useAppStore((s) => s.nextPart);
  const completeScan = useAppStore((s) => s.completeScan);
  const resetScan = useAppStore((s) => s.resetScan);
  const setScanError = useAppStore((s) => s.setScanError);

  return { ...scan, startScan, lockPart, nextPart, completeScan, resetScan, setScanError };
}