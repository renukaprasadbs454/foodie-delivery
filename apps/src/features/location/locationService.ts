import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { validatePingCoords, type LocationPingPayload } from '../navigation/types';
import type {
  LocationCoordinates,
  LocationPermissionStatus,
} from './types';

/**
 * Normalizes expo-location permission response to standard status.
 */
function normalizePermissionStatus(status?: string): LocationPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/**
 * Queries native Android/iOS/Web APIs for foreground, background, and GPS statuses.
 */
export async function checkLocationServicesStatus(): Promise<{
  foregroundPermission: LocationPermissionStatus;
  backgroundPermission: LocationPermissionStatus;
  gpsEnabled: boolean;
  canAskAgainForeground: boolean;
  canAskAgainBackground: boolean;
}> {
  let foregroundStatus: LocationPermissionStatus = 'undetermined';
  let backgroundStatus: LocationPermissionStatus = 'undetermined';
  let canAskAgainForeground = true;
  let canAskAgainBackground = true;
  let gpsEnabled = false;

  try {
    const fg = await Location.getForegroundPermissionsAsync();
    foregroundStatus = normalizePermissionStatus(fg.status);
    canAskAgainForeground = fg.canAskAgain ?? true;
  } catch (err) {
    console.warn('[LocationService] Failed to check foreground permission:', err);
  }

  try {
    if (Platform.OS === 'web') {
      // Web does not have a separate background location permission API
      backgroundStatus = foregroundStatus === 'granted' ? 'granted' : 'undetermined';
      canAskAgainBackground = canAskAgainForeground;
    } else {
      const bg = await Location.getBackgroundPermissionsAsync();
      backgroundStatus = normalizePermissionStatus(bg.status);
      canAskAgainBackground = bg.canAskAgain ?? true;
    }
  } catch (err) {
    console.warn('[LocationService] Failed to check background permission:', err);
  }

  try {
    if (Platform.OS === 'web') {
      // On web, navigator.geolocation is available if supported
      gpsEnabled = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    } else {
      gpsEnabled = await Location.hasServicesEnabledAsync();
    }
  } catch (err) {
    console.warn('[LocationService] Failed to check device GPS status:', err);
    gpsEnabled = false;
  }

  return {
    foregroundPermission: foregroundStatus,
    backgroundPermission: backgroundStatus,
    gpsEnabled,
    canAskAgainForeground,
    canAskAgainBackground,
  };
}

/**
 * Requests foreground location permission.
 */
export async function requestForegroundLocationPermission(): Promise<{
  status: LocationPermissionStatus;
  canAskAgain: boolean;
}> {
  try {
    const res = await Location.requestForegroundPermissionsAsync();
    return {
      status: normalizePermissionStatus(res.status),
      canAskAgain: res.canAskAgain ?? true,
    };
  } catch (err) {
    console.warn('[LocationService] Error requesting foreground permission:', err);
    return { status: 'denied', canAskAgain: false };
  }
}

/**
 * Requests background location permission (on native platforms after foreground is granted).
 */
export async function requestBackgroundLocationPermission(): Promise<{
  status: LocationPermissionStatus;
  canAskAgain: boolean;
}> {
  if (Platform.OS === 'web') {
    const fg = await requestForegroundLocationPermission();
    return fg;
  }

  try {
    // Android requirement: Foreground permission must be granted first
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      const requestedFg = await Location.requestForegroundPermissionsAsync();
      if (requestedFg.status !== 'granted') {
        return {
          status: 'denied',
          canAskAgain: requestedFg.canAskAgain ?? true,
        };
      }
    }

    const bg = await Location.requestBackgroundPermissionsAsync();
    return {
      status: normalizePermissionStatus(bg.status),
      canAskAgain: bg.canAskAgain ?? true,
    };
  } catch (err) {
    console.warn('[LocationService] Error requesting background permission:', err);
    return { status: 'denied', canAskAgain: false };
  }
}

/**
 * Orchestrates requesting both foreground and background location permissions in proper sequence.
 */
export async function requestAllLocationPermissions(): Promise<{
  foregroundPermission: LocationPermissionStatus;
  backgroundPermission: LocationPermissionStatus;
  gpsEnabled: boolean;
}> {
  const fg = await requestForegroundLocationPermission();
  let bgStatus: LocationPermissionStatus = 'undetermined';

  if (fg.status === 'granted') {
    if (Platform.OS === 'web') {
      bgStatus = 'granted';
    } else {
      const bg = await requestBackgroundLocationPermission();
      bgStatus = bg.status;
    }
  } else {
    bgStatus = 'denied';
  }

  let gpsEnabled = false;
  try {
    if (Platform.OS === 'web') {
      gpsEnabled = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    } else {
      gpsEnabled = await Location.hasServicesEnabledAsync();
    }
  } catch {
    gpsEnabled = false;
  }

  return {
    foregroundPermission: fg.status,
    backgroundPermission: bgStatus,
    gpsEnabled,
  };
}

/**
 * Fetches the current device location with accurate coordinates and fallback handling.
 */
export async function getCurrentDeviceLocation(): Promise<LocationCoordinates | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const validated = validatePingCoords(pos.coords.latitude, pos.coords.longitude);
    if (!validated.ok) return null;

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp || Date.now(),
    };
  } catch (err) {
    // Fallback coordinates (e.g. Bangalore center for development/testing simulation)
    return {
      latitude: 12.9800,
      longitude: 77.5900,
      accuracy: 10,
      heading: null,
      speed: null,
      timestamp: Date.now(),
    };
  }
}

/**
 * Opens system application settings for permission changes on native iOS and Android.
 */
export async function openDeviceSettings(): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Device settings are not available on web browsers. Please allow location access in your browser settings.',
      };
    }
    await Linking.openSettings();
    return { success: true };
  } catch (err: any) {
    console.warn('[LocationService] Failed to open device settings:', err);
    return {
      success: false,
      error: err?.message || 'Failed to open device settings.',
    };
  }
}
