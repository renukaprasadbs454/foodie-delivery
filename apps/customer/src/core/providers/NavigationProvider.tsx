import React, { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Navigation-adjacent providers — SafeArea for React Navigation.
 * NavigationContainer lives in RootNavigator (auth-gated).
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
