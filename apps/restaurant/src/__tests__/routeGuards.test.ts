import {
  shouldShowAuthNavigator,
  shouldShowMainNavigator,
  shouldShowOnboardingNavigator,
  shouldShowRegistrationGate,
} from '../navigation/routeGuards';

describe('routeGuards (P2-AUTH-02 / P2-RES-01)', () => {
  it('shows Main only when authenticated and APPROVED', () => {
    expect(shouldShowMainNavigator('authenticated', 'APPROVED')).toBe(true);
    expect(shouldShowMainNavigator('authenticated', 'PENDING')).toBe(false);
    expect(shouldShowMainNavigator('authenticated', null)).toBe(false);
    expect(shouldShowMainNavigator('unauthenticated', 'APPROVED')).toBe(false);
    expect(shouldShowMainNavigator('idle')).toBe(false);
  });

  it('shows Onboarding when authenticated and not APPROVED', () => {
    expect(shouldShowOnboardingNavigator('authenticated', null)).toBe(true);
    expect(shouldShowOnboardingNavigator('authenticated', 'PENDING')).toBe(
      true,
    );
    expect(shouldShowOnboardingNavigator('authenticated', 'APPROVED')).toBe(
      false,
    );
    expect(shouldShowRegistrationGate('authenticated', 'PENDING')).toBe(true);
  });

  it('shows Auth when unauthenticated or idle', () => {
    expect(shouldShowAuthNavigator('unauthenticated')).toBe(true);
    expect(shouldShowAuthNavigator('idle')).toBe(true);
    expect(shouldShowAuthNavigator('authenticated')).toBe(false);
  });
});
