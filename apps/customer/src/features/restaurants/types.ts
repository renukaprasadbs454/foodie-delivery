/**
 * Customer-facing restaurant shapes derived from frozen UI-API / API §3.1–§3.2 / §12.2.
 * Never include commissionPct on the customer surface.
 */

export type RestaurantSort = 'nearby' | 'avgRating' | 'createdAt';

export const RESTAURANT_SORT_WHITELIST: readonly RestaurantSort[] = [
  'nearby',
  'avgRating',
  'createdAt',
] as const;

export type RestaurantListParams = {
  search?: string;
  lat?: number;
  lng?: number;
  cuisineType?: string;
  page?: number;
  size?: number;
  sort?: RestaurantSort;
};

/** §3.1 list item (public APPROVED feed). */
export type RestaurantSummary = {
  id: string;
  name: string;
  description?: string | null;
  cuisineTypes?: string[] | null;
  avgRating?: number | null;
  ratingCount?: number | null;
  imageUrl?: string | null;
  city?: string | null;
};

/** §3.2 public profile — never commissionPct. */
export type RestaurantPublicProfile = RestaurantSummary & {
  addressLine?: string | null;
  phoneNumber?: string | null;
  status?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

/** §12.2 public review list item — no customer identity. */
export type RestaurantReview = {
  restaurantRating: number;
  deliveryRating?: number | null;
  comment?: string | null;
  createdAt?: string;
};

export type RestaurantReviewsParams = {
  restaurantId: string;
  page?: number;
  size?: number;
  sort?: 'createdAt' | 'restaurantRating';
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRestaurantId(value: string): boolean {
  return UUID_RE.test(value) || value.startsWith('mock-resto-');
}

export function isRestaurantSort(value: string): value is RestaurantSort {
  return (RESTAURANT_SORT_WHITELIST as readonly string[]).includes(value);
}

/** Default page size — UI-API size ≤ 100. */
export const DEFAULT_RESTAURANT_PAGE_SIZE = 20;

/**
 * End-of-list heuristic — createBaseApi unwraps `data` only (no meta.pagination).
 * Treat a short page as terminal.
 */
export function hasMoreRestaurantPages(
  pageItems: RestaurantSummary[] | undefined,
  size: number = DEFAULT_RESTAURANT_PAGE_SIZE,
): boolean {
  if (!pageItems) return false;
  return pageItems.length >= size;
}
