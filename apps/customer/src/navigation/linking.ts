import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link config — Blueprint §16 / System Design §15.2 / P2-CUS-01 / P2-CUS-06.
 * Restaurant Details: `/restaurants/{restaurantId}`.
 * Orders: `/orders` · Live tracking: `/orders/{orderId}`.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://app.foodie.example', 'foodie://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'auth',
        },
      },
      ProfileCompletion: 'profile-completion',
      Main: {
        screens: {
          BrowseTab: {
            screens: {
              Home: 'restaurants',
              RestaurantDetails: 'restaurants/:restaurantId',
              Search: 'search',
              RestaurantListing: 'listing',
            },
          },
          OrdersTab: {
            screens: {
              MyOrders: 'orders',
              LiveOrderTracking: 'orders/:orderId',
            },
          },
          NotificationsTab: {
            screens: {
              Notifications: 'notifications',
            },
          },
          ProfileTab: {
            screens: {
              Profile: 'profile',
              Addresses: 'addresses',
              Settings: 'settings',
            },
          },
        },
      },
    },
  },
};
