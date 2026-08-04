import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { selectAuthStatus } from '../features/auth/authSlice';
import { selectRestaurantOnboardingStatus } from '../features/onboarding/restaurantOnboardingSlice';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import {
  shouldShowMainNavigator,
  shouldShowOnboardingNavigator,
} from './routeGuards';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth-gated root — Blueprint §14.2 / System Design §5.2 / P2-AUTH-02 / P2-RES-01.
 * Main only when restaurant.status === APPROVED (not merely !isNewUser).
 */
export function RootNavigator() {
  const authStatus = useAppSelector(selectAuthStatus);
  const restaurantStatus = useAppSelector(selectRestaurantOnboardingStatus);

  if (authStatus === 'authenticating' || authStatus === 'idle') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowMainNavigator(authStatus, restaurantStatus) ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : shouldShowOnboardingNavigator(authStatus, restaurantStatus) ? (
          <Stack.Screen name="Registration" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
