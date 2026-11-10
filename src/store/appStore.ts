/**
 * App store (zustand + persist).
 *
 * Holds the live-scan wizard state machine, settings, and local history.
 * Cross-feature communication goes through here; no feature ever imports
 * another feature's module directly.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombinedFreshnessResult, StableReading } from '@/features/detection';
import { combineResults } from '@/features/detection';
import type { ScanFlowState } from '@/features/scan/types';
import type { PartKey } from '@/shared/constants';

export interface HistoryEntry {
  id: string;
  createdAt: string;
  result: CombinedFreshnessResult;
}

export interface ScanSlice {
  step: ScanFlowState;
  eye: StableReading | null;
  skin: StableReading | null;
  result: CombinedFreshnessResult | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

interface AppStore {
  onboarded: boolean;
  historyEnabled: boolean;
  history: HistoryEntry[];

  scan: ScanSlice;

  markOnboarded: () => void;
  setHistoryEnabled: (enabled: boolean) => void;
  clearHistory: () => void;

  startScan: () => void;
  lockPart: (part: PartKey, reading: StableReading) => void;
  nextPart: () => void;
  completeScan: () => void;
  resetScan: () => void;
  setScanError: (message: string | null) => void;
}

const initialScan: ScanSlice = {
  step: 'idle',
  eye: null,
  skin: null,
  result: null,
  startedAt: null,
  completedAt: null,
  error: null,
};

let historySequence = 0;

export const useAppStore = create<AppStore>()(
  persist<AppStore, [], [], Pick<AppStore, 'onboarded' | 'historyEnabled' | 'history'>>(
    (set, get) => ({
      onboarded: false,
      historyEnabled: true,
      history: [],
      scan: initialScan,

      markOnboarded: () => set({ onboarded: true }),
      setHistoryEnabled: (historyEnabled) => set({ historyEnabled }),
      clearHistory: () => set({ history: [] }),

      startScan: () =>
        set({
          scan: { ...initialScan, step: 'eyeScanning', startedAt: new Date().toISOString() },
        }),

      lockPart: (part, reading) =>
        set((state) => {
          if (part === 'eye' && state.scan.step === 'eyeScanning') {
            return { scan: { ...state.scan, eye: reading, step: 'eyeLocked' } };
          }
          if (part === 'skin' && state.scan.step === 'skinScanning') {
            return { scan: { ...state.scan, skin: reading, step: 'skinLocked' } };
          }
          return state;
        }),

      nextPart: () =>
        set((state) =>
          state.scan.step === 'eyeLocked'
            ? { scan: { ...state.scan, step: 'skinScanning' } }
            : state,
        ),

      completeScan: () => {
        const { scan } = get();
        if (scan.step !== 'skinLocked' || !scan.eye || !scan.skin) return;

        const result = combineResults(scan.eye.assessment, scan.skin.assessment);
        const completedAt = new Date().toISOString();
        const historyEnabled = get().historyEnabled;

        const entry: HistoryEntry = {
          id: `scan-${Date.now()}-${historySequence++}`,
          createdAt: completedAt,
          result,
        };

        const next = {
          step: 'done' as const,
          result,
          completedAt,
          error: null,
          history: historyEnabled ? [entry, ...get().history] : get().history,
        };
        set((state) => ({
          scan: { ...state.scan, ...next },
          history: next.history,
        }));
      },

      resetScan: () => set({ scan: initialScan }),

      setScanError: (error) =>
        set((state) => ({ scan: { ...state.scan, error } })),
    }),
    {
      name: 'fish-freshness-app',
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Pick<AppStore, 'onboarded' | 'historyEnabled' | 'history'>;
        return {
          ...state,
          onboarded: state.onboarded ?? false,
          historyEnabled: state.historyEnabled ?? true,
          history: (state.history ?? []).map((entry) =>
            (entry.result.level as string) === 'moderately_fresh'
              ? { ...entry, result: { ...entry.result, level: 'not_fresh' as const } }
              : entry,
          ),
        };
      },
      storage: {
        getItem: async (name) => {
          const raw = await AsyncStorage.getItem(name);
          if (!raw) return null;
          try {
            return JSON.parse(raw) as {
              state: Pick<AppStore, 'onboarded' | 'historyEnabled' | 'history'>;
              version?: number;
            };
          } catch {
            return null;
          }
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => AsyncStorage.removeItem(name),
      },
      partialize: (state) => ({
        onboarded: state.onboarded,
        historyEnabled: state.historyEnabled,
        history: state.history,
      }),
    },
  ),
);