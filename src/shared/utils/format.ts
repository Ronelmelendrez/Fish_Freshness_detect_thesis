export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const formatPercent = (confidence: number): string =>
  `${Math.round(clamp01(confidence) * 100)}%`;

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};