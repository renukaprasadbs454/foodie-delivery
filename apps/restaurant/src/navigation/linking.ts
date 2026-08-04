import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link config — Blueprint §16 / System Design §15.2 (Restaurant paths).
 * Login: no deep link per UI-API.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://app.foodie.example', 'foodie-restaurant://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'auth',
        },
      },
      Registration: 'registration',
      Main: {
        screens: {
          OrdersTab: {
            screens: {
              Dashboard: 'orders',
              IncomingOrders: 'orders/queue',
              RestaurantOrderDetails: 'orders/:orderId',
            },
          },
          MenuTab: {
            screens: {
              Categories: 'menu',
              MenuItems: 'menu/items',
              Variants: 'menu/items/:menuItemId/variants',
            },
          },
          ReviewsTab: {
            screens: {
              RestaurantReviews: 'reviews',
            },
          },
          ProfileTab: {
            screens: {
              RestaurantProfile: 'profile',
              RestaurantSettings: 'settings',
              NotificationsHome: 'notifications',
            },
          },
        },
      },
    },
  },
};
