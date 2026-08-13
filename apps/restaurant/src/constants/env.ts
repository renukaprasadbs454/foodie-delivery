import Constants from 'expo-constants';

/**
 * Environment configuration — no secrets in git.
 * Set EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_WS_URL via app config or env.
 */
type Extra = {
  apiBaseUrl?: string;
  wsUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const ENV = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.apiBaseUrl ??
    'http://localhost:8080',
  wsUrl:
    process.env.EXPO_PUBLIC_WS_URL ??
    extra.wsUrl ??
    'http://localhost:8080/ws',
  appName: 'foodie-restaurant',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;
