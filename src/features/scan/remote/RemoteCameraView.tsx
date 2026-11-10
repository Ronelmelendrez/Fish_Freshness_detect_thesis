import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Camera, type CameraRef, useCameraDevice } from 'react-native-vision-camera';
import type { FrameReading } from '@/features/detection/types';
import type { PartKey } from '@/shared/constants';
import { useCameraPermissions } from '@/features/scan/hooks/useCameraPermissions';
import { useRemoteScan } from './useRemoteScan';
import { colors, spacing, typography } from '@/shared/theme';
import { AppButton } from '@/shared/components';

interface RemoteCameraViewProps {
  part: PartKey;
  isActive: boolean;
  onReading: (reading: FrameReading) => void;
  onError: (message: string) => void;
}

export function RemoteCameraView({ part, isActive, onReading, onError }: RemoteCameraViewProps) {
  const camera = useRef<CameraRef>(null);
  const device = useCameraDevice('back');
  const permissions = useCameraPermissions();

  const capture = useCallback(async () => {
    if (!camera.current) throw new Error('Camera is not ready.');
    const snapshot = await camera.current.takeSnapshot();
    const encoded = await snapshot.toEncodedImageDataAsync('jpg', 70);
    return new Blob([encoded.buffer], { type: 'image/jpeg' });
  }, []);

  const remote = useRemoteScan({
    part,
    enabled: isActive && Boolean(device && permissions.hasPermission),
    capture,
    onReading,
    onError,
    onResult: (result) => {
      if (result.status !== 'result') return;
      const partResult = result.parts?.[part];
      if (!partResult) return;
      const condition = part === 'eye'
        ? partResult.grade === 'fresh' ? 'clear' : 'sunken'
        : partResult.grade === 'fresh' ? 'firm_shiny' : 'discolored';
      onReading({
        part,
        condition,
        confidence: partResult.confidence,
        box: null,
        latencyMs: 0,
        backend: 'roboflow',
        timestamp: Date.now(),
      });
    },
  });

  useEffect(() => {
    if (remote.state === 'offline') onError('No connection to the scan gateway.');
  }, [onError, remote.state]);

  if (!device) return <Message text="No back camera found on this device." />;
  if (!permissions.hasPermission) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageText}>Camera access is needed for hosted scanning.</Text>
        {permissions.canRequest && <AppButton label="Enable camera" onPress={permissions.request} fullWidth />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={isActive} />
      <View style={styles.status}>
        <Text style={styles.statusText}>{remote.state === 'grading' ? 'Grading…' : remote.hint}</Text>
        {remote.state === 'detected' && (
          <Text style={styles.progressText}>{remote.progress.count}/{remote.progress.needed} frames ready</Text>
        )}
        {remote.state === 'grading' && <ActivityIndicator color={colors.accent} />}
      </View>
    </View>
  );
}

function Message({ text }: { text: string }) {
  return <View style={styles.message}><Text style={styles.messageText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  status: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusText: { color: '#fff', fontSize: typography.size.md, fontWeight: typography.weight.semibold },
  progressText: { color: '#fff', fontSize: typography.size.caption },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  messageText: { color: colors.notFresh, textAlign: 'center', fontSize: typography.size.md },
});
