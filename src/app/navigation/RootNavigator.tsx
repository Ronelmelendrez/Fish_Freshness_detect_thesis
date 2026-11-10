import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { EyeScanScreen, SkinScanScreen } from '@/features/scan';
import { ResultScreen } from '@/features/results';
import { HistoryDetailScreen } from '@/features/history';
import { OnboardingScreen } from '@/features/onboarding';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerBackTitle: 'Back', headerTintColor: '#0B7261' }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EyeScan" component={EyeScanScreen} options={{ title: 'Eye scan' }} />
      <Stack.Screen name="SkinScan" component={SkinScanScreen} options={{ title: 'Skin scan' }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result' }} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} options={{ title: 'Scan details' }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}