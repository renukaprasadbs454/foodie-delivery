import {
  ACCESS_TOKEN_COOKIE,
  AUTH_COOKIE_SECURITY,
  REFRESH_TOKEN_COOKIE,
  buildAuthSetCookieHeaders,
  buildClearAuthSetCookieHeaders,
  readAccessTokenFromCookieHeader,
  readRefreshTokenFromCookieHeader,
} from '../auth/cookieHelpers';

describe('cookieHelpers', () => {
  it('enforces httpOnly Secure SameSite=Strict defaults', () => {
    expect(AUTH_COOKIE_SECURITY).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      clientReadable: false,
    });
  });

  it('builds Set-Cookie headers for access and refresh tokens', () => {
    const headers = buildAuthSetCookieHeaders({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    expect(headers).toHaveLength(2);
    expect(headers[0]).toContain(`${ACCESS_TOKEN_COOKIE}=access-1`);
    expect(headers[0]).toContain('HttpOnly');
    expect(headers[0]).toContain('Secure');
    expect(headers[0]).toContain('SameSite=Strict');
    expect(headers[1]).toContain(`${REFRESH_TOKEN_COOKIE}=refresh-1`);
  });

  it('builds clear cookies with Max-Age=0', () => {
    const headers = buildClearAuthSetCookieHeaders();
    expect(headers[0]).toContain('Max-Age=0');
    expect(headers[1]).toContain('Max-Age=0');
  });

  it('reads tokens from Cookie request header (server-side)', () => {
    const header = `${ACCESS_TOKEN_COOKIE}=abc; ${REFRESH_TOKEN_COOKIE}=xyz`;
    expect(readAccessTokenFromCookieHeader(header)).toBe('abc');
    expect(readRefreshTokenFromCookieHeader(header)).toBe('xyz');
  });
});
