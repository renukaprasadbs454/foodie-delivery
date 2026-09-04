/**
 * Environment configuration — no secrets in git.
 * Backend URL is server-only for BFF handlers (Impl Guide §4.1 / SD §9.4).
 */
export const ENV = {
  /** Server-only. Used by app/api BFF routes — never expose via NEXT_PUBLIC. */
  apiBaseUrl:
    process.env.FOODIE_API_BASE_URL ?? 'https://api.foodie.kwiko.org',
  /** Client RTK Query hits same-origin BFF. */
  bffBaseUrl: '' as const,
  wsUrl:
    process.env.NEXT_PUBLIC_WS_URL ?? 'wss://api.foodie.kwiko.org/ws',
  cookieSecure: process.env.FOODIE_COOKIE_SECURE === 'true',
  appName: 'foodie-admin',
  appVersion: '0.1.0',
} as const;
