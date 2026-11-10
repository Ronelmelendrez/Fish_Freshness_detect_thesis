import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { AppButton } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';

const STEPS = [
  { icon: '👁️', title: 'Scan the eye', body: 'Center the fish’s eye in the frame. Hold steady — the app reads it in real time and locks automatically once confident.' },
  { icon: '🐟', title: 'Then the skin', body: 'Point at a patch of skin near the gills. Same automatic lock, then the verdict combines both.' },
  { icon: '📊', title: 'Get the verdict', body: 'Fresh or Not Fresh — with an explanation and what to do next.' },
] as const;

/** First-run explainer shown before the main app. */
export function OnboardingScreen() {
  const markOnboarded = useAppStore((s) => s.markOnboarded);
  const [page, setPage] = useState(0);

  const advance = () => {
    if (page < STEPS.length - 1) setPage(page + 1);
    else markOnboarded();
  };
  const skip = () => markOnboarded();

  const step = STEPS[page];
  const isLast = page === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.stage}>
        <Text style={styles.icon}>{step.icon}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>

      <View style={styles.footer}>
        <AppButton label={isLast ? 'Get started' : 'Next'} onPress={advance} fullWidth />
        <Text style={styles.skip} onPress={skip}>Skip</Text>
        <Text style={styles.disclaimer}>
          Guidance only, not a food-safety certification. When in doubt, don’t consume.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 22 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingBottom: spacing.xl },
  icon: { fontSize: 64 },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.textPrimary, textAlign: 'center' },
  body: { fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  footer: { gap: spacing.md, paddingBottom: spacing.xl },
  skip: { textAlign: 'center', fontSize: typography.size.md, color: colors.textSecondary, paddingVertical: spacing.xs },
  disclaimer: { textAlign: 'center', fontSize: typography.size.caption, color: colors.textDisabled },
});