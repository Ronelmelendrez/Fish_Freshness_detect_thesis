import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/types';
import type { FrameReading } from '@/features/detection/types';
import type { PartKey } from '@/shared/constants';
import { CONDITION_LABELS, PART_META } from '@/shared/constants';
import { AppButton, AppCard } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { useLiveDetection } from '@/features/scan/hooks/useLiveDetection';
import { useStableReading, toStableReading, type StabilityProgress } from '@/features/scan/hooks/useStableReading';
import { useScanFlow } from '@/features/scan/hooks/useScanFlow';
import { ScanCaptureView } from '@/features/scan/components/ScanCaptureView';
import { model } from '@/config/modelConfig';

type ScreenProps = NativeStackScreenProps<RootStackParamList, 'EyeScan' | 'SkinScan'>;

function ScanScreen({ part, navigation }: Pick<ScreenProps, 'navigation'> & { part: PartKey }) {
  const flow = useScanFlow();
  const { step, startScan, lockPart, nextPart, completeScan, resetScan, setScanError } = flow;
  const [isLocked, setIsLocked] = useState(false);

  const eyeScanning = part === 'eye' && step === 'eyeScanning';
  const skinScanning = part === 'skin' && step === 'skinScanning';
  const scanning = eyeScanning || skinScanning;

  const { latest, fps, avgLatencyMs, pushReading } = useLiveDetection(part);

  const handleLocked = useCallback(
    (reading: FrameReading, progress: StabilityProgress) => {
      setIsLocked(true);
      lockPart(part, toStableReading(reading, progress.count));
    },
    [part, lockPart],
  );

  const stable = useStableReading({
    part,
    enabled: scanning,
    consecutiveFrames: model.backend === 'roboflow' ? 1 : undefined,
    onLocked: handleLocked,
  });
  const stableEmit = stable.emit;

  const handleReading = useCallback(
    (reading: FrameReading) => {
      if (!scanning) return;
      pushReading(reading);
      stableEmit(reading);
    },
    [scanning, pushReading, stableEmit],
  );

  const handleError = useCallback(
    (message: string) => setScanError(message),
    [setScanError],
  );

  // Skin locked -> combine the two parts and show the verdict.
  useEffect(() => {
    if (part === 'skin' && step === 'skinLocked') completeScan();
  }, [part, step, completeScan]);

  useEffect(() => {
    if (part === 'skin' && step === 'done') navigation.navigate('Result');
  }, [part, step, navigation]);

  const lockedReading = part === 'eye' ? flow.eye : flow.skin;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{PART_META[part].label} scan</Text>
        <Text style={styles.subtitle}>
          {scanning
            ? PART_META[part].instruction
            : isLocked || step === 'eyeLocked' || step === 'skinLocked'
              ? 'Reading locked'
              : PART_META[part].hint}
        </Text>
      </View>

      <View style={styles.capture}>
        <ScanCaptureView
          part={part}
          isActive={scanning}
          onReading={handleReading}
          onError={handleError}
          latest={latest}
          fps={fps}
          avgLatencyMs={avgLatencyMs}
          locked={isLocked || stable.locked}
          progress={stable.progress}
        />
      </View>

      <View style={styles.footer}>
        {step === 'idle' && (
          <AppButton label="Begin scan" onPress={startScan} fullWidth />
        )}

        {part === 'eye' && step === 'eyeLocked' && lockedReading && (
          <>
            <AppCard style={styles.lockCard}>
              <Text style={styles.lockLabel}>
                Eye: {CONDITION_LABELS.eye[lockedReading.assessment.condition]}
              </Text>
              <Text style={styles.lockMeta}>
                {(lockedReading.assessment.confidence * 100).toFixed(0)}% · held for{' '}
                {lockedReading.stableSamples} frames
              </Text>
            </AppCard>
            <AppButton
              label="Continue to skin scan →"
              onPress={() => {
                nextPart();
                navigation.navigate('SkinScan');
              }}
              fullWidth
            />
          </>
        )}

        {part === 'skin' && step === 'eyeLocked' && (
          <Text style={styles.hintText}>Finish the eye scan first — head back to the eye tab.</Text>
        )}

        {(part === 'eye' && (step === 'skinScanning' || step === 'skinLocked' || step === 'done')) && (
          <Text style={styles.hintText}>The skin scan is already in progress — go back to finish.</Text>
        )}

        {flow.error && <Text style={styles.errorText}>{flow.error}</Text>}

        {scanning && (
          <Text style={styles.hintText}>
            Hold steady — the reading locks automatically when consistent.
          </Text>
        )}

        {step !== 'idle' && step !== 'eyeScanning' && (
          <AppButton label="Restart scan" variant="outline" onPress={() => resetScan()} fullWidth />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Real-time eye scan (step 1 of the two-part wizard). */
export function EyeScanScreen(props: Omit<ScreenProps, 'part'>) {
  return <ScanScreen part="eye" {...props} />;
}

/** Real-time skin scan (step 2 of the two-part wizard). */
export function SkinScanScreen(props: Omit<ScreenProps, 'part'>) {
  return <ScanScreen part="skin" {...props} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  capture: { flex: 1, marginHorizontal: spacing.sm, borderRadius: 16, overflow: 'hidden' },
  footer: { padding: spacing.lg, gap: spacing.md },
  lockCard: { gap: spacing.xs },
  lockLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  lockMeta: { fontSize: typography.size.md, color: colors.textSecondary },
  hintText: { textAlign: 'center', fontSize: typography.size.md, color: colors.textSecondary },
  errorText: { textAlign: 'center', fontSize: typography.size.md, color: colors.notFresh },
});