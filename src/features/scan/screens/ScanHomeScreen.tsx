import { StyleSheet, Text, View } from 'react-native';
import { model } from '@/config/modelConfig';
import type { ScanTabScreenProps } from '@/app/navigation/types';
import { useAppStore } from '@/store/appStore';
import { FRESHNESS_META } from '@/shared/constants';
import { AppButton, AppCard, ScreenLayout } from '@/shared/components';
import { colors, radii, spacing, typography } from '@/shared/theme';

/** Scan tab landing: how-it-works, start CTA, recent verdict. */
export function ScanHomeScreen({ navigation }: ScanTabScreenProps) {
  const startScan = useAppStore((s) => s.startScan);
  const resetScan = useAppStore((s) => s.resetScan);
  const lastEntry = useAppStore((s) => s.history[0]);

  return (
    <ScreenLayout title="Fish freshness">
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🐟</Text>
        <Text style={styles.heroTitle}>Scan your fish</Text>
        <Text style={styles.heroBody}>
          Hold the eye in the frame — then the skin. Get a freshness verdict from the hosted detection pipeline.
        </Text>
      </View>

      <View style={styles.cta}>
        <AppButton
          label="Start scan"
          fullWidth
          onPress={() => {
            resetScan();
            startScan();
            navigation.navigate('EyeScan');
          }}
        />
      </View>

      {lastEntry ? (
        <AppCard style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent verdict</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: FRESHNESS_META[lastEntry.result.level].softColor },
              ]}
            >
              <Text style={[styles.badgeText, { color: FRESHNESS_META[lastEntry.result.level].color }]}>
                {FRESHNESS_META[lastEntry.result.level].label}
              </Text>
            </View>
          </View>
          <Text style={styles.recentMeta}>
            {new Date(lastEntry.createdAt).toLocaleString()}
          </Text>
          <Text style={styles.recentLink} onPress={() => navigation.navigate('HistoryDetail', { entryId: lastEntry.id })}>
            View details →
          </Text>
        </AppCard>
      ) : (
        <AppCard>
          <Text style={styles.emptyText}>No verdicts yet.</Text>
        </AppCard>
      )}

      <Text style={styles.hint}>
        Backend: {model.backend === 'tflite' ? 'on-device model' : 'hosted gateway'}.
        {'\n'}Hold the phone steady for the reading to lock.
      </Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  heroBody: { fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  cta: { marginVertical: spacing.md },
  recent: {},
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  recentTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  badge: { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: typography.size.sm, fontWeight: '700' },
  recentMeta: { fontSize: typography.size.caption, color: colors.textSecondary },
  recentLink: { marginTop: spacing.sm, fontSize: typography.size.sm, fontWeight: '600', color: colors.accent },
  emptyText: { fontSize: typography.size.md, color: colors.textSecondary },
  hint: { marginTop: spacing.xl, fontSize: typography.size.caption, color: colors.textDisabled, textAlign: 'center', lineHeight: 18 },
});