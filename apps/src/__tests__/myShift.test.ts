jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStoredActiveShift,
  storeActiveShift,
  clearStoredActiveShift,
  FALLBACK_ADMIN_SHIFTS,
  type ActiveShiftData,
} from '../features/home/shiftStorage';

describe('Delivery Partner My Shift Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('Shift Storage & Persistence', () => {
    it('returns null when no active shift is stored', async () => {
      const shift = await getStoredActiveShift();
      expect(shift).toBeNull();
    });

    it('stores and retrieves active shift successfully', async () => {
      const mockShift: ActiveShiftData = {
        shiftId: '67b534e5-f127-4772-8895-09602bc2d69e',
        shiftName: 'Morning',
        startTime: '06:00 AM',
        endTime: '12:00 PM',
        durationHours: '6h',
        date: '2026-10-18',
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        notes: 'BIKE • Express orders preferred',
      };

      await storeActiveShift(mockShift);
      const retrieved = await getStoredActiveShift();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.shiftId).toBe(mockShift.shiftId);
      expect(retrieved?.shiftName).toBe('Morning');
      expect(retrieved?.startTime).toBe('06:00 AM');
      expect(retrieved?.endTime).toBe('12:00 PM');
      expect(retrieved?.durationHours).toBe('6h');
      expect(retrieved?.status).toBe('ACTIVE');
    });

    it('clears stored active shift upon ending shift', async () => {
      const mockShift: ActiveShiftData = {
        shiftId: 'fc5dcb04-9451-4b65-8991-c004026bd9e1',
        shiftName: 'Evening',
        startTime: '05:00 PM',
        endTime: '11:00 PM',
        durationHours: '6h',
        date: '2026-10-18',
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
      };

      await storeActiveShift(mockShift);
      let retrieved = await getStoredActiveShift();
      expect(retrieved).not.toBeNull();

      await clearStoredActiveShift();
      retrieved = await getStoredActiveShift();
      expect(retrieved).toBeNull();
    });
  });

  describe('Admin Shifts Configuration', () => {
    it('contains all 4 standard admin shifts with valid properties', () => {
      expect(FALLBACK_ADMIN_SHIFTS).toHaveLength(4);

      const shiftNames = FALLBACK_ADMIN_SHIFTS.map((s) => s.shiftName);
      expect(shiftNames).toContain('Morning');
      expect(shiftNames).toContain('Afternoon');
      expect(shiftNames).toContain('Evening');
      expect(shiftNames).toContain('Late Night');

      for (const shift of FALLBACK_ADMIN_SHIFTS) {
        expect(shift.shiftId).toBeTruthy();
        expect(shift.startTime).toBeTruthy();
        expect(shift.endTime).toBeTruthy();
        expect(shift.durationHours).toBeTruthy();
        expect(shift.status).toBe('ACTIVE');
      }
    });

    it('has non-overlapping shift window titles matching backend schedules', () => {
      const morning = FALLBACK_ADMIN_SHIFTS.find((s) => s.shiftName === 'Morning');
      expect(morning?.startTime).toBe('06:00 AM');
      expect(morning?.endTime).toBe('12:00 PM');

      const afternoon = FALLBACK_ADMIN_SHIFTS.find((s) => s.shiftName === 'Afternoon');
      expect(afternoon?.startTime).toBe('12:00 PM');
      expect(afternoon?.endTime).toBe('05:00 PM');

      const evening = FALLBACK_ADMIN_SHIFTS.find((s) => s.shiftName === 'Evening');
      expect(evening?.startTime).toBe('05:00 PM');
      expect(evening?.endTime).toBe('11:00 PM');

      const lateNight = FALLBACK_ADMIN_SHIFTS.find((s) => s.shiftName === 'Late Night');
      expect(lateNight?.startTime).toBe('11:00 PM');
      expect(lateNight?.endTime).toBe('03:00 AM');
    });
  });
});
