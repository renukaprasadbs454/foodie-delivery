import type { RestaurantLocation } from '../features/profile/location/locationTypes';

export const MOCK_RESTAURANT_LOCATION: RestaurantLocation = {
  latitude: 12.9352,
  longitude: 77.6245,
  addressLine1: '124 MG Road',
  addressLine2: 'Koramangala 5th Block',
  landmark: 'Opposite Metro Station',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560095',
  formattedAddress:
    '124 MG Road, Koramangala 5th Block, Bengaluru, Karnataka - 560095, India',
};

let currentMockLocation: RestaurantLocation = {
  ...MOCK_RESTAURANT_LOCATION,
};

export function getMockRestaurantLocation(): RestaurantLocation {
  return currentMockLocation;
}

export function updateMockRestaurantLocation(
  updated: RestaurantLocation,
): RestaurantLocation {
  currentMockLocation = { ...updated };
  return currentMockLocation;
}
