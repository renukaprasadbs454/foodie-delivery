import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Environment configuration — no secrets in git.
 * Set EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_WS_URL via app config or env.
 */
type Extra = {
  apiBaseUrl?: string;
  wsUrl?: string;
  googleWebClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

// Dynamically resolve local IP for Expo Go any-WiFi support
let hostIp = '127.0.0.1';
if (Platform.OS === 'web') {
  hostIp = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
} else if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    hostIp = scriptURL.split('://')[1].split(':')[0];
  } else if (Constants.expoConfig?.hostUri) {
    hostIp = Constants.expoConfig.hostUri.split(':')[0];
  } else if ((Constants as any).manifest2?.extra?.expoGo?.debuggerHost) {
    hostIp = (Constants as any).manifest2.extra.expoGo.debuggerHost.split(':')[0];
  }
}

const defaultApiBaseUrl = 'https://api.foodie.kwiko.org';
const defaultWsUrl = 'wss://api.foodie.kwiko.org/ws';

export const ENV = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? defaultApiBaseUrl,
  wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? extra.wsUrl ?? defaultWsUrl,
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    extra.googleWebClientId ??
    '',
  appName: 'foodie-customer',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;

if (__DEV__) {
  console.log('[Foodie Env] Target API Base URL:', ENV.apiBaseUrl);
}
