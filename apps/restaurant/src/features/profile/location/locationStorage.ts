import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { RestaurantLocation } from './locationTypes';

const LOCATION_STORAGE_KEY = 'foodie_restaurant_location_v1';

/**
 * Save restaurant location securely
 */
export async function saveStoredLocation(
  data: RestaurantLocation,
): Promise<void> {
  const serialized = JSON.stringify(data);
  try {
    const isSecureAvailable = await SecureStore.isAvailableAsync();
    if (isSecureAvailable) {
      await SecureStore.setItemAsync(LOCATION_STORAGE_KEY, serialized);
    } else {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, serialized);
    }
  } catch (_e) {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, serialized);
    } catch (_fallbackErr) {
      // Ignored
    }
  }
}

/**
 * Load saved restaurant location from secure storage or fallback
 */
export async function loadStoredLocation(): Promise<RestaurantLocation | null> {
  try {
    let raw: string | null = null;
    const isSecureAvailable = await SecureStore.isAvailableAsync();
    if (isSecureAvailable) {
      raw = await SecureStore.getItemAsync(LOCATION_STORAGE_KEY);
    }
    if (!raw) {
      raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    }
    if (raw) {
      return JSON.parse(raw) as RestaurantLocation;
    }
  } catch (_e) {
    try {
      const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as RestaurantLocation;
      }
    } catch (_err) {
      // Return null to fallback to default mock location
    }
  }
  return null;
}
