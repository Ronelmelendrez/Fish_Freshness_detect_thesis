import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/types';
import { env } from '@/config/env';
import { useAppStore } from '@/store/appStore';
import { FRESHNESS_META } from '@/shared/constants';
import { ScreenLayout } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { FreshnessAlert, PartResultCard } from '@/features/results';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryDetail'>;

/** Read-only detail view for a saved scan. */
export function HistoryDetailScreen({ route }: Props) {
  const entry = useAppStore((s) => s.history.find((h) => h.id === route.params.entryId));

  if (!entry) {
    return (
      <ScreenLayout title="History" center>
        <Text style={styles.missing}>This record no longer exists.</Text>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={FRESHNESS_META[entry.result.level].label}
      subtitle={`Scanned ${new Date(entry.createdAt).toLocaleString()}`}
    >
      <FreshnessAlert level={entry.result.level} confidence={entry.result.confidence} />
      <View style={styles.cards}>
        <PartResultCard part="eye" assessment={entry.result.eye} />
        <PartResultCard part="skin" assessment={entry.result.skin} />
      </View>
      <Text style={styles.meta}>
        Strategy: {entry.result.strategy} · App v{env.appVersion}
      </Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  cards: { gap: spacing.md },
  meta: { fontSize: typography.size.caption, color: colors.textSecondary, textAlign: 'center' },
  missing: { fontSize: typography.size.md, color: colors.textSecondary },
});