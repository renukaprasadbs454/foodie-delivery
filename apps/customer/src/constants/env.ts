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
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    hostIp = scriptURL.split('://')[1].split(':')[0];
  } else {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      hostIp = hostUri.split(':')[0];
    }
  }
}

const defaultApiBaseUrl = __DEV__ ? `http://${hostIp}:8080` : 'https://api.foodie.example.com';
const defaultWsUrl = __DEV__ ? `ws://${hostIp}:8080/ws/websocket` : 'wss://api.foodie.example.com/ws';

export const ENV = {
  apiBaseUrl: __DEV__
    ? defaultApiBaseUrl
    : (process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? defaultApiBaseUrl),
  wsUrl: __DEV__
    ? defaultWsUrl
    : (process.env.EXPO_PUBLIC_WS_URL ?? extra.wsUrl ?? defaultWsUrl),
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    extra.googleWebClientId ??
    '',
  appName: 'foodie-customer',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;
