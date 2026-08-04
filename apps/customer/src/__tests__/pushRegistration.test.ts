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
  loadLocalPushRegistration,
  requestLocalPushRegistration,
} from '../features/notifications/pushRegistration';

describe('pushRegistration (P2-XAP-03 customer)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('requests permission and stores a local token when granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Notifications.getDevicePushTokenAsync as jest.Mock).mockResolvedValue({
      data: 'cust-token',
    });

    const result = await requestLocalPushRegistration('customer-1');

    expect(result.permissionStatus).toBe('granted');
    expect(result.deviceToken).toBe('cust-token');
    expect(result.lastUserId).toBe('customer-1');
  });

  it('records denied permission without inventing backend sync', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const result = await ensureLocalPushRegistration('customer-2');
    const stored = await loadLocalPushRegistration();

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(result.permissionStatus).toBe('denied');
    expect(stored.deviceToken).toBeNull();
    expect(stored.lastUserId).toBe('customer-2');
  });
});
