import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import {
  selectAuthStatus,
  selectIsNewUser,
} from '../features/auth/authSlice';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { KycNavigator } from './KycNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import {
  shouldShowKycGate,
  shouldShowMainNavigator,
} from './routeGuards';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth-gated root — Blueprint §14.2 / System Design §5.2 / P2-AUTH-03 / P2-DEL-01.
 * No flash of Main while idle/authenticating or when isNewUser (KYC gate).
 * kycStatus read remains GAP-API-08 — isNewUser is the Partial gate.
 */
export function RootNavigator() {
  const authStatus = useAppSelector(selectAuthStatus);
  const isNewUser = useAppSelector(selectIsNewUser);

  if (authStatus === 'authenticating' || authStatus === 'idle') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowMainNavigator(authStatus, isNewUser) ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : shouldShowKycGate(authStatus, isNewUser) ? (
          <Stack.Screen name="Kyc" component={KycNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
