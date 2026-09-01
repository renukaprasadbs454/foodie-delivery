import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAuthStatus } from '../features/auth/authSlice';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import type { RootStackParamList } from './types';
import { useGetRestaurantProfileQuery } from '../api/endpoints/restaurantsApi';
import { setRestaurantStatus, setRestaurantCreated } from '../features/onboarding/restaurantOnboardingSlice';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthenticatedNavigator() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching } = useGetRestaurantProfileQuery();

  React.useEffect(() => {
    if (data) {
      dispatch(setRestaurantStatus(data.status ?? null));
      if (data.restaurantId) {
        dispatch(setRestaurantCreated({ restaurantId: data.restaurantId, status: data.status }));
      }
    } else if (!isLoading && !isFetching) {
      dispatch(setRestaurantStatus(null));
    }
  }, [data, isLoading, isFetching, dispatch]);

  if (isLoading) {
    return <SplashScreen />;
  }

  const isApproved = data?.status === 'APPROVED';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isApproved ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Registration" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}

/**
 * RootNavigator — Blueprint §15.1.
 * Conditionally mounts Auth vs Main vs Onboarding stacks based on session status.
 */
export function RootNavigator() {
  const authStatus = useAppSelector(selectAuthStatus);

  if (authStatus === 'authenticating' || authStatus === 'idle') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      {authStatus === 'authenticated' ? (
        <AuthenticatedNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

