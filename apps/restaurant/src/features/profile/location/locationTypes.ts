export interface RestaurantLocation {
  latitude: number;
  longitude: number;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  formattedAddress: string;
}

export interface AddressSuggestion {
  id: string;
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  formattedAddress: string;
}

export type LocationValidationResult =
  | { ok: true; value: RestaurantLocation }
  | { ok: false; errors: Record<string, string>; message: string };

/**
 * Coordinate Validation helper to prevent NaN / null / invalid coordinates
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return false;
  }
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng) || !isFinite(nLat) || !isFinite(nLng)) {
    return false;
  }
  return nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180 && (nLat !== 0 || nLng !== 0);
}

/**
 * Formats valid coordinates cleanly (e.g. "12.9352° N, 77.6245° E"). Never outputs NaN.
 */
export function formatCoordinates(lat?: number | null, lng?: number | null): string {
  if (!isValidCoordinate(lat, lng)) {
    return 'Location not selected';
  }
  const nLat = Number(lat);
  const nLng = Number(lng);
  const latDir = nLat >= 0 ? 'N' : 'S';
  const lngDir = nLng >= 0 ? 'E' : 'W';
  return `${Math.abs(nLat).toFixed(4)}° ${latDir}, ${Math.abs(nLng).toFixed(4)}° ${lngDir}`;
}

export function validateLocationForm(
  input: Partial<RestaurantLocation>,
): LocationValidationResult {
  const errors: Record<string, string> = {};

  const lat = Number(input.latitude);
  if (!isValidCoordinate(lat, input.longitude)) {
    errors.latitude = 'Valid latitude (-90 to 90) is required';
  }

  const lng = Number(input.longitude);
  if (!isValidCoordinate(input.latitude, lng)) {
    errors.longitude = 'Valid longitude (-180 to 180) is required';
  }

  if (!input.addressLine1?.trim()) {
    errors.addressLine1 = 'Address Line 1 is required';
  }

  if (!input.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!input.state?.trim()) {
    errors.state = 'State is required';
  }

  if (!input.country?.trim()) {
    errors.country = 'Country is required';
  }

  const cleanPincode = input.pincode?.trim() ?? '';
  if (!cleanPincode) {
    errors.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(cleanPincode)) {
    errors.pincode = 'Pincode must be exactly 6 digits';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: Object.values(errors)[0],
    };
  }

  const line1 = input.addressLine1!.trim();
  const line2 = input.addressLine2?.trim() || undefined;
  const landmark = input.landmark?.trim() || undefined;
  const city = input.city!.trim();
  const state = input.state!.trim();
  const country = input.country!.trim();
  const pincode = cleanPincode;

  const formattedAddress =
    input.formattedAddress?.trim() ||
    [line1, line2, landmark, `${city}, ${state} - ${pincode}`, country]
      .filter(Boolean)
      .join(', ');

  return {
    ok: true,
    value: {
      latitude: lat,
      longitude: lng,
      addressLine1: line1,
      addressLine2: line2,
      landmark,
      city,
      state,
      country,
      pincode,
      formattedAddress,
    },
  };
}
