import type { AuthStatus } from '../features/auth/authSlice';
import type { RestaurantStatus } from '../features/onboarding/types';

/**
 * Structural auth + onboarding gating — Blueprint §15.1 / P2-AUTH-02 / P2-RES-01.
 * Main mounts only when authenticated and restaurant status is APPROVED.
 */
export function shouldShowMainNavigator(
  authStatus: AuthStatus,
  restaurantStatus: RestaurantStatus | null = null,
): boolean {
  return authStatus === 'authenticated' && restaurantStatus === 'APPROVED';
}

/** Authenticated but not yet APPROVED → onboarding stack. */
export function shouldShowOnboardingNavigator(
  authStatus: AuthStatus,
  restaurantStatus: RestaurantStatus | null = null,
): boolean {
  return (
    authStatus === 'authenticated' && restaurantStatus !== 'APPROVED'
  );
}

/** @deprecated Prefer shouldShowOnboardingNavigator — kept for AUTH-02 naming. */
export function shouldShowRegistrationGate(
  authStatus: AuthStatus,
  restaurantStatus: RestaurantStatus | null = null,
): boolean {
  return shouldShowOnboardingNavigator(authStatus, restaurantStatus);
}

export function shouldShowAuthNavigator(authStatus: AuthStatus): boolean {
  return authStatus === 'unauthenticated' || authStatus === 'idle';
}
