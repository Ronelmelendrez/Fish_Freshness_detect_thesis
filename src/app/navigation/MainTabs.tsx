import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { ScanHomeScreen } from '@/features/scan';
import { HistoryListScreen } from '@/features/history';
import { SurveyScreen } from '@/features/survey';
import { SettingsScreen } from '@/features/settings';
import { colors } from '@/shared/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Scan: 'scan-outline',
  History: 'time-outline',
  Survey: 'list-outline',
  Settings: 'settings-outline',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Scan" component={ScanHomeScreen} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="History" component={HistoryListScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Survey" component={SurveyScreen} options={{ tabBarLabel: 'Survey' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}