import { colors } from '@/shared/theme';

export type FreshnessLevel = 'fresh' | 'not_fresh';

export type PartKey = 'eye' | 'skin';

/**
 * Overall freshness levels, their visual identity, and FAO-style consumption
 * guidance. Text is intentionally approachable — it is guidance, not a
 * food-safety certification.
 */
export const FRESHNESS_META: Record<
  FreshnessLevel,
  {
    label: string;
    color: string;
    softColor: string;
    icon: string;
    headline: string;
    guidance: string;
    timeline: string[];
  }
> = {
  fresh: {
    label: 'Fresh',
    color: colors.fresh,
    softColor: colors.freshSoft,
    icon: '✅',
    headline: 'Good to eat',
    guidance:
      'The indicators point to a fresh fish. Store on ice (0–4 °C) and consume within 1–2 days of purchase.',
    timeline: [
      'Day of purchase: store refrigerated on ice.',
      'Use within 1–2 days for best quality.',
    ],
  },
  not_fresh: {
    label: 'Not Fresh',
    color: colors.notFresh,
    softColor: colors.notFreshSoft,
    icon: '🚫',
    headline: 'Do not consume',
    guidance:
      'Spoilage indicators were detected. If the signs are still early, cook thoroughly and consume within 24 hours; otherwise discard the fish — consuming spoiled fish may cause foodborne illness.',
    timeline: [
      'Do not use for sushi, ceviche, or other raw preparations.',
      'Cook thoroughly or discard within 24 hours.',
      'If signs are strong, discard safely away from other food.',
    ],
  },
} as const;

export const PART_META: Record<PartKey, { label: string; instruction: string; hint: string }> = {
  eye: {
    label: 'Eye',
    instruction: 'Center the fish’s eye in the frame',
    hint: 'Hold the phone 20–30 cm away, steady, with good lighting.',
  },
  skin: {
    label: 'Skin',
    instruction: 'Frame a patch of skin near the gills',
    hint: 'Include the shiny flank so texture and colour are visible.',
  },
} as const;

export const CONDITION_LABELS: Record<PartKey, Record<string, string>> = {
  eye: { clear: 'Clear', cloudy: 'Cloudy', sunken: 'Sunken' },
  skin: { firm_shiny: 'Firm & shiny', slimy: 'Slimy', discolored: 'Discolored' },
} as const;