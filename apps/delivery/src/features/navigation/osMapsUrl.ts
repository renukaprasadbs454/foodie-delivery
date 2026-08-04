/**
 * Pure OS maps URL builders — SD §16.3.
 * Kept free of react-native imports for unit tests.
 */

export type OsMapsHandoffArgs = {
  latitude?: number;
  longitude?: number;
  query?: string;
};

export function buildOsMapsUrl(
  args: OsMapsHandoffArgs,
  platform: 'ios' | 'android' | 'web' | string = 'android',
): string {
  const { latitude, longitude, query } = args;
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    if (platform === 'ios') {
      return `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
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
