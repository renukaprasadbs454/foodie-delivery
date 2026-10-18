import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActiveShiftData {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  durationHours?: string;
  date: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'COMPLETED';
  startedAt: string; // ISO string
  notes?: string;
}

export const FALLBACK_ADMIN_SHIFTS = [
  {
    shiftId: '67b534e5-f127-4772-8895-09602bc2d69e',
    shiftName: 'Morning',
    startTime: '06:00 AM',
    endTime: '12:00 PM',
    durationHours: '6h',
    status: 'ACTIVE',
  },
  {
    shiftId: 'fffb3e70-aaaf-42d0-9fc5-5f0788f81375',
    shiftName: 'Afternoon',
    startTime: '12:00 PM',
    endTime: '05:00 PM',
    durationHours: '5h',
    status: 'ACTIVE',
  },
  {
    shiftId: 'fc5dcb04-9451-4b65-8991-c004026bd9e1',
    shiftName: 'Evening',
    startTime: '05:00 PM',
    endTime: '11:00 PM',
    durationHours: '6h',
    status: 'ACTIVE',
  },
  {
    shiftId: '48df5bfe-ccd8-4e35-8705-18ac859f9e04',
    shiftName: 'Late Night',
    startTime: '11:00 PM',
    endTime: '03:00 AM',
    durationHours: '4h',
    status: 'ACTIVE',
  },
];

const ACTIVE_SHIFT_STORAGE_KEY = 'foodie_active_delivery_shift';

export async function getStoredActiveShift(): Promise<ActiveShiftData | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_SHIFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveShiftData;
    // Check if shift belongs to today or is still active
    return parsed;
  } catch (e) {
    console.warn('[ShiftStorage] Error reading stored shift:', e);
    return null;
  }
}

export async function storeActiveShift(shift: ActiveShiftData): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_SHIFT_STORAGE_KEY, JSON.stringify(shift));
  } catch (e) {
    console.warn('[ShiftStorage] Error storing active shift:', e);
  }
}

export async function clearStoredActiveShift(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACTIVE_SHIFT_STORAGE_KEY);
  } catch (e) {
    console.warn('[ShiftStorage] Error clearing stored shift:', e);
  }
}
