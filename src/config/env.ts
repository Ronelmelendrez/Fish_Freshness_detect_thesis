/**
 * Runtime configuration read from environment variables.
 *
 * Expo inlines any variable prefixed with `EXPO_PUBLIC_` at bundle time.
 * Copy `.env.example` to `.env.local` to override values locally.
 */

const readBool = (key: string, fallback: boolean): boolean => {
  // Keys are compile-time literals passed from the exported `env` object below;
  // a helper is used so the value is read exactly once.
  // eslint-disable-next-line expo/no-dynamic-env-var
  const raw = process.env[key];
  if (raw == null || raw === '') return fallback;
  return raw.toLowerCase() === 'true' || raw === '1';
};

const readString = (key: string, fallback = ''): string => process.env[key] ?? fallback;

export const env = {
  /** Hosted gateway URL for gate and grade requests. */
  gatewayUrl: readString('EXPO_PUBLIC_GATEWAY_URL'),
  /** App token checked by the hosted gateway. */
  gatewayAppToken: readString('EXPO_PUBLIC_GATEWAY_APP_TOKEN'),
  /** Send anonymous survey responses to a backend URL when configured. */
  surveyEndpoint: readString('EXPO_PUBLIC_SURVEY_ENDPOINT'),
  /** Persist completed scans to local history. */
  historyEnabled: readBool('EXPO_PUBLIC_HISTORY_ENABLED', true),
  /** Show the first-run onboarding explainer. */
  onboardingEnabled: readBool('EXPO_PUBLIC_ONBOARDING_ENABLED', true),
  /** App display metadata shown in e.g. the Settings screen. */
  appVersion: readString('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
} as const;

export type Env = typeof env;