import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import Constants from 'expo-constants';

const KEY = 'foodie.restaurant.pushRegistration.v1';

/** Avoid importing react-native here — keeps Jest/node suites loadable. */
function isWebRuntime(): boolean {
  return typeof document !== 'undefined';
}

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export type PushPermissionState = 'undetermined' | 'granted' | 'denied';

export type LocalPushRegistration = {
  permissionStatus: PushPermissionState;
  deviceToken: string | null;
  lastPromptedAt: string | null;
  lastResolvedAt: string | null;
  lastUserId: string | null;
};

const DEFAULTS: LocalPushRegistration = {
  permissionStatus: 'undetermined',
  deviceToken: null,
  lastPromptedAt: null,
  lastResolvedAt: null,
  lastUserId: null,
};

function normalizePermissionStatus(status: string): PushPermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

function extractDeviceToken(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    typeof value.data === 'string'
  ) {
    return value.data;
  }
  return null;
}

async function saveLocalPushRegistration(
  next: LocalPushRegistration,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function loadLocalPushRegistration(): Promise<LocalPushRegistration> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<LocalPushRegistration>;
    return {
      permissionStatus: normalizePermissionStatus(
        typeof parsed.permissionStatus === 'string'
          ? parsed.permissionStatus
          : 'undetermined',
      ),
      deviceToken:
        typeof parsed.deviceToken === 'string' ? parsed.deviceToken : null,
      lastPromptedAt:
        typeof parsed.lastPromptedAt === 'string' ? parsed.lastPromptedAt : null,
      lastResolvedAt:
        typeof parsed.lastResolvedAt === 'string'
          ? parsed.lastResolvedAt
          : null,
      lastUserId: typeof parsed.lastUserId === 'string' ? parsed.lastUserId : null,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

async function finalizeRegistration(
  userId: string,
  permissionStatus: PushPermissionState,
  current: LocalPushRegistration,
  lastPromptedAt: string | null,
): Promise<LocalPushRegistration> {
  const next: LocalPushRegistration = {
    permissionStatus,
    deviceToken: null,
    lastPromptedAt,
    lastResolvedAt: new Date().toISOString(),
    lastUserId: userId,
  };

  if (permissionStatus === 'granted') {
    try {
      next.deviceToken = extractDeviceToken(
        await Notifications.getDevicePushTokenAsync(),
      );
    } catch {
      next.deviceToken = current.deviceToken;
    }
  }

  await saveLocalPushRegistration(next);
  return next;
}

export async function requestLocalPushRegistration(
  userId: string,
): Promise<LocalPushRegistration> {
  // Push device APIs are native-oriented; skip on web (GAP-API-01 / Expo Web limitation).
  if (isWebRuntime() || isExpoGo()) {
    const current = await loadLocalPushRegistration();
    const next: LocalPushRegistration = {
      ...current,
      permissionStatus: 'denied',
      deviceToken: null,
      lastUserId: userId,
      lastResolvedAt: new Date().toISOString(),
    };
    await saveLocalPushRegistration(next);
    return next;
  }

  const current = await loadLocalPushRegistration();
  const before = await Notifications.getPermissionsAsync();
  let status = normalizePermissionStatus(before.status);
  let lastPromptedAt = current.lastPromptedAt;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = normalizePermissionStatus(requested.status);
    lastPromptedAt = new Date().toISOString();
  }

  return finalizeRegistration(userId, status, current, lastPromptedAt);
}

export async function ensureLocalPushRegistration(
  userId: string,
): Promise<LocalPushRegistration> {
  if (isWebRuntime() || isExpoGo()) {
    return requestLocalPushRegistration(userId);
  }

  const current = await loadLocalPushRegistration();
  const permissions = await Notifications.getPermissionsAsync();
  const status = normalizePermissionStatus(permissions.status);

  if (status === 'undetermined' && !current.lastPromptedAt) {
    return requestLocalPushRegistration(userId);
  }

  return finalizeRegistration(userId, status, current, current.lastPromptedAt);
}
