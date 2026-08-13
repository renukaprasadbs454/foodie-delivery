/**
 * Navigator param lists — Blueprint §14.4 / System Design §5.1 Delivery /
 * P2-AUTH-03 / P2-DEL-01…05.
 */
import type { NavigationLeg } from '../features/navigation/types';

export type AuthStackParamList = {
  Login: { returnTo?: string } | undefined;
};

/** KYC stack — UI-API routes `Kyc` | `PendingVerification`. */
export type KycStackParamList = {
  Kyc: undefined;
  PendingVerification: undefined;
};

/**
 * Main stack — System Design §5.1 Delivery:
 * Home is primary; Assignment / Navigation / Wallet are modal stacks.
 */
export type MainStackParamList = {
  DeliveryHome: undefined;
  Availability: undefined;
  DeliveryOffers: undefined;
  /**
   * assignmentId optional for deep-link `/orders/{orderId}` (UI-API only
   * provides orderId in the URL).
   */
  AssignmentDetails: { orderId: string; assignmentId?: string };
  /** UI-API `DeliveryNavigation` — situational map + OS handoff + pings. */
  DeliveryNavigation: {
    orderId: string;
    assignmentId: string;
    leg: NavigationLeg;
  };
  PickupOtp: { assignmentId: string; orderId: string };
  DeliveryOtp: { assignmentId: string; orderId: string };
  /** Deep-link target for /wallet. */
  Wallet: undefined;
  Ledger: undefined;
  PayoutRequests: undefined;
  /** Deep-link target for /notifications — UI-API `DeliveryNotifications`. */
  DeliveryNotifications: undefined;
  DeliveryProfile: undefined;
  DeliverySettings: undefined;
  Kyc: undefined;
  PendingVerification: undefined;
  Incentives: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  /** Hosts KycNavigator while isNewUser (GAP-API-08 until kycStatus readable). */
  Kyc: undefined;
  Main: undefined;
};
