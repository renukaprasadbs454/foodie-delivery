import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { selectRestaurantId } from '../features/onboarding/restaurantOnboardingSlice';
import { RestaurantRegistrationScreen } from '../features/onboarding/screens/RestaurantRegistrationScreen';
import { RestaurantDocumentsScreen } from '../features/onboarding/screens/RestaurantDocumentsScreen';
import { RestaurantImagesScreen } from '../features/onboarding/screens/RestaurantImagesScreen';
import { PendingApprovalScreen } from '../features/onboarding/screens/PendingApprovalScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * P2-RES-01 onboarding stack — Registration → Documents → Images → Pending.
 * Initial route: Pending when restaurantId known (returning PENDING session).
 */
export function OnboardingNavigator() {
  const restaurantId = useAppSelector(selectRestaurantId);
  const initialRouteName = restaurantId
    ? 'PendingApproval'
    : 'RestaurantRegistration';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: true }}
    >
      <Stack.Screen
        name="RestaurantRegistration"
        component={RestaurantRegistrationScreen}
        options={{ title: 'Registration' }}
      />
      <Stack.Screen
        name="RestaurantDocuments"
        component={RestaurantDocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <Stack.Screen
        name="RestaurantImages"
        component={RestaurantImagesScreen}
        options={{ title: 'Images' }}
      />
      <Stack.Screen
        name="PendingApproval"
        component={PendingApprovalScreen}
        options={{ title: 'Pending approval' }}
      />
    </Stack.Navigator>
  );
}
