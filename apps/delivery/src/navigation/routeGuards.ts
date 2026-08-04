import type { AuthStatus } from '../features/auth/authSlice';

/**
 * Structural auth gating — Blueprint §15.1 / P2-AUTH-03 / P2-DEL-01.
 * Main mounts only when authenticated and KYC gate cleared (isNewUser).
 * Authoritative kycStatus requires GAP-API-08 closure.
 */
export function shouldShowMainNavigator(
  authStatus: AuthStatus,
  isNewUser = false,
): boolean {
  return authStatus === 'authenticated' && !isNewUser;
}

export function shouldShowKycGate(
  authStatus: AuthStatus,
  isNewUser: boolean,
): boolean {
  return authStatus === 'authenticated' && isNewUser;
}

export function shouldShowAuthNavigator(authStatus: AuthStatus): boolean {
  return authStatus === 'unauthenticated' || authStatus === 'idle';
}
