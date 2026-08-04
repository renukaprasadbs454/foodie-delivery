jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  ensureLocalPushRegistration,
  requestLocalPushRegistration,
} from '../features/notifications/pushRegistration';

describe('pushRegistration (P2-XAP-03 restaurant)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('stores a local token when permission is granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Notifications.getDevicePushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'restaurant-token',
    });

    const result = await requestLocalPushRegistration('restaurant-1');

    expect(result.permissionStatus).toBe('granted');
    expect(result.deviceToken).toBe('restaurant-token');
  });

  it('records denied permission without inventing backend sync', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await ensureLocalPushRegistration('restaurant-2');

    expect(result.permissionStatus).toBe('denied');
    expect(result.deviceToken).toBeNull();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
