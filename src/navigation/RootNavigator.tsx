import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '@/store/hooks';
import { selectAuthStatus, selectIsNewUser } from '@/features/auth/authSlice';
import { SplashScreen } from '@/features/auth/screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { useGetDeliveryProfileQuery } from '@/api/endpoints/deliveryApi';
import type { RootStackParamList, MainStackParamList } from './types';
import { KycNavigator } from './KycNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const authStatus = useAppSelector(selectAuthStatus);
  const isNewUser = useAppSelector(selectIsNewUser);

  // Conditionally fetch profile only when authenticated, with 3s polling for live KYC status updates
  const profileQuery = useGetDeliveryProfileQuery(undefined, {
    skip: authStatus !== 'authenticated',
    pollingInterval: 3000,
  });

  if (authStatus === 'authenticating' || authStatus === 'idle') {
    return <SplashScreen />;
  }

  // Wait for profile query to initialize and finish its first fetch
  if (authStatus === 'authenticated' && (profileQuery.isLoading || profileQuery.isFetching || profileQuery.isUninitialized)) {
    if (!profileQuery.data) {
      return <SplashScreen />;
    }
  }

  let flow: 'auth' | 'kyc' | 'main' = 'auth';
  let initialRouteName: any = undefined;

  if (authStatus === 'authenticated' && profileQuery.data) {
    const kycStatus = profileQuery.data.kycStatus;
    const hasUploadedDocs = profileQuery.data.documents && profileQuery.data.documents.length >= 3;
    const hasProfileImage = !!profileQuery.data.profileImageUrl;
    const hasName = !!profileQuery.data.fullName && profileQuery.data.fullName !== 'Delivery Partner';

    if (kycStatus !== 'VERIFIED') {
      flow = 'kyc';
      if (hasUploadedDocs && hasProfileImage && hasName) {
        initialRouteName = 'PendingVerification';
      } else {
        initialRouteName = 'Kyc';
      }
    } else {
      flow = 'main';
      initialRouteName = 'DeliveryHome';
    }
  } else if (authStatus === 'authenticated') {
      // In case we are still authenticated but no data yet (e.g. error) we fallback
      // Don't default to main for new users
      flow = isNewUser ? 'kyc' : 'main';
      if (flow === 'kyc') {
        initialRouteName = 'Kyc';
      }
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {flow === 'main' ? (
          <Stack.Screen name="Main">
            {(props) => <MainNavigator {...props} initialRouteName={initialRouteName} />}
          </Stack.Screen>
        ) : flow === 'kyc' ? (
          <Stack.Screen name="Kyc">
            {(props) => <KycNavigator {...props} initialRouteName={initialRouteName} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
