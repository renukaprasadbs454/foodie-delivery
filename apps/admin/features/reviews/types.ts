/**
 * P2-ADM-05 admin reviews helpers — public GET /restaurants/{id}/reviews only.
 * No global list / moderation (GAP-API-20).
 */

export const REVIEW_SORT_WHITELIST = [
  'createdAt',
  '-createdAt',
  '+createdAt',
  'restaurantRating',
  '-restaurantRating',
  '+restaurantRating',
] as const;

export type ReviewSort = (typeof REVIEW_SORT_WHITELIST)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRestaurantUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isReviewSort(value: string): value is ReviewSort {
  return (REVIEW_SORT_WHITELIST as readonly string[]).includes(value);
}
