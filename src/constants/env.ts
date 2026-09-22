/// <reference types="node" />
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Dynamic Environment Configuration for Foodie Delivery
 * 
 * Rules:
 * - Public configuration (API URLs, app metadata) is injected via EXPO_PUBLIC_* or app.config.ts extra.
 * - Private backend secrets (API keys, JWT secrets, payment secrets) must NEVER be exposed as EXPO_PUBLIC_*
 *   variables or bundled into client binaries.
 */

type AppExtra = {
  apiBaseUrl?: string;
  wsUrl?: string;
  appEnv?: string;
  eas?: {
    projectId?: string;
  };
};

interface LegacyExpoConstants {
  manifest?: { extra?: AppExtra };
  manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
}

const legacyConstants = Constants as unknown as LegacyExpoConstants;

const extra = (Constants.expoConfig?.extra ?? legacyConstants.manifest?.extra ?? {}) as AppExtra;

function resolveDevHost(): string {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
  }
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const parts = scriptURL.split('://');
    if (parts[1]) {
      return parts[1].split(':')[0];
    }
  }
  if (Constants.expoConfig?.hostUri) {
    return Constants.expoConfig.hostUri.split(':')[0];
  }
  const debuggerHost = legacyConstants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  // Android emulator loopback alias to host machine
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  // 1. Explicit environment variable (injected at build time or via .env)
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeUrl(envUrl.trim());
  }

  // 2. Extra config provided by app.config.ts / EAS Build
  if (extra.apiBaseUrl && extra.apiBaseUrl.trim()) {
    return normalizeUrl(extra.apiBaseUrl.trim());
  }

  // 3. Web runtime same-origin default
  if (Platform.OS === 'web') {
    return '';
  }

  // 4. Local development fallback
  const devHost = resolveDevHost();
  return `http://${devHost}:8082`;
}

function resolveWsUrl(apiBase: string): string {
  const envWs = process.env.EXPO_PUBLIC_WS_URL;
  if (envWs && envWs.trim()) {
    return normalizeUrl(envWs.trim());
  }

  if (extra.wsUrl && extra.wsUrl.trim()) {
    return normalizeUrl(extra.wsUrl.trim());
  }

  if (apiBase.startsWith('https://')) {
    return `${apiBase.replace(/^https:\/\//, 'wss://')}/ws`;
  }
  if (apiBase.startsWith('http://')) {
    return `${apiBase.replace(/^http:\/\//, 'ws://')}/ws`;
  }
  return `ws://${resolveDevHost()}:8082/ws`;
}

const computedApiBaseUrl = resolveApiBaseUrl();
const computedWsUrl = resolveWsUrl(computedApiBaseUrl);

export const ENV = {
  apiBaseUrl: computedApiBaseUrl,
  wsUrl: computedWsUrl,
  appEnv: process.env.APP_ENV || extra.appEnv || (__DEV__ ? 'development' : 'production'),
  appName: Constants.expoConfig?.name ?? 'foodie-delivery',
  appVersion: Constants.expoConfig?.version ?? '0.1.0',
} as const;

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[Foodie Delivery Env] Dynamic API Base URL:', ENV.apiBaseUrl);
  console.log('[Foodie Delivery Env] Dynamic WebSocket URL:', ENV.wsUrl);
  console.log('[Foodie Delivery Env] Target Environment:', ENV.appEnv);
}
