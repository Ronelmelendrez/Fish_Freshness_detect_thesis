import { StyleSheet, Text, View } from 'react-native';
import type { FrameReading } from '@/features/detection/types';
import { severityOf } from '@/features/detection/services/combineResults';
import { CONDITION_LABELS, type PartKey } from '@/shared/constants';
import { colors, radii, spacing, typography } from '@/shared/theme';

interface LiveOverlayProps {
  part: PartKey;
  latest: FrameReading | null;
  fps: number;
  avgLatencyMs: number;
  backend: 'tflite' | 'roboflow';
  locked: boolean;
}

/** HUD shown over the live feed: condition chips, FPS/latency and backend badge. */
export function LiveOverlay({ part, latest, fps, avgLatencyMs, backend, locked }: LiveOverlayProps) {
  const conditions = CONDITION_LABELS[part];
  const conditionKeys = Object.keys(conditions);
  const activeCondition = latest?.condition ?? null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.badges}>
        <Text style={styles.hud}>
          {fps > 0 ? `${fps.toFixed(0)} fps` : '·'} · {avgLatencyMs > 0 ? `${avgLatencyMs} ms` : '·'}
        </Text>
      </View>

      <View style={styles.chips}>
        {conditionKeys.map((key) => {
          const active = key === activeCondition;
          const sev = severityOf(part, key);
          const chipColor = active ? (sev === 0 ? colors.fresh : sev === 1 ? colors.moderatelyFresh : colors.notFresh) : colors.surfaceVariant;
          return (
            <View key={key} style={[styles.chip, { backgroundColor: chipColor, ...(active ? styles.chipActive : null) }]}>
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                {conditions[key]}
              </Text>
            </View>
          );
        })}
      </View>

      {locked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>Reading locked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.size.caption,
    color: colors.warning,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hud: { fontSize: typography.size.caption, color: 'rgba(255,255,255,0.85)' },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radii.lg,
    padding: spacing.sm,
    alignSelf: 'center',
  },
  chip: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  chipText: { fontSize: typography.size.caption, fontWeight: '600' },
  lockedBanner: {
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  lockedText: { fontSize: typography.size.caption, color: colors.success, fontWeight: '700' },
});