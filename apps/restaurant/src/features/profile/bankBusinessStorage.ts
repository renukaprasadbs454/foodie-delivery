import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { BankAndBusinessData } from './bankBusinessTypes';

const BANK_BUSINESS_STORAGE_KEY = 'foodie_restaurant_bank_business_v1';

/**
 * Mask Bank Account Number safely (e.g. "XXXX XXXX 4521")
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return 'XXXX XXXX XXXX';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
}

/**
 * Mask PAN Number safely (e.g. "XXXXXX1234X")
 */
export function maskPanNumber(pan: string): string {
  if (!pan) return 'XXXXXX1234X';
  const clean = pan.trim().toUpperCase();
  if (clean.length < 5) return 'XXXXX';
  const last4 = clean.slice(-5);
  return `XXXXX${last4}`;
}

/**
 * Mask UPI ID for display
 */
export function maskUpiId(upiId: string): string {
  if (!upiId) return '';
  const parts = upiId.split('@');
  if (parts.length !== 2) return upiId;
  const handle = parts[0];
  const domain = parts[1];
  if (handle.length <= 3) {
    return `${handle.slice(0, 1)}***@${domain}`;
  }
  return `${handle.slice(0, 3)}***@${domain}`;
}

/**
 * Save bank and business details securely
 */
export async function saveStoredBankAndBusiness(
  data: BankAndBusinessData,
): Promise<void> {
  const serialized = JSON.stringify(data);
  try {
    const isSecureAvailable = await SecureStore.isAvailableAsync();
    if (isSecureAvailable) {
      await SecureStore.setItemAsync(BANK_BUSINESS_STORAGE_KEY, serialized);
    } else {
      await AsyncStorage.setItem(BANK_BUSINESS_STORAGE_KEY, serialized);
    }
  } catch (_e) {
    // SecureStore fallback if native keychain fails (e.g. web browser)
    try {
      await AsyncStorage.setItem(BANK_BUSINESS_STORAGE_KEY, serialized);
    } catch (_fallbackErr) {
      // Ignored
    }
  }
}

/**
 * Load saved bank and business details from secure storage or fallback
 */
export async function loadStoredBankAndBusiness(): Promise<BankAndBusinessData | null> {
  try {
    let raw: string | null = null;
    const isSecureAvailable = await SecureStore.isAvailableAsync();
    if (isSecureAvailable) {
      raw = await SecureStore.getItemAsync(BANK_BUSINESS_STORAGE_KEY);
    }
    if (!raw) {
      raw = await AsyncStorage.getItem(BANK_BUSINESS_STORAGE_KEY);
    }
    if (raw) {
      return JSON.parse(raw) as BankAndBusinessData;
    }
  } catch (_e) {
    try {
      const raw = await AsyncStorage.getItem(BANK_BUSINESS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as BankAndBusinessData;
      }
    } catch (_err) {
      // Return null to use default mock data
    }
  }
  return null;
}
