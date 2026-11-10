import { File, Paths, EncodingType } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SurveyAnswer } from '../types';

const serializeCell = (value: string | number | null) => {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsvRow(headers: string[], values: (string | number | null)[]): string {
  return headers.map((h, i) => serializeCell(values[i] ?? h)).join(',');
}

export interface ExportResult {
  method: 'csv';
  fileName: string;
}

const csvHeaders = ['timestamp', 'species', 'q_clearly_understand', 'q_easy_to_use', 'q_trust_result', 'q_would_use', 'q_found_valuable', 'notes'];

/** Build a CSV row for one survey submission and share it as a file. */
export async function exportSurveyCsv(answers: SurveyAnswer): Promise<ExportResult> {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `fish-freshness-survey-${iso}.csv`;
  const body = toCsvRow(csvHeaders, [
    new Date().toISOString(),
    answers.species,
    answers.clearly_understand,
    answers.easy_to_use,
    answers.trust_result,
    answers.would_use,
    answers.found_valuable,
    answers.notes ?? '',
  ]);

  const dir = Paths.cache;
  const file = new File(`${dir}/${fileName}`);
  file.create({ overwrite: true, intermediates: true });
  file.write(body, { encoding: EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Save survey response' });
  }

  return { method: 'csv', fileName };
}