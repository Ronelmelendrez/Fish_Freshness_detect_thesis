import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { model } from '@/config/modelConfig';
import type { StabilityProgress } from '@/features/scan/hooks/useStableReading';
import type { FrameReading } from '@/features/detection/types';
import type { PartKey } from '@/shared/constants';
import { colors, spacing, typography } from '@/shared/theme';
import { ScanReticle } from './ScanReticle';
import { LiveOverlay } from './LiveOverlay';

type LiveCameraViewType = typeof import('./LiveCameraView').LiveCameraView;
type RemoteCameraViewType = typeof import('../remote/RemoteCameraView').RemoteCameraView;

interface ScanCaptureViewProps {
  part: PartKey;
  isActive: boolean;
  onReading: (reading: FrameReading) => void;
  onError: (message: string) => void;
  /** Live overlay data (fps, condition chips, backend badge). */
  latest: FrameReading | null;
  fps: number;
  avgLatencyMs: number;
  locked: boolean;
  /** Drives the reticle's stability fill (null while nothing has been seen). */
  progress?: StabilityProgress | null;
}

/**
 * Composes the capture engine with the reticle and live overlay.
 *
 * The real camera (`LiveCameraView`) is lazy-required and only mounted on a
 * backend of `tflite` or `roboflow`, keeping native-only modules lazy.
 */
export function ScanCaptureView(props: ScanCaptureViewProps) {
  const { part, isActive, onReading, onError, latest, fps, avgLatencyMs, locked, progress } = props;
  const scanning = isActive && !locked;
  const fill = progress && progress.needed > 0 ? Math.min(progress.count / progress.needed, 1) : 0;
  const isReal = model.backend === 'tflite';
  const isHosted = model.backend === 'roboflow';

  const [LiveCamera, setLiveCamera] = useState<LiveCameraViewType | null>(null);
  const [RemoteCamera, setRemoteCamera] = useState<RemoteCameraViewType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReal) return;
    let cancelled = false;
    // Lazy-load native camera code only when the TFLite backend is selected.
    import('./LiveCameraView')
      .then((mod) => {
        if (!cancelled) setLiveCamera(() => mod.LiveCameraView);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [isReal]);

  useEffect(() => {
    if (!isHosted) return;
    let cancelled = false;
    import('../remote/RemoteCameraView')
      .then((mod) => {
        if (!cancelled) setRemoteCamera(() => mod.RemoteCameraView);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [isHosted]);

  useEffect(() => {
    if (loadError) onError(loadError);
  }, [loadError, onError]);

  const renderEngine = () => {
    if (isHosted) {
      if (!RemoteCamera) {
        return <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.loadingText}>Preparing hosted scanner…</Text></View>;
      }
      return <RemoteCamera part={part} isActive={isActive} onReading={onReading} onError={onError} />;
    }
    if (isReal) {
      if (!LiveCamera) {
        return (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Preparing camera…</Text>
          </View>
        );
      }
      return <LiveCamera part={part} isActive={isActive} onReading={onReading} onError={onError} />;
    }
    return <View style={styles.loading}><Text style={styles.loadingText}>No scan backend configured.</Text></View>;
  };

  return (
    <View style={styles.container}>
      {renderEngine()}

      {isActive && (
        <ScanReticle color={locked ? colors.success : colors.accent} scanning={scanning} progress={fill} />
      )}

      <LiveOverlay
        part={part}
        latest={latest}
        fps={fps}
        avgLatencyMs={avgLatencyMs}
        backend={model.backend}
        locked={locked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: typography.size.caption, color: colors.textSecondary },
});