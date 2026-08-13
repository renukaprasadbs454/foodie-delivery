/**
 * Pure OS maps URL builders — SD §16.3.
 * Kept free of react-native imports for unit tests.
 */

export type OsMapsHandoffArgs = {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  query?: string;
};

export function buildOsMapsUrl(
  args: OsMapsHandoffArgs,
  platform: 'ios' | 'android' | 'web' | string = 'android',
): string {
  const { originLat, originLng, destLat, destLng, query } = args;
  if (
    typeof destLat === 'number' &&
    typeof destLng === 'number' &&
    Number.isFinite(destLat) &&
    Number.isFinite(destLng)
  ) {
    if (platform === 'ios') {
      const originParam = (typeof originLat === 'number') ? `&saddr=${originLat},${originLng}` : '';
      return `http://maps.apple.com/?daddr=${destLat},${destLng}${originParam}&dirflg=d`;
    }
    const originParam = (typeof originLat === 'number') ? `&origin=${originLat},${originLng}` : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${originParam}&travelmode=two-wheeler`;
  }

  const q = (query ?? '').trim();
  if (q) {
    const encoded = encodeURIComponent(q);
    if (platform === 'ios') {
      return `http://maps.apple.com/?q=${encoded}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }

  if (platform === 'ios') {
    return 'http://maps.apple.com/';
  }
  return 'https://www.google.com/maps';
}
