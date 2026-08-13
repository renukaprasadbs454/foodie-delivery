import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import {
  selectAuthStatus,
  selectIsNewUser,
} from '../features/auth/authSlice';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { useGetDeliveryProfileQuery } from '../api/endpoints/deliveryApi';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const authStatus = useAppSelector(selectAuthStatus);

  // Conditionally fetch profile only when authenticated
  const profileQuery = useGetDeliveryProfileQuery(undefined, {
    skip: authStatus !== 'authenticated',
  });

  if (authStatus === 'authenticating' || authStatus === 'idle') {
    return <SplashScreen />;
  }

  // If authenticated but profile hasn't loaded yet, show Splash to prevent flashing
  if (authStatus === 'authenticated' && profileQuery.isLoading) {
    return <SplashScreen />;
  }

  // Strict KYC constraint: Must have all 3 REQUIRED_DOCS uploaded to bypass KYC block
  const hasUploadedDocs = profileQuery.data?.documents && profileQuery.data.documents.length >= 3;

  const initialRouteName = !hasUploadedDocs
    ? 'Kyc'
    : (profileQuery.data?.kycStatus === 'PENDING' || profileQuery.data?.kycStatus === 'REJECTED')
      ? 'PendingVerification'
      : 'DeliveryHome';

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authStatus === 'authenticated' ? (
          <Stack.Screen name="Main">
            {(props) => <MainNavigator {...props} initialRouteName={initialRouteName} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
