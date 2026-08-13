import {
  isNavigationLeg,
  legForOrderStatus,
  validateOtp,
  validatePingCoords,
} from '../features/navigation/types';
import { buildOsMapsUrl } from '../features/navigation/osMapsUrl';
import {
  LOCATION_PING_INTERVAL_MS,
  LocationPingBuffer,
} from '../features/navigation/pingBuffer';

describe('navigation types (P2-DEL-03)', () => {
  it('validates 6-digit OTP only', () => {
    expect(validateOtp('123456')).toEqual({ ok: true, otp: '123456' });
    expect(validateOtp('12345').ok).toBe(false);
    expect(validateOtp('1234567').ok).toBe(false);
    expect(validateOtp('abcdef').ok).toBe(false);
  });

  it('validates lat/lng ranges', () => {
    expect(validatePingCoords(12.97, 77.59).ok).toBe(true);
    expect(validatePingCoords(91, 0).ok).toBe(false);
    expect(validatePingCoords(0, 181).ok).toBe(false);
  });

  it('maps order status to navigation leg', () => {
    expect(isNavigationLeg('pickup')).toBe(true);
    expect(legForOrderStatus('ACCEPTED')).toBe('pickup');
    expect(legForOrderStatus('OUT_FOR_DELIVERY')).toBe('drop');
    expect(legForOrderStatus('PICKED_UP')).toBe('drop');
  });
});

describe('location ping buffer (P2-DEL-03)', () => {
  it('keeps last 3 and flushes most recent only', () => {
    const buffer = new LocationPingBuffer();
    buffer.push({ latitude: 1, longitude: 1 });
    buffer.push({ latitude: 2, longitude: 2 });
    buffer.push({ latitude: 3, longitude: 3 });
    buffer.push({ latitude: 4, longitude: 4 });
    expect(buffer.size()).toBe(3);
    const latest = buffer.takeMostRecentAndClear();
    expect(latest).toEqual({ latitude: 4, longitude: 4 });
    expect(buffer.size()).toBe(0);
    expect(LOCATION_PING_INTERVAL_MS).toBe(3000);
  });
});

describe('os maps handoff (P2-DEL-03)', () => {
  it('builds destination URL when coords present', () => {
    const url = buildOsMapsUrl(
      { destLat: 12.9, destLng: 77.6, originLat: 1.0, originLng: 1.0 },
      'android',
    );
    expect(url.includes('12.9')).toBe(true);
    expect(url.includes('77.6')).toBe(true);
  });

  it('builds search URL when only query present', () => {
    const url = buildOsMapsUrl({ query: 'Order ABC' }, 'android');
    expect(url.toLowerCase().includes('order')).toBe(true);
  });
});
