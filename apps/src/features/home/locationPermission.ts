import { Platform } from 'react-native';
import {
  checkLocationServicesStatus,
  requestForegroundLocationPermission,
  requestBackgroundLocationPermission,
} from '../location/locationService';

export type BackgroundLocationGate =
  | { ok: true }
  | { ok: false; message: string; code?: 'GPS_DISABLED' | 'PERMISSION_DENIED' };

/**
 * Background location & GPS gate for go-online — SD §16.5/§18 / UI-API Availability AC.
 * Verifies GPS status, foreground, and background permissions before allowing the partner to go online.
 */
export async function ensureBackgroundLocationForOnline(): Promise<BackgroundLocationGate> {
  const currentStatus = await checkLocationServicesStatus();

  // Check device GPS status
  if (!currentStatus.gpsEnabled && Platform.OS !== 'web') {
    return {
      ok: false,
      code: 'GPS_DISABLED',
      message: 'Device GPS is disabled. Please enable Location Services in your device settings to go online.',
    };
  }

  // Request foreground permission if not granted
  if (currentStatus.foregroundPermission !== 'granted') {
    const fg = await requestForegroundLocationPermission();
    if (fg.status !== 'granted') {
      return {
        ok: false,
        code: 'PERMISSION_DENIED',
        message: 'Location permission is required to go online and receive delivery offers.',
      };
    }
  }

  // Web does not require separate background permission
  if (Platform.OS === 'web') {
    return { ok: true };
  }

  // Request background permission for native platforms
  if (currentStatus.backgroundPermission !== 'granted') {
    const bg = await requestBackgroundLocationPermission();
    if (bg.status !== 'granted') {
      return {
        ok: false,
        code: 'PERMISSION_DENIED',
        message: 'Background location permission is required while online to assign delivery offers. Please allow "Always" location access in system settings.',
      };
    }
  }

  return { ok: true };
}
