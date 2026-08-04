import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'foodie.restaurant.localSettings.v1';

export type LocalRestaurantSettings = {
  /** Local-only opt-in intent — device-token Gap blocks push sync. */
  notificationsEnabled: boolean;
};

const DEFAULTS: LocalRestaurantSettings = {
  notificationsEnabled: false,
};

export async function loadLocalSettings(): Promise<LocalRestaurantSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<LocalRestaurantSettings>;
    return {
      notificationsEnabled: Boolean(parsed.notificationsEnabled),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveLocalSettings(
  next: LocalRestaurantSettings,
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
