import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeliveryHomeScreen } from '../features/home/screens/DeliveryHomeScreen';
import { AvailabilityScreen } from '../features/home/screens/AvailabilityScreen';
import { DeliveryOffersScreen } from '../features/home/screens/DeliveryOffersScreen';
import { AssignmentDetailsScreen } from '../features/home/screens/AssignmentDetailsScreen';
import { DeliveryNavigationScreen } from '../features/navigation/screens/DeliveryNavigationScreen';
import { PickupOtpScreen } from '../features/navigation/screens/PickupOtpScreen';
import { DeliveryOtpScreen } from '../features/navigation/screens/DeliveryOtpScreen';
import { WalletScreen } from '../features/wallet/screens/WalletScreen';
import { LedgerScreen } from '../features/wallet/screens/LedgerScreen';
import { PayoutRequestsScreen } from '../features/wallet/screens/PayoutRequestsScreen';
import { DeliveryNotificationsScreen } from '../features/notifications/screens/DeliveryNotificationsScreen';
import { DeliveryProfileScreen } from '../features/profile/screens/DeliveryProfileScreen';
import { DeliverySettingsScreen } from '../features/profile/screens/DeliverySettingsScreen';
import { KycScreen } from '../features/kyc/screens/KycScreen';
import { PendingVerificationScreen } from '../features/kyc/screens/PendingVerificationScreen';
import { IncentivesScreen } from '../features/home/screens/IncentivesScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Main navigator — System Design §5.1 Delivery / P2-DEL-02…05:
 * single primary Home with modal stacks (no bottom tabs).
 */
export function MainNavigator({ initialRouteName }: { initialRouteName?: keyof MainStackParamList }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="DeliveryHome" component={DeliveryHomeScreen} />
      <Stack.Screen
        name="Availability"
        component={AvailabilityScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Availability' }}
      />
      <Stack.Screen
        name="DeliveryOffers"
        component={DeliveryOffersScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Offers' }}
      />
      <Stack.Screen
        name="AssignmentDetails"
        component={AssignmentDetailsScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Assignment' }}
      />
      <Stack.Screen
        name="DeliveryNavigation"
        component={DeliveryNavigationScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Navigation' }}
      />
      <Stack.Screen
        name="PickupOtp"
        component={PickupOtpScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Pickup OTP' }}
      />
      <Stack.Screen
        name="DeliveryOtp"
        component={DeliveryOtpScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Delivery OTP' }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Wallet' }}
      />
      <Stack.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Ledger' }}
      />
      <Stack.Screen
        name="PayoutRequests"
        component={PayoutRequestsScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Payout' }}
      />
      <Stack.Screen
        name="DeliveryNotifications"
        component={DeliveryNotificationsScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Notifications' }}
      />
      <Stack.Screen
        name="DeliveryProfile"
        component={DeliveryProfileScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Profile' }}
      />
      <Stack.Screen
        name="DeliverySettings"
        component={DeliverySettingsScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Settings' }}
      />
      <Stack.Screen
        name="Kyc"
        component={KycScreen}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Screen
        name="PendingVerification"
        component={PendingVerificationScreen}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Screen
        name="Incentives"
        component={IncentivesScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
