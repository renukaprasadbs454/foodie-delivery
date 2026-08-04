import type { AuthStatus } from '../features/auth/authSlice';

/**
 * Structural auth gating helpers — Blueprint §15.1 / P2-AUTH-01.
 * MainNavigator mounts only when authenticated and profile gate cleared.
 */
export function shouldShowMainNavigator(
  authStatus: AuthStatus,
  isNewUser = false,
): boolean {
  return authStatus === 'authenticated' && !isNewUser;
}

export function shouldShowProfileCompletion(
  authStatus: AuthStatus,
  isNewUser: boolean,
): boolean {
  return authStatus === 'authenticated' && isNewUser;
}

export function shouldShowAuthNavigator(authStatus: AuthStatus): boolean {
  return authStatus === 'unauthenticated' || authStatus === 'idle';
}
