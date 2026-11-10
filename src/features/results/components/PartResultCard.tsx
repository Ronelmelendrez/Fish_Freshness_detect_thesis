import { StyleSheet, Text, View } from 'react-native';
import type { PartAssessment } from '@/features/detection';
import { CONDITION_LABELS, type PartKey } from '@/shared/constants';
import { colors, radii, spacing, typography } from '@/shared/theme';
import { ConfidenceMeter } from './ConfidenceMeter';

interface PartResultCardProps {
  part: PartKey;
  assessment: PartAssessment;
}

const SEVERITY_COLOR = [colors.fresh, colors.moderatelyFresh, colors.notFresh] as const;

/** One half of the verdict: the locked eye or skin assessment. */
export function PartResultCard({ part, assessment }: PartResultCardProps) {
  const tint = SEVERITY_COLOR[Math.min(Math.max(assessment.severity, 0), 2)];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.part}>{part.toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: tint + '22' }]}>
          <Text style={[styles.condition, { color: tint }]}>{CONDITION_LABELS[part]?.[assessment.condition] ?? assessment.condition}</Text>
        </View>
      </View>
      <ConfidenceMeter value={assessment.confidence} color={tint} />
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {assessment.backend} · {assessment.durationMs} ms/frame
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  part: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radii.sm },
  condition: { fontSize: typography.size.md, fontWeight: typography.weight.bold },
  meta: {},
  metaText: { fontSize: typography.size.caption, color: colors.textSecondary },
});