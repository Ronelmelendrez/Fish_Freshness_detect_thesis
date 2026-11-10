import { StatusBar } from 'expo-status-bar';
import { env } from '@/config/env';
import { useAppStore } from '@/store/appStore';
import { OnboardingScreen } from '@/features/onboarding';
import { AppProviders } from './AppProviders';
import { RootNavigator } from './navigation/RootNavigator';

/** Whether the first-run explainer shows ahead of the app shell. */
export default function App() {
  const onboarded = useAppStore((s) => s.onboarded);

  return (
    <>
      <StatusBar style="dark" />
      <AppProviders>
        {env.onboardingEnabled && !onboarded ? <OnboardingScreen /> : <RootNavigator />}
      </AppProviders>
    </>
  );
}