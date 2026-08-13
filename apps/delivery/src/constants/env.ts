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

import { Platform } from 'react-native';

let devHost = 'localhost';
if (Platform.OS === 'web') {
  devHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
} else if (__DEV__ && Constants.expoConfig?.hostUri) {
  devHost = Constants.expoConfig.hostUri.split(':')[0];
}

const dynamicApiUrl = `http://${devHost}:8080`;
const dynamicWsUrl = `ws://${devHost}:8080/ws/websocket`;

export const ENV = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (__DEV__ ? dynamicApiUrl : extra.apiBaseUrl) ??
    'https://api.foodie.example.com',
  wsUrl:
    process.env.EXPO_PUBLIC_WS_URL ??
    (__DEV__ ? dynamicWsUrl : extra.wsUrl) ??
    'https://api.foodie.example.com/ws',
  appName: 'foodie-delivery',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;
