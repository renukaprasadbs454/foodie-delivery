import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeliveryZoneScreen } from '@/features/kyc/screens/DeliveryZoneScreen';
import { KycScreen } from '@/features/kyc/screens/KycScreen';
import { PendingVerificationScreen } from '@/features/kyc/screens/PendingVerificationScreen';
import type { KycStackParamList } from './types';

const Stack = createNativeStackNavigator<KycStackParamList>();

/**
 * P2-DEL-01 KYC stack — DeliveryZone → KycForm → PendingVerification.
 * Mounted at root when authenticated isNewUser (P2-AUTH-03 gate).
 */
export function KycNavigator({ initialRouteName }: { initialRouteName?: keyof KycStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName || 'DeliveryZone'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="DeliveryZone"
        component={DeliveryZoneScreen}
        options={{ title: 'Delivery Zone', headerShown: false }}
      />
      <Stack.Screen
        name="KycForm"
        component={KycScreen}
        options={{ title: 'KYC & Profile', headerShown: false }}
      />
      <Stack.Screen
        name="PendingVerification"
        component={PendingVerificationScreen}
        options={{ title: 'Pending verification', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
