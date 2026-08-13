import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link config — Direct Dashboard mapping for development flow.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://app.foodie.example', 'foodie-restaurant://'],
  config: {
    initialRouteName: 'Main',
    screens: {
      Main: {
        path: '',
        screens: {
          DashboardTab: {
            path: '',
            screens: {
              Dashboard: 'dashboard',
            },
          },
          OrdersTab: {
            screens: {
              IncomingOrders: 'orders',
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
      Auth: {
        screens: {
          Login: 'auth',
        },
      },
      Registration: 'registration',
    },
  },
};
