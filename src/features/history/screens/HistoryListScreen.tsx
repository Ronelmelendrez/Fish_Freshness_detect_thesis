import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/types';
import type { HistoryEntry } from '@/store/appStore';
import { useAppStore } from '@/store/appStore';
import { CONDITION_LABELS, FRESHNESS_META } from '@/shared/constants';
import { AppCard, ScreenLayout } from '@/shared/components';
import { colors, radii, spacing, typography } from '@/shared/theme';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function HistoryRow({ entry, onPress }: { entry: HistoryEntry; onPress: () => void }) {
  const meta = FRESHNESS_META[entry.result.level];
  return (
    <AppCard style={styles.row} >
      <View style={styles.rowHeader}>
        <View style={[styles.badge, { backgroundColor: meta.softColor, borderColor: meta.color }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.date}>{fmtDate(entry.createdAt)}</Text>
      </View>
      <View style={styles.chips}>
        {(['eye', 'skin'] as const).map((part) => (
          <Text key={part} style={styles.chip}>
            {part.toUpperCase()}: {CONDITION_LABELS[part]?.[entry.result[part].condition] ?? entry.result[part].condition}
          </Text>
        ))}
      </View>
      <Text style={styles.openHint} onPress={onPress}>View details →</Text>
    </AppCard>
  );
}

/** Local scan history (persisted in AsyncStorage). */
export function HistoryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const history = useAppStore((s) => s.history);
  const historyEnabled = useAppStore((s) => s.historyEnabled);
  const clearHistory = useAppStore((s) => s.clearHistory);

  return (
    <ScreenLayout title="History" subtitle="Past scan verdicts saved on this device." scroll={false}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AppCard>
            <Text style={styles.empty}>{historyEnabled ? 'No scans yet — run one from the Scan tab.' : 'History logging is disabled in Settings.'}</Text>
          </AppCard>
        }
        renderItem={({ item }) => (
          <HistoryRow
            entry={item}
            onPress={() => navigation.navigate('HistoryDetail', { entryId: item.id })}
          />
        )}
      />
      {history.length > 0 && (
        <Text style={styles.clearLink} onPress={clearHistory}>Clear history</Text>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: {},
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  badge: { borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: typography.size.sm, fontWeight: '700' },
  date: { fontSize: typography.size.caption, color: colors.textSecondary },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { fontSize: typography.size.sm, color: colors.textPrimary },
  openHint: { marginTop: spacing.sm, fontSize: typography.size.sm, fontWeight: '600', color: colors.accent },
  empty: { fontSize: typography.size.md, color: colors.textSecondary },
  clearLink: { marginTop: spacing.md, textAlign: 'center', fontSize: typography.size.sm, color: colors.notFresh, fontWeight: '600' },
});