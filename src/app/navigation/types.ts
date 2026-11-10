/** Root stack + main-tab param lists, used by every screen for typed navigation. */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  EyeScan: undefined;
  SkinScan: undefined;
  Result: undefined;
  HistoryDetail: { entryId: string };
  Onboarding: undefined;
};

type MainTabParamList = {
  Scan: undefined;
  History: undefined;
  Survey: undefined;
  Settings: undefined;
};

/** Props available to any screen that can reach the whole stack+tab tree. */
type AppScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
type ScanTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Scan'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type { RootStackParamList, MainTabParamList, AppScreenProps, ScanTabScreenProps };