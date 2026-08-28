import type { AuthStatus } from '../features/auth/authSlice';
import type { RestaurantStatus } from '../features/onboarding/types';

/**
 * Structural auth + onboarding gating — Blueprint §15.1 / P2-AUTH-02 / P2-RES-01.
 */
export function shouldShowMainNavigator(
  authStatus?: AuthStatus,
  restaurantStatus?: RestaurantStatus | null,
  _isNewUser = false,
): boolean {
  if (authStatus !== 'authenticated') {
    return false;
  }
  return restaurantStatus === 'APPROVED';
}

/** Authenticated but not yet APPROVED → onboarding stack. */
export function shouldShowOnboardingNavigator(
  authStatus?: AuthStatus,
  restaurantStatus?: RestaurantStatus | null,
  isNewUser = false,
): boolean {
  if (authStatus !== 'authenticated') {
    return false;
  }
  return isNewUser || restaurantStatus !== 'APPROVED';
}

/** @deprecated Prefer shouldShowOnboardingNavigator — kept for AUTH-02 naming. */
export function shouldShowRegistrationGate(
  authStatus?: AuthStatus,
  restaurantStatus?: RestaurantStatus | null,
  isNewUser = false,
): boolean {
  return shouldShowOnboardingNavigator(authStatus, restaurantStatus, isNewUser);
}

export function shouldShowAuthNavigator(authStatus?: AuthStatus): boolean {
  return authStatus === 'unauthenticated';
}

