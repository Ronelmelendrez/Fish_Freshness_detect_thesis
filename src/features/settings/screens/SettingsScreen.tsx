import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { env } from '@/config/env';
import { model } from '@/config/modelConfig';
import { useAppStore } from '@/store/appStore';
import { AppButton, AppCard, ScreenLayout } from '@/shared/components';
import { colors, radii, spacing, typography } from '@/shared/theme';

/** App settings: history, backend info, data controls. */
export function SettingsScreen() {
  const historyEnabled = useAppStore((s) => s.historyEnabled);
  const setHistoryEnabled = useAppStore((s) => s.setHistoryEnabled);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const historyCount = useAppStore((s) => s.history.length);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <ScreenLayout title="Settings">
      <AppCard>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Scan history</Text>
            <Text style={styles.rowSubtitle}>{historyCount} saved verdict(s)</Text>
          </View>
          <Switch value={historyEnabled} onValueChange={setHistoryEnabled} trackColor={{ true: colors.accent, false: colors.border }} />
        </View>

        {historyEnabled && historyCount > 0 && (
          <View style={styles.dangerZone}>
            {confirmClear ? (
              <View style={styles.confirmRow}>
                <AppButton label="Yes, delete all" variant="danger" onPress={() => { clearHistory(); setConfirmClear(false); }} style={styles.confirmBtn} />
                <AppButton label="Cancel" variant="outline" onPress={() => setConfirmClear(false)} style={styles.confirmBtn} />
              </View>
            ) : (
              <Text style={styles.link} onPress={() => setConfirmClear(true)}>Clear all history</Text>
            )}
          </View>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Detection</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Model backend</Text>
            <Text style={styles.rowSubtitle}>
              {model.backend === 'tflite' ? 'On-device TFLite' : 'Hosted gateway'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: model.backend === 'tflite' ? colors.accentSoft : colors.successSoft }]}>
            <Text style={styles.badgeText}>{model.backend.toUpperCase()}</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.about}>
          Fish Freshness Detector scans a fish’s eye and skin in real time on your phone to estimate freshness.{'\n\n'}
          Model input: 640×640 RGB · v{env.appVersion}
        </Text>
      </AppCard>

      <Text style={styles.disclaimer}>
        For guidance only. Not a certification of food safety. When in doubt, do not consume.
      </Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowText: { flex: 1 },
  rowTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  rowSubtitle: { fontSize: typography.size.caption, color: colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeText: { fontSize: typography.size.caption, fontWeight: '700' },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  about: { fontSize: typography.size.md, color: colors.textSecondary, lineHeight: 22 },
  dangerZone: { marginTop: spacing.md },
  link: { color: colors.notFresh, fontWeight: '600', fontSize: typography.size.md },
  confirmRow: { flexDirection: 'row', gap: spacing.md },
  confirmBtn: { flex: 1 },
  disclaimer: { textAlign: 'center', fontSize: typography.size.caption, color: colors.textDisabled, marginTop: spacing.xl },
});