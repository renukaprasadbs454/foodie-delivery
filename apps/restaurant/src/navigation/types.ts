/**
 * Navigator param lists — Blueprint §14.4 / System Design §5.1 Restaurant /
 * P2-AUTH-02 / P2-RES-01…04.
 */
export type AuthStackParamList = {
  Login: { returnTo?: string } | undefined;
};

export type OnboardingStackParamList = {
  RestaurantRegistration: undefined;
  RestaurantDocuments: undefined;
  RestaurantImages: undefined;
  PendingApproval: undefined;
};

export type OrdersStackParamList = {
  Dashboard: undefined;
  IncomingOrders: undefined;
  RestaurantOrderDetails: { orderId: string };
};

export type MenuStackParamList = {
  Categories: undefined;
  MenuItems: { categoryId?: string } | undefined;
  Variants: { menuItemId: string };
};

export type ReviewsStackParamList = {
  RestaurantReviews: undefined;
};

export type ProfileStackParamList = {
  RestaurantProfile: undefined;
  RestaurantSettings: undefined;
  RestaurantDocuments: undefined;
  RestaurantImages: undefined;
  PendingApproval: undefined;
  /**
   * Deep-link target for /notifications — System Design §15.2.
   * P2-RES-05 Gap-blocked shell (GAP-IA-02) — no invent inbox.
   */
  NotificationsHome: undefined;
};

export type MainTabParamList = {
  OrdersTab: undefined;
  MenuTab: undefined;
  ReviewsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Registration: undefined;
  Main: undefined;
};
