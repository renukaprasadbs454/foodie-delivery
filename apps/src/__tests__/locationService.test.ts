jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((obj: any) => obj.android ?? obj.default),
  },
  Linking: {
    openSettings: jest.fn().mockResolvedValue(true),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
    High: 4,
  },
}));

import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import {
  checkLocationServicesStatus,
  requestForegroundLocationPermission,
  requestBackgroundLocationPermission,
  requestAllLocationPermissions,
  getCurrentDeviceLocation,
  openDeviceSettings,
} from '@/features/location/locationService';

describe('LocationService Native & Web Permission handling (Req 1, 4, 10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'android';
  });

  describe('checkLocationServicesStatus', () => {
    it('returns granted for foreground, background, and GPS enabled on Android', async () => {
      (Platform as any).OS = 'android';
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      const status = await checkLocationServicesStatus();

      expect(status.foregroundPermission).toBe('granted');
      expect(status.backgroundPermission).toBe('granted');
      expect(status.gpsEnabled).toBe(true);
    });

    it('returns denied when permissions are denied and GPS disabled on iOS', async () => {
      (Platform as any).OS = 'ios';
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      const status = await checkLocationServicesStatus();

      expect(status.foregroundPermission).toBe('denied');
      expect(status.backgroundPermission).toBe('denied');
      expect(status.gpsEnabled).toBe(false);
      expect(status.canAskAgainForeground).toBe(false);
    });

    it('handles web platform gracefully without separate background permission API', async () => {
      (Platform as any).OS = 'web';
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const status = await checkLocationServicesStatus();

      expect(status.foregroundPermission).toBe('granted');
      expect(status.backgroundPermission).toBe('granted');
    });
  });

  describe('requestBackgroundLocationPermission', () => {
    it('ensures foreground permission is requested/granted first on Android before requesting background', async () => {
      (Platform as any).OS = 'android';
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const res = await requestBackgroundLocationPermission();

      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(res.status).toBe('granted');
    });

    it('does not request background permission if foreground permission is rejected', async () => {
      (Platform as any).OS = 'android';
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const res = await requestBackgroundLocationPermission();

      expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      expect(res.status).toBe('denied');
    });
  });

  describe('requestAllLocationPermissions', () => {
    it('orchestrates complete permission flow and checks GPS status', async () => {
      (Platform as any).OS = 'android';
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      const res = await requestAllLocationPermissions();

      expect(res.foregroundPermission).toBe('granted');
      expect(res.backgroundPermission).toBe('granted');
      expect(res.gpsEnabled).toBe(true);
    });
  });

  describe('getCurrentDeviceLocation', () => {
    it('returns validated coordinates from native location API', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 5,
          heading: 90,
          speed: 15,
        },
        timestamp: 1700000000000,
      });

      const location = await getCurrentDeviceLocation();

      expect(location).not.toBeNull();
      expect(location?.latitude).toBe(12.9716);
      expect(location?.longitude).toBe(77.5946);
      expect(location?.speed).toBe(15);
    });

    it('falls back to default safe simulation coordinates if native position fails', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('GPS timeout'));

      const location = await getCurrentDeviceLocation();

      expect(location).not.toBeNull();
      expect(location?.latitude).toBe(12.9800);
      expect(location?.longitude).toBe(77.5900);
    });
  });

  describe('openDeviceSettings', () => {
    it('opens native settings using Linking.openSettings on Android and iOS', async () => {
      (Platform as any).OS = 'android';
      const res = await openDeviceSettings();
      expect(res.success).toBe(true);
      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it('returns clear unsupported message on web platform', async () => {
      (Platform as any).OS = 'web';
      const res = await openDeviceSettings();
      expect(res.success).toBe(false);
      expect(res.error).toContain('Device settings are not available on web');
    });
  });
});
