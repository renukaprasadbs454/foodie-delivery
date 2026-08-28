import * as SecureStore from 'expo-secure-store';
import { asRefreshToken, type RefreshToken } from '../types/tokens';

/**
 * Secure storage for refresh tokens — Blueprint §12 / System Design §7.1.
 * Native: expo-secure-store only (Keychain / Keystore). Never AsyncStorage on native.
 * Web: expo-secure-store is unsupported — localStorage bridge so auth bootstrap works in browser.
 *
 * Platform detection avoids importing `react-native` here (keeps Jest/node suites loadable).
 */

export const REFRESH_TOKEN_STORAGE_KEY = 'foodie.auth.refreshToken';

export type SecureStorageAdapter = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

function isWebRuntime(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { document?: unknown }).document !== 'undefined'
  );
}

type GlobalWithLocalStorage = typeof globalThis & {
  localStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

/** Web-only fallback — not a Keychain equivalent; documented limitation for Expo Web. */
const webLocalStorageAdapter: SecureStorageAdapter = {
  getItemAsync: async (key) => {
    try {
      return (globalThis as GlobalWithLocalStorage).localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItemAsync: async (key, value) => {
    try {
      (globalThis as GlobalWithLocalStorage).localStorage?.setItem(key, value);
    } catch {
      /* quota / private mode — ignore */
    }
  },
  deleteItemAsync: async (key) => {
    try {
      (globalThis as GlobalWithLocalStorage).localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

const nativeSecureStoreAdapter: SecureStorageAdapter = {
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
};

const defaultAdapter: SecureStorageAdapter = isWebRuntime()
  ? webLocalStorageAdapter
  : nativeSecureStoreAdapter;

let adapter: SecureStorageAdapter = defaultAdapter;

/** Test / platform override hook — production apps use default expo-secure-store. */
export function setSecureStorageAdapter(next: SecureStorageAdapter): void {
  adapter = next;
}

export function resetSecureStorageAdapter(): void {
  adapter = defaultAdapter;
}

export async function saveRefreshToken(token: RefreshToken | string): Promise<void> {
  await adapter.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, String(token));
}

export async function loadRefreshToken(): Promise<RefreshToken | null> {
  const value = await adapter.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
  if (!value) return null;
  return asRefreshToken(value);
}

export async function clearRefreshToken(): Promise<void> {
  await adapter.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
}

export async function clearAllSecureAuthStorage(): Promise<void> {
  await clearRefreshToken();
}
