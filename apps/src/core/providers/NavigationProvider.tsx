import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Navigation-adjacent providers — SafeArea for React Navigation.
 * NavigationContainer lives in RootNavigator (auth-gated).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NavigationProvider({ children }: { children: any }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
