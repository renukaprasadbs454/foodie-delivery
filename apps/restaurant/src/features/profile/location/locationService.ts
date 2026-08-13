import type { AddressSuggestion, RestaurantLocation } from './locationTypes';
import { isValidCoordinate } from './locationTypes';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Fallback Database of popular Indian dining hubs for offline/demo search
 */
const OFFLINE_SUGGESTIONS_DB: AddressSuggestion[] = [
  {
    id: 'sugg_1',
    title: '124 MG Road, Koramangala 5th Block',
    subtitle: 'Opposite Metro Station, Bengaluru, Karnataka 560095',
    latitude: 12.9352,
    longitude: 77.6245,
    addressLine1: '124 MG Road',
    addressLine2: 'Koramangala 5th Block',
    landmark: 'Opposite Metro Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560095',
    formattedAddress: '124 MG Road, Koramangala 5th Block, Bengaluru, Karnataka - 560095, India',
  },
  {
    id: 'sugg_2',
    title: '100 Feet Road, Indiranagar',
    subtitle: 'Near 12th Main Junction, Bengaluru, Karnataka 560038',
    latitude: 12.9784,
    longitude: 77.6408,
    addressLine1: '100 Feet Road',
    addressLine2: 'Indiranagar 2nd Stage',
    landmark: 'Near 12th Main Junction',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560038',
    formattedAddress: '100 Feet Road, Indiranagar 2nd Stage, Bengaluru, Karnataka - 560038, India',
  },
  {
    id: 'sugg_3',
    title: '27th Main Road, HSR Layout Sector 1',
    subtitle: 'Near Agara Lake, Bengaluru, Karnataka 560102',
    latitude: 12.9116,
    longitude: 77.6468,
    addressLine1: '27th Main Road',
    addressLine2: 'HSR Layout Sector 1',
    landmark: 'Near Agara Lake Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560102',
    formattedAddress: '27th Main Road, HSR Layout Sector 1, Bengaluru, Karnataka - 560102, India',
  },
  {
    id: 'sugg_4',
    title: 'ITPL Main Road, Whitefield',
    subtitle: 'Opposite Nexus Shantiniketan, Bengaluru, Karnataka 560066',
    latitude: 12.9850,
    longitude: 77.7315,
    addressLine1: 'ITPL Main Road',
    addressLine2: 'Whitefield',
    landmark: 'Opposite Nexus Shantiniketan',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560066',
    formattedAddress: 'ITPL Main Road, Whitefield, Bengaluru, Karnataka - 560066, India',
  },
  {
    id: 'sugg_5',
    title: 'Connaught Place Outer Circle',
    subtitle: 'Block E, New Delhi, Delhi 110001',
    latitude: 28.6315,
    longitude: 77.2167,
    addressLine1: 'Block E, Outer Circle',
    addressLine2: 'Connaught Place',
    landmark: 'Near Rajiv Chowk Metro Gate 5',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
    formattedAddress: 'Block E, Outer Circle, Connaught Place, New Delhi, Delhi - 110001, India',
  },
  {
    id: 'sugg_6',
    title: 'Linking Road, Bandra West',
    subtitle: 'Near National College, Mumbai, Maharashtra 400050',
    latitude: 19.0600,
    longitude: 72.8362,
    addressLine1: 'Linking Road',
    addressLine2: 'Bandra West',
    landmark: 'Near National College',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400050',
    formattedAddress: 'Linking Road, Bandra West, Mumbai, Maharashtra - 400050, India',
  },
  {
    id: 'sugg_7',
    title: 'Hi-Tech City Main Road, Madhapur',
    subtitle: 'Near Cyber Towers, Hyderabad, Telangana 500081',
    latitude: 17.4504,
    longitude: 78.3808,
    addressLine1: 'Hi-Tech City Main Road',
    addressLine2: 'Madhapur',
    landmark: 'Near Cyber Towers',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500081',
    formattedAddress: 'Hi-Tech City Main Road, Madhapur, Hyderabad, Telangana - 500081, India',
  },
];

/**
 * Search address with debouncing support & fallback
 */
export async function searchAddressSuggestions(
  query: string,
): Promise<AddressSuggestion[]> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  // Filter offline suggestions
  const localMatches = OFFLINE_SUGGESTIONS_DB.filter(
    (item) =>
      item.title.toLowerCase().includes(clean) ||
      item.subtitle.toLowerCase().includes(clean) ||
      item.city.toLowerCase().includes(clean) ||
      item.addressLine1.toLowerCase().includes(clean),
  );

  // If online & Google Maps API key available, query Google Places API
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        clean,
      )}&components=country:in&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.predictions)) {
        return data.predictions.map((p: any, idx: number) => ({
          id: p.place_id || `place_${idx}`,
          title: p.structured_formatting?.main_text || p.description,
          subtitle: p.structured_formatting?.secondary_text || 'India',
          latitude: 12.9352 + idx * 0.005,
          longitude: 77.6245 + idx * 0.005,
          addressLine1: p.structured_formatting?.main_text || p.description,
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          pincode: '560095',
          formattedAddress: p.description,
        }));
      }
    } catch (_err) {
      // Fallback to local
    }
  }

  // Try OpenStreetMap Nominatim free geocoding API if local list has few results
  if (localMatches.length === 0 && clean.length >= 2) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        clean + ', India',
      )}&addressdetails=1&limit=5`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FoodieRestaurantApp/1.0' },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data
          .map((item: any, idx: number) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            if (!isValidCoordinate(lat, lon)) return null;

            const addr = item.address || {};
            const city =
              addr.city || addr.town || addr.suburb || addr.state_district || 'Bengaluru';
            const state = addr.state || 'Karnataka';
            const pincode = (addr.postcode || '560095').replace(/\D/g, '').slice(0, 6) || '560095';
            const road = addr.road || addr.pedestrian || item.display_name.split(',')[0];

            return {
              id: `osm_${item.place_id || idx}`,
              title: road,
              subtitle: `${city}, ${state} ${pincode}`,
              latitude: lat,
              longitude: lon,
              addressLine1: road,
              city,
              state,
              country: addr.country || 'India',
              pincode,
              formattedAddress: item.display_name,
            };
          })
          .filter((item): item is AddressSuggestion => item !== null);
      }
    } catch (_err) {
      // Fallback
    }
  }

  return localMatches;
}

/**
 * Reverse geocode latitude/longitude into address details
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<Partial<RestaurantLocation>> {
  if (!isValidCoordinate(latitude, longitude)) {
    return {
      latitude: 12.9352,
      longitude: 77.6245,
      addressLine1: 'Location at 12.9352°, 77.6245°',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560095',
      formattedAddress: '12.9352° N, 77.6245° E, Bengaluru, Karnataka - 560095, India',
    };
  }

  const roundedLat = Number(latitude.toFixed(6));
  const roundedLng = Number(longitude.toFixed(6));

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodieRestaurantApp/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const road =
        addr.road ||
        addr.pedestrian ||
        addr.amenity ||
        addr.building ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.commercial ||
        addr.county ||
        `Location at ${roundedLat}°, ${roundedLng}°`;

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.city_district ||
        addr.county ||
        'Bengaluru';
      const state = addr.state || 'Karnataka';
      const country = addr.country || 'India';
      const pincode = (addr.postcode || '560095').replace(/\D/g, '').slice(0, 6) || '560095';

      return {
        latitude: roundedLat,
        longitude: roundedLng,
        addressLine1: road,
        addressLine2: addr.suburb || addr.neighbourhood || '',
        city,
        state,
        country,
        pincode,
        formattedAddress:
          data.display_name || `${road}, ${city}, ${state} - ${pincode}, ${country}`,
      };
    }
  } catch (_err) {
    // Fallback if network offline or timeout
  }

  return {
    latitude: roundedLat,
    longitude: roundedLng,
    addressLine1: `Location at ${roundedLat}°, ${roundedLng}°`,
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560095',
    formattedAddress: `${roundedLat}° N, ${roundedLng}° E, Bengaluru, Karnataka - 560095, India`,
  };
}

/**
 * Get device current location safely
 */
export async function getCurrentDeviceLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (isValidCoordinate(lat, lng)) {
            resolve({ latitude: lat, longitude: lng });
          } else {
            resolve(null);
          }
        },
        (_err) => {
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    } else {
      resolve(null);
    }
  });
}
