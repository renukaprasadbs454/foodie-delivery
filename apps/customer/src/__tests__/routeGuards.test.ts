import {
  shouldShowAuthNavigator,
  shouldShowMainNavigator,
  shouldShowProfileCompletion,
} from '../navigation/routeGuards';

describe('routeGuards (P2-AUTH-01)', () => {
  it('shows Main only when authenticated and not isNewUser', () => {
    expect(shouldShowMainNavigator('authenticated', false)).toBe(true);
    expect(shouldShowMainNavigator('authenticated', true)).toBe(false);
    expect(shouldShowMainNavigator('unauthenticated')).toBe(false);
    expect(shouldShowMainNavigator('idle')).toBe(false);
  });

  it('shows ProfileCompletion when authenticated isNewUser', () => {
    expect(shouldShowProfileCompletion('authenticated', true)).toBe(true);
    expect(shouldShowProfileCompletion('authenticated', false)).toBe(false);
  });

  it('shows Auth when unauthenticated or idle', () => {
    expect(shouldShowAuthNavigator('unauthenticated')).toBe(true);
    expect(shouldShowAuthNavigator('idle')).toBe(true);
    expect(shouldShowAuthNavigator('authenticated')).toBe(false);
  });
});
