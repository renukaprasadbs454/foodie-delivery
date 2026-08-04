import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link config — Blueprint §16 / System Design §15.2 (Delivery paths).
 * OTP / Navigation screens: no deep links per UI-API.
 * `/orders/{orderId}` → AssignmentDetails.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://app.foodie.example', 'foodie-delivery://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'auth',
        },
      },
      Kyc: 'kyc',
      Main: {
        screens: {
          DeliveryHome: '',
          Availability: 'availability',
          DeliveryOffers: 'offers',
          AssignmentDetails: 'orders/:orderId',
          Wallet: 'wallet',
          DeliveryNotifications: 'notifications',
        },
      },
    },
  },
};
