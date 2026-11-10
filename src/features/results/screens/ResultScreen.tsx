import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/types';
import { FRESHNESS_META } from '@/shared/constants';
import { AppButton, AppCard, ScreenLayout } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { useAppStore } from '@/store/appStore';
import { FreshnessAlert } from '../components/FreshnessAlert';
import { PartResultCard } from '../components/PartResultCard';
import { ConsumptionTimeline } from '../components/ConsumptionTimeline';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

/** Combined verdict for the completed scan (eye + skin). */
export function ResultScreen({ navigation }: Props) {
  const result = useAppStore((s) => s.scan.result);
  const resetScan = useAppStore((s) => s.resetScan);
  const startScan = useAppStore((s) => s.startScan);

  if (!result) {
    return (
      <ScreenLayout title="Result" center>
        <Text style={styles.emptyText}>No completed scan yet.</Text>
        <AppButton
          label="Start a scan"
          fullWidth
          onPress={() => navigation.navigate('EyeScan')}
        />
      </ScreenLayout>
    );
  }

  const timeline = FRESHNESS_META[result.level].timeline;
  const label = FRESHNESS_META[result.level].label;

  return (
    <ScreenLayout title={`Verdict · ${label}`}>
      <FreshnessAlert level={result.level} confidence={result.confidence} />

      <View style={styles.cards}>
        <PartResultCard part="eye" assessment={result.eye} />
        <PartResultCard part="skin" assessment={result.skin} />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>What to do now</Text>
        <ConsumptionTimeline timeline={timeline} />
      </AppCard>

      <Text style={styles.disclaimer}>
        Guidance only — not a food-safety certification. When in doubt, trust your senses.
      </Text>

      <AppButton
        label="Scan another fish"
        fullWidth
        onPress={() => {
          resetScan();
          startScan();
          navigation.navigate('EyeScan');
        }}
      />
      <AppButton
        label="Back to home"
        variant="outline"
        fullWidth
        onPress={() => navigation.navigate('MainTabs')}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  cards: { gap: spacing.md },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  disclaimer: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center' },
  emptyText: { fontSize: typography.size.md, color: colors.textSecondary },
});