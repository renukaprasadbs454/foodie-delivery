import { Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  startOrderOfferAlert,
  stopOrderOfferAlert,
  isOfferAlertActive,
  initializeDeliveryOfferNotificationChannel,
} from '../utils/orderOfferAlert';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Vibration: {
    vibrate: jest.fn(),
    cancel: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-123'),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
  },
  AndroidNotificationPriority: {
    MAX: 'max',
    HIGH: 'high',
  },
  AndroidNotificationVisibility: {
    PUBLIC: 1,
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      }),
    },
  },
}));

describe('orderOfferAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    stopOrderOfferAlert();
  });

  afterEach(() => {
    stopOrderOfferAlert();
    jest.useRealTimers();
  });

  it('starts alert when new offer arrives and marks isOfferAlertActive', async () => {
    expect(isOfferAlertActive()).toBe(false);

    await startOrderOfferAlert('assignment-1', {
      restaurantName: 'Pizza Paradise',
      orderNumber: '1001',
    });

    expect(isOfferAlertActive()).toBe(true);
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 800, 400, 800, 400, 800], true);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('stops alert immediately on accept or reject', async () => {
    await startOrderOfferAlert('assignment-2', {
      restaurantName: 'Burger Hub',
      orderNumber: '1002',
    });

    expect(isOfferAlertActive()).toBe(true);

    stopOrderOfferAlert();

    expect(isOfferAlertActive()).toBe(false);
    expect(Vibration.cancel).toHaveBeenCalled();
  });

  it('handles repeated start calls for same offer idempotently', async () => {
    await startOrderOfferAlert('assignment-same', {
      restaurantName: 'Taco Town',
      orderNumber: '1003',
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

    await startOrderOfferAlert('assignment-same', {
      restaurantName: 'Taco Town',
      orderNumber: '1003',
    });

    // Should not re-schedule duplicate notification for identical offer
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});
