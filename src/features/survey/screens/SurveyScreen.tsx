import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { env } from '@/config/env';
import { SPECIES, SURVEY_LIKERT_OPTIONS, SURVEY_QUESTIONS } from '@/shared/constants';
import { AppButton, AppCard, ScreenLayout } from '@/shared/components';
import { colors, radii, spacing, typography } from '@/shared/theme';
import type { LikertValue, SurveyAnswer } from '../types';
import { exportSurveyCsv } from '../services/surveyExport';

const buildAnswer = (
  species: string,
  likert: Record<string, number>,
  notes: string,
): SurveyAnswer => ({
  species,
  clearly_understand: likert.clearly_understand as LikertValue,
  easy_to_use: likert.easy_to_use as LikertValue,
  trust_result: likert.trust_result as LikertValue,
  would_use: likert.would_use as LikertValue,
  found_valuable: likert.found_valuable as LikertValue,
  notes,
});

/** Voluntary feedback survey (field observation + usability Likert). */
export function SurveyScreen() {
  const [species, setSpecies] = useState<(typeof SPECIES)[number] | null>(null);
  const [likert, setLikert] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const setValue = (questionId: string, value: number) =>
    setLikert((prev) => ({ ...prev, [questionId]: value }));

  const allAnswered = SURVEY_QUESTIONS.every((q) => likert[q.id] != null);

  const submit = useCallback(async () => {
    if (!allAnswered || !species) return;
    setBusy(true);
    setStatus(null);
    try {
      const answers = buildAnswer(species, likert, notes);
      if (env.surveyEndpoint) {
        await fetch(env.surveyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, submittedAt: new Date().toISOString() }),
        });
        setStatus('Submitted — thank you!');
      } else {
        await exportSurveyCsv(answers);
        setStatus('Saved as CSV — thank you!');
      }
      setLikert({});
      setNotes('');
      setSpecies(null);
    } catch (err) {
      setStatus(`Could not submit: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [allAnswered, species, notes, likert]);

  return (
    <ScreenLayout title="Survey" subtitle="Optional, anonymous feedback — helps improve the app.">
      <AppCard>
        <Text style={styles.cardTitle}>Which fish were you checking?</Text>
        <View style={styles.speciesWrap}>
          {SPECIES.map((s) => {
            const selected = species === s;
            return (
              <Text
                key={s}
                style={[styles.speciesChip, selected && styles.speciesChipSelected, { color: selected ? colors.textOnColor : colors.textPrimary }]}
                onPress={() => setSpecies(s)}
              >
                {s}
              </Text>
            );
          })}
        </View>
      </AppCard>

      {SURVEY_QUESTIONS.map((q, index) => (
        <AppCard key={q.id}>
          <Text style={styles.question}>{index + 1}. {q.text}</Text>
          <View style={styles.likertWrap}>
            {SURVEY_LIKERT_OPTIONS.map((opt) => {
              const selected = likert[q.id] === opt.value;
              return (
                <Text
                  key={opt.value}
                  style={[styles.likertChip, selected && styles.likertChipSelected, { color: selected ? colors.textOnColor : colors.textSecondary }]}
                  onPress={() => setValue(q.id, opt.value)}
                >
                  {opt.value}
                </Text>
              );
            })}
          </View>
        </AppCard>
      ))}

      <AppCard>
        <Text style={styles.cardTitle}>Notes (optional)</Text>
        <TextInput
          style={styles.notes}
          multiline
          placeholder="Market, condition, any observations…"
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={colors.textDisabled}
        />
      </AppCard>

      {status && <Text style={[styles.status, status.startsWith('Could') && styles.statusError]}>{status}</Text>}
      <AppButton
        label="Submit survey"
        fullWidth
        loading={busy}
        disabled={!allAnswered || !species}
        onPress={submit}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  speciesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  speciesChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceVariant,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  speciesChipSelected: { backgroundColor: colors.primary },
  question: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  likertWrap: { flexDirection: 'row', gap: spacing.sm },
  likertChip: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceVariant,
    textAlign: 'center',
    lineHeight: 44,
    fontSize: typography.size.md,
    fontWeight: '700',
  },
  likertChipSelected: { backgroundColor: colors.primary },
  notes: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  status: { textAlign: 'center', fontSize: typography.size.md, color: colors.success },
  statusError: { color: colors.notFresh },
});