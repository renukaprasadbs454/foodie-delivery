/**
 * Branded token types — Blueprint §12.4 / System Design §26.3.
 * Distinct from bare string so logging/analytics/crash paths can be lint-flagged.
 */
export type AccessToken = string & { readonly __brand: 'AccessToken' };
export type RefreshToken = string & { readonly __brand: 'RefreshToken' };

export function asAccessToken(value: string): AccessToken {
  return value as AccessToken;
}

export function asRefreshToken(value: string): RefreshToken {
  return value as RefreshToken;
}

export type TokenPair = {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
};
