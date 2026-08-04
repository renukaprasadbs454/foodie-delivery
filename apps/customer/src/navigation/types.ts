import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Navigator param lists — Blueprint §14.4 / P2-AUTH-01 / P2-CUS-01…08.
 */
export type AuthStackParamList = {
  Login: { returnTo?: string } | undefined;
  OtpVerification: { phoneNumber: string };
};

export type ReviewsScreenParams = {
  mode: 'submit' | 'list';
  orderId?: string;
  restaurantId?: string;
};

export type BrowseStackParamList = {
  Home: undefined;
  RestaurantListing: {
    search?: string;
    cuisineType?: string;
    sort?: 'name' | 'avgRating' | 'createdAt';
  };
  Search: { initialQuery?: string } | undefined;
  RestaurantDetails: { restaurantId: string };
  Menu: { restaurantId: string };
  Cart: undefined;
  Checkout: undefined;
  /** UI-API Payment — P2-CUS-05. */
  Payment: { orderId: string };
  /** UI-API Addresses — also on Profile stack; Checkout uses selectMode. */
  Addresses: { selectMode?: boolean } | undefined;
  /** UI-API Reviews — list mode from restaurant details. */
  Reviews: ReviewsScreenParams;
};

export type OrdersStackParamList = {
  MyOrders: undefined;
  OrderSuccess: { orderId: string };
  LiveOrderTracking: { orderId: string };
  /** UI-API Reviews — submit mode from delivered tracking. */
  Reviews: ReviewsScreenParams;
};

export type NotificationsStackParamList = {
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Addresses: { selectMode?: boolean } | undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  BrowseTab: NavigatorScreenParams<BrowseStackParamList> | undefined;
  OrdersTab: NavigatorScreenParams<OrdersStackParamList> | undefined;
  NotificationsTab: NavigatorScreenParams<NotificationsStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  ProfileCompletion: undefined;
  Main: undefined;
};
