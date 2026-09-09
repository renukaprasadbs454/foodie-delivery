import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Environment configuration — no secrets in git.
 * Set EXPO_PUBLIC_API_URL / EXPO_PUBLIC_WS_URL via app config or env.
 */
type Extra = {
  apiBaseUrl?: string;
  wsUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const getApiUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && __DEV__) {
    // In web dev mode, use relative URL so Metro's proxy middleware handles CORS
    return '';
  }
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  if (extra.apiBaseUrl) {
    return extra.apiBaseUrl;
  }
  return 'https://api.foodie.kwiko.org';
};

const getWsUrl = (): string => {
  const envWs = process.env.EXPO_PUBLIC_WS_URL;
  if (envWs) {
    return envWs;
  }
  if (extra.wsUrl) {
    return extra.wsUrl;
  }
  return 'wss://api.foodie.kwiko.org/ws';
};

export const ENV = {
  apiBaseUrl: getApiUrl(),
  wsUrl: getWsUrl(),
  appName: 'foodie-delivery',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;

if (__DEV__) {
  console.log('[Foodie Delivery Env] Target API Base URL:', ENV.apiBaseUrl);
}

