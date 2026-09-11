import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KycScreen } from '@/features/kyc/screens/KycScreen';
import { PendingVerificationScreen } from '@/features/kyc/screens/PendingVerificationScreen';
import type { KycStackParamList } from './types';

const Stack = createNativeStackNavigator<KycStackParamList>();

/**
 * P2-DEL-01 KYC stack — Kyc → PendingVerification.
 * Mounted at root when authenticated isNewUser (P2-AUTH-03 gate).
 */
export function KycNavigator({ initialRouteName }: { initialRouteName?: keyof KycStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName || "Kyc"}
      screenOptions={{ headerShown: true }}
    >
      <Stack.Screen
        name="Kyc"
        component={KycScreen}
        options={{ title: 'KYC', headerShown: false }}
      />
      <Stack.Screen
        name="PendingVerification"
        component={PendingVerificationScreen}
        options={{ title: 'Pending verification', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
