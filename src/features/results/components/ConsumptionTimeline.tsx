import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/shared/theme';

interface ConsumptionTimelineProps {
  timeline: string[];
}

/** Sequential consumption guidance (from FRESHNESS_META.timeline). */
export function ConsumptionTimeline({ timeline }: ConsumptionTimelineProps) {
  return (
    <View style={styles.container}>
      {timeline.map((step, i) => (
        <View key={step} style={styles.row}>
          <View style={styles.dot}>
            <Text style={styles.dotNumber}>{i + 1}</Text>
          </View>
          <Text style={styles.text}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF3F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotNumber: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: '#5A6676' },
  text: { flex: 1, fontSize: typography.size.md, color: '#444', lineHeight: 22 },
});