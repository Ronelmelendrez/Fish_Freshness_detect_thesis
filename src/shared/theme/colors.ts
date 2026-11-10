/**
 * Central color palette. Includes the green / yellow / red freshness scale
 * used by the results feature.
 */
export const colors = {
  primary: '#0B7261',
  primaryDark: '#08584B',
  primaryLight: '#E6F4F1',
  accent: '#1E8E6E',
  accentSoft: 'rgba(30, 142, 110, 0.18)',

  // Freshness scale (results feature)
  fresh: '#2E7D32',
  freshSoft: '#E8F5E9',
  moderatelyFresh: '#F9A825',
  moderatelyFreshSoft: '#FFF8E1',
  notFresh: '#C62828',
  notFreshSoft: '#FFEBEE',

  // Feedback / status
  success: '#2E7D32',
  successSoft: '#E8F5E9',
  warning: '#F9A825',
  warningSoft: '#FFF8E1',

  background: '#F7F9FB',
  surface: '#FFFFFF',
  surfaceVariant: '#EFF3F6',
  border: '#E1E6EB',
  overlay: 'rgba(0, 0, 0, 0.55)',

  textPrimary: '#1C222B',
  textSecondary: '#5A6676',
  textOnColor: '#FFFFFF',
  textDisabled: '#A6B0BC',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type AppColors = typeof colors;