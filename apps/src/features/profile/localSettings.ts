import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'foodie.delivery.localSettings.v1';

export type LocalDeliverySettings = {
  /** Local-only opt-in intent — device-token Gap blocks push sync. */
  notificationsEnabled: boolean;
};

const DEFAULTS: LocalDeliverySettings = {
  notificationsEnabled: false,
};

export async function loadLocalSettings(): Promise<LocalDeliverySettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<LocalDeliverySettings>;
    return {
      notificationsEnabled: Boolean(parsed.notificationsEnabled),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveLocalSettings(
  next: LocalDeliverySettings,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
