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

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { ensureBackgroundLocationForOnline } from '@/features/home/locationPermission';
import { LOCATION_INTERVALS } from '@/features/location/types';

describe('Location Tracking Policies & Gates (Req 3, 6, 7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'android';
  });

  describe('Tracking Intervals and Policy', () => {
    it('defines 3s interval for active delivery and 30s for online idle availability', () => {
      expect(LOCATION_INTERVALS.ACTIVE_DELIVERY_MS).toBe(3_000);
      expect(LOCATION_INTERVALS.ONLINE_IDLE_MS).toBe(30_000);
    });
  });

  describe('ensureBackgroundLocationForOnline gate', () => {
    it('blocks go-online with actionable error when GPS is disabled', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      const result = await ensureBackgroundLocationForOnline();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('GPS_DISABLED');
        expect(result.message).toContain('GPS is disabled');
      }
    });

    it('blocks go-online when foreground permission is rejected', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      const result = await ensureBackgroundLocationForOnline();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('PERMISSION_DENIED');
        expect(result.message).toContain('Location permission is required');
      }
    });

    it('blocks go-online on native Android/iOS when background permission is rejected', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Location.requestBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      const result = await ensureBackgroundLocationForOnline();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('PERMISSION_DENIED');
        expect(result.message).toContain('Background location permission is required');
      }
    });

    it('allows go-online when all permissions and GPS are active', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getBackgroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);

      const result = await ensureBackgroundLocationForOnline();

      expect(result.ok).toBe(true);
    });

    it('allows go-online on web platform with only foreground permission', async () => {
      (Platform as any).OS = 'web';
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await ensureBackgroundLocationForOnline();

      expect(result.ok).toBe(true);
    });
  });
});
