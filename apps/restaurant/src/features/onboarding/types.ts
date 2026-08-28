/**
 * P2-RES-01 onboarding shapes — UI-API Registration/Documents/Images/Pending +
 * CreateRestaurantRequestDto / RestaurantDetailResponseDto.
 */

export const CUISINE_TYPES = [
  'SOUTH_INDIAN',
  'NORTH_INDIAN',
  'VEGETARIAN',
  'CHINESE',
  'MUGHLAI',
  'BIRYANI',
  'FAST_FOOD',
  'CONTINENTAL',
  'ITALIAN',
  'DESSERTS',
  'BEVERAGES',
  'OTHER',
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

export const DOC_TYPES = ['FSSAI', 'GST', 'PAN'] as const;
export type RestaurantDocType = (typeof DOC_TYPES)[number];

export const IMAGE_TYPES = ['LOGO', 'COVER'] as const;
export type RestaurantImageType = (typeof IMAGE_TYPES)[number];

export type RestaurantCategoryType = 'VEGETARIAN' | 'NON_VEGETARIAN' | 'BOTH';

export type RestaurantStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | string;

export type RestaurantAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

export type RegisterRestaurantRequest = {
  name: string;
  description?: string | null;
  cuisineTypes: CuisineType[];
  restaurantType?: RestaurantCategoryType;
  address: RestaurantAddress;
};

export type RestaurantDetail = {
  restaurantId: string;
  name: string;
  description?: string | null;
  cuisineTypes?: string[];
  restaurantType?: RestaurantCategoryType;
  rejectionReason?: string | null;
  address?: RestaurantAddress;
  status?: RestaurantStatus;
  logoImageUrl?: string | null;
  coverImageUrl?: string | null;
  avgRating?: number | string | null;
  commissionPct?: number | string | null;
};

export type RestaurantDocumentUploadResult = {
  documentId: string;
  docType: string;
  verifiedAt?: string | null;
};

export type RestaurantImageUploadResult = {
  fileKey: string;
  imageType: string;
  uploadedAt?: string;
};

const PINCODE_RE = /^\d{6}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRestaurantId(value: string): boolean {
  return UUID_RE.test(value);
}

export function isCuisineType(value: string): value is CuisineType {
  return (CUISINE_TYPES as readonly string[]).includes(value);
}

export function validateRegistrationForm(input: {
  name: string;
  description: string;
  cuisineTypes: string[];
  restaurantType?: RestaurantCategoryType;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  latitude: string;
  longitude: string;
}):
  | { ok: true; value: RegisterRestaurantRequest }
  | { ok: false; message: string } {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 255) {
    return { ok: false, message: 'Name must be 2–255 characters.' };
  }
  const description = input.description.trim();
  if (description.length > 1000) {
    return { ok: false, message: 'Description must be at most 1000 characters.' };
  }
  const cuisineTypes = input.cuisineTypes.filter(isCuisineType);
  if (cuisineTypes.length === 0) {
    return { ok: false, message: 'Select at least one cuisine type.' };
  }
  const line1 = input.line1.trim();
  if (!line1 || line1.length > 255) {
    return { ok: false, message: 'Address line 1 is required.' };
  }
  const line2 = input.line2.trim();
  const city = input.city.trim();
  if (!city || city.length > 100) {
    return { ok: false, message: 'City is required.' };
  }
  const pincode = input.pincode.trim();
  if (!PINCODE_RE.test(pincode)) {
    return { ok: false, message: 'Pincode must be 6 digits.' };
  }
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { ok: false, message: 'Enter valid latitude and longitude.' };
  }
  return {
    ok: true,
    value: {
      name,
      description: description || null,
      cuisineTypes,
      restaurantType: input.restaurantType || 'BOTH',
      address: {
        line1,
        line2: line2 || null,
        city,
        pincode,
        latitude,
        longitude,
      },
    },
  };
}
