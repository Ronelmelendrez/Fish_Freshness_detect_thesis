import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/shared/theme';

interface ConfidenceMeterProps {
  /** 0..1 */
  value: number;
  color?: string;
  label?: string;
}

/** Horizontal confidence bar with a percentage readout. */
export function ConfidenceMeter({ value, color = colors.accent, label }: ConfidenceMeterProps) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { fontSize: typography.size.md, color: colors.textSecondary, width: 96 },
  track: { flex: 1, height: 10, borderRadius: radii.sm, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 10, borderRadius: radii.sm },
  pct: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary, width: 48, textAlign: 'right' },
});