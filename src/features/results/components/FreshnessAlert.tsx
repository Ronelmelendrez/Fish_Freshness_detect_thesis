import { StyleSheet, Text, View } from 'react-native';
import type { FreshnessLevel } from '@/shared/constants';
import { FRESHNESS_META } from '@/shared/constants';
import { spacing, typography } from '@/shared/theme';

interface FreshnessAlertProps {
  level: FreshnessLevel;
  /** 0..1 overall confidence shown under the headline. */
  confidence: number;
}

/** The big verdict banner: icon, headline, color, and guidance. */
export function FreshnessAlert({ level, confidence }: FreshnessAlertProps) {
  const meta = FRESHNESS_META[level];
  return (
    <View style={[styles.card, { backgroundColor: meta.softColor, borderColor: meta.color }]}>
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={[styles.headline, { color: meta.color }]}>{meta.headline}</Text>
      <Text style={styles.label}>{meta.label}</Text>
      <Text style={styles.guidance}>{meta.guidance}</Text>
      <Text style={styles.confidence}>Model confidence {(confidence * 100).toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  icon: { fontSize: 44 },
  headline: { fontSize: 26, fontWeight: '800' },
  label: { fontSize: typography.size.md, color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  guidance: { fontSize: typography.size.md, color: '#444', textAlign: 'center', lineHeight: 22 },
  confidence: { fontSize: typography.size.caption, color: '#777' },
});