/**
 * Real camera + real inference (VisionCamera v5 frame output → worklet →
 * TFLite).
 *
 * ⚠️ This module must only ever be loaded lazily (see ScanCaptureView) — it
 * imports native-only packages (vision-camera, worklets, TFLite) that would
 * crash in environments without native code, such as Expo Go.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import type { FrameReading } from '@/features/detection/types';
import { useFreshnessDetection } from '@/features/detection';
import { live } from '@/config/modelConfig';
import type { PartKey } from '@/shared/constants';
import { useCameraPermissions } from '../hooks/useCameraPermissions';
import { createFrameProcessor } from '@/features/detection/services/frameProcessor';
import { Camera, useCameraDevice, useFrameOutput } from 'react-native-vision-camera';

interface LiveCameraViewProps {
  part: PartKey;
  isActive: boolean;
  onReading: (reading: FrameReading) => void;
  onError: (message: string) => void;
}

export function LiveCameraView({ part, isActive, onReading, onError }: LiveCameraViewProps) {
  const device = useCameraDevice('back');
  const permissions = useCameraPermissions();
  const { model, isLoading, error } = useFreshnessDetection();
  const tfliteModel = model?.kind === 'tflite' ? model.model : null;
  const [frameError, setFrameError] = useState<string | null>(null);

  useEffect(() => {
    if (frameError) onError(frameError);
  }, [frameError, onError]);

  const onFrame = useMemo(
    () =>
      tfliteModel
        ? createFrameProcessor({
            part,
            model: tfliteModel,
            backend: 'tflite',
            onReading,
            onError: (message) => setFrameError(message),
          })
        : undefined,
    [tfliteModel, part, onReading],
  );

  const frameOutput = useFrameOutput({
    targetResolution: live.frameTarget,
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame,
  });

  const reportError = error ?? frameError;

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No back camera found on this device.</Text>
      </View>
    );
  }

  if (!permissions.hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Camera access is needed to scan in real time.</Text>
        {permissions.canRequest ? (
          <AppButton label="Enable camera" onPress={permissions.request} fullWidth />
        ) : (
          <Text style={styles.hint}>Enable camera access in your device settings.</Text>
        )}
      </View>
    );
  }

  if (isLoading || !tfliteModel) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.hint}>Loading model…</Text>
      </View>
    );
  }

  if (reportError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{reportError}</Text>
      </View>
    );
  }

  return (
    <Camera style={StyleSheet.absoluteFill} device={device} isActive={isActive} outputs={[frameOutput]} />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  hint: { fontSize: typography.size.caption, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: typography.size.md, color: colors.notFresh, textAlign: 'center' },
});