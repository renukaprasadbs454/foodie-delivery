import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Environment configuration — no secrets in git.
 * Set EXPO_PUBLIC_API_BASE_URL / EXPO_PUBLIC_WS_URL via app config or env.
 */
type Extra = {
  apiBaseUrl?: string;
  wsUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

let devHost = '127.0.0.1';
if (Platform.OS === 'web') {
  devHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
} else if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    devHost = scriptURL.split('://')[1].split(':')[0];
  } else if (Constants.expoConfig?.hostUri) {
    devHost = Constants.expoConfig.hostUri.split(':')[0];
  }
}

export const ENV = {
  apiBaseUrl: __DEV__
    ? `http://${devHost}:8080`
    : (process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? 'http://localhost:8080'),
  wsUrl: __DEV__
    ? `ws://${devHost}:8080/ws/websocket`
    : (process.env.EXPO_PUBLIC_WS_URL ?? extra.wsUrl ?? 'http://localhost:8080/ws'),
  appName: 'foodie-restaurant',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;
