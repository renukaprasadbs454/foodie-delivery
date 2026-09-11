import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type BackgroundLocationGate =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Background location hard gate for go-online — SD §16.5/§18 / UI-API Availability AC.
 * Requested only at go-online (not at app launch).
 */
export async function ensureBackgroundLocationForOnline(): Promise<BackgroundLocationGate> {
  // Background location is not available as a hard gate on Expo Web.
  if (Platform.OS === 'web') {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) {
      return {
        ok: false,
        message:
          'Location permission is required to go online and receive delivery offers.',
      };
    }
    return { ok: true };
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    return {
      ok: false,
      message:
        'Location permission is required to go online and receive delivery offers.',
    };
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) {
    return {
      ok: false,
      message:
        'Background location is required while online. Enable it in system settings to go online.',
    };
  }

  return { ok: true };
}
