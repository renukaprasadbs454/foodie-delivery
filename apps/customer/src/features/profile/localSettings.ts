import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'foodie.customer.localSettings.v1';

export type LocalCustomerSettings = {
  /** Local-only opt-in intent — device-token Gap blocks push sync. */
  notificationsEnabled: boolean;
};

const DEFAULTS: LocalCustomerSettings = {
  notificationsEnabled: false,
};

export async function loadLocalSettings(): Promise<LocalCustomerSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<LocalCustomerSettings>;
    return {
      notificationsEnabled: Boolean(parsed.notificationsEnabled),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveLocalSettings(
  next: LocalCustomerSettings,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
