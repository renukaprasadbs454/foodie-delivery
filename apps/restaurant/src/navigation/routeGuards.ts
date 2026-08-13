import type { AuthStatus } from '../features/auth/authSlice';
import type { RestaurantStatus } from '../features/onboarding/types';

/**
 * Structural auth + onboarding gating — Blueprint §15.1 / P2-AUTH-02 / P2-RES-01.
 * DEV BYPASS: Directly open MainNavigator (Dashboard) as the primary screen.
 */
export function shouldShowMainNavigator(
  _authStatus?: AuthStatus,
  _restaurantStatus?: RestaurantStatus | null,
  _isNewUser = false,
): boolean {
  return true;
}

/** Authenticated but not yet APPROVED → onboarding stack. */
export function shouldShowOnboardingNavigator(
  _authStatus?: AuthStatus,
  _restaurantStatus?: RestaurantStatus | null,
  _isNewUser = false,
): boolean {
  return false;
}

/** @deprecated Prefer shouldShowOnboardingNavigator — kept for AUTH-02 naming. */
export function shouldShowRegistrationGate(
  _authStatus?: AuthStatus,
  _restaurantStatus?: RestaurantStatus | null,
  _isNewUser = false,
): boolean {
  return false;
}

export function shouldShowAuthNavigator(_authStatus?: AuthStatus): boolean {
  return false;
}
