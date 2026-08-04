/**
 * httpOnly cookie helpers for Admin BFF route handlers.
 * Blueprint §12.1 / System Design §7.1 / §9.4 / §26.4.
 *
 * Browser JS must NEVER read these cookies. Helpers are for Next.js
 * server route handlers / middleware only.
 */

export const ACCESS_TOKEN_COOKIE = 'foodie_access_token';
export const REFRESH_TOKEN_COOKIE = 'foodie_refresh_token';

export type AuthCookieOptions = {
  /** Defaults true in production; overridable for local http. */
  secure?: boolean;
  /**
   * Max-Age seconds. Access token ~15 minutes per platform JWT lifetime.
   * Refresh lifetime is server-defined; BFF should align with backend.
   */
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
};

export type AuthCookiePair = {
  accessToken: string;
  refreshToken: string;
};

const DEFAULT_OPTIONS: Required<
  Pick<AuthCookieOptions, 'secure' | 'path' | 'sameSite' | 'httpOnly'>
> = {
  secure: true,
  path: '/',
  sameSite: 'strict',
  httpOnly: true,
};

function serializeCookie(
  name: string,
  value: string,
  options: AuthCookieOptions = {},
): string {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${merged.path}`,
    `SameSite=${capitalizeSameSite(merged.sameSite)}`,
  ];
  if (merged.httpOnly) parts.push('HttpOnly');
  if (merged.secure) parts.push('Secure');
  if (typeof merged.maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${merged.maxAgeSeconds}`);
  }
  return parts.join('; ');
}

function capitalizeSameSite(
  value: 'strict' | 'lax' | 'none',
): 'Strict' | 'Lax' | 'None' {
  if (value === 'lax') return 'Lax';
  if (value === 'none') return 'None';
  return 'Strict';
}

/** Build Set-Cookie header values for access + refresh tokens. */
export function buildAuthSetCookieHeaders(
  tokens: AuthCookiePair,
  options?: {
    access?: AuthCookieOptions;
    refresh?: AuthCookieOptions;
  },
): string[] {
  return [
    serializeCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      maxAgeSeconds: 15 * 60,
      ...options?.access,
    }),
    serializeCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      // Refresh lifetime is backend-owned; long-lived default for cookie jar only.
      maxAgeSeconds: 60 * 60 * 24 * 30,
      ...options?.refresh,
    }),
  ];
}

/** Build Set-Cookie headers that clear auth cookies. */
export function buildClearAuthSetCookieHeaders(
  options?: AuthCookieOptions,
): string[] {
  const clearOpts: AuthCookieOptions = {
    ...options,
    maxAgeSeconds: 0,
  };
  return [
    serializeCookie(ACCESS_TOKEN_COOKIE, '', clearOpts),
    serializeCookie(REFRESH_TOKEN_COOKIE, '', clearOpts),
  ];
}

/** Parse a Cookie request header for a named value (server-side only). */
export function readCookieValue(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === name) {
      return decodeURIComponent(rest.join('=') || '');
    }
  }
  return null;
}

export function readAccessTokenFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | null {
  return readCookieValue(cookieHeader, ACCESS_TOKEN_COOKIE);
}

export function readRefreshTokenFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | null {
  return readCookieValue(cookieHeader, REFRESH_TOKEN_COOKIE);
}

/**
 * Binding cookie attribute checklist for Admin BFF.
 * System Design §7.1 / §26.4 — httpOnly, Secure, SameSite=Strict.
 */
export const AUTH_COOKIE_SECURITY = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  /** Browser JS must never access token cookies. */
  clientReadable: false,
};
