/**
 * P2-CUS-08 Reviews — UI-API Reviews + SubmitReviewRequestDto /
 * ReviewResponseDto / RestaurantReviewItemDto (public list omits customer id).
 */

export type ReviewMode = 'submit' | 'list';

export type SubmitReviewRequest = {
  restaurantRating: number;
  deliveryRating?: number | null;
  comment?: string | null;
};

export type SubmittedReview = {
  reviewId: string;
  orderId: string;
  restaurantId: string;
  deliveryPartnerId?: string | null;
  restaurantRating: number;
  deliveryRating?: number | null;
  comment?: string | null;
  createdAt?: string;
};

export type SubmitReviewArg = SubmitReviewRequest & {
  orderId: string;
};

export const MAX_REVIEW_COMMENT_LENGTH = 1000;

export function isReviewMode(value: string | undefined): value is ReviewMode {
  return value === 'submit' || value === 'list';
}

export function validateRestaurantRating(
  value: number,
): { ok: true; rating: number } | { ok: false; message: string } {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return { ok: false, message: 'Restaurant rating must be 1 to 5 stars.' };
  }
  return { ok: true, rating: value };
}

export function validateDeliveryRating(
  value: number | null,
): { ok: true; rating: number | null } | { ok: false; message: string } {
  if (value == null) return { ok: true, rating: null };
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return { ok: false, message: 'Delivery rating must be 1 to 5 stars.' };
  }
  return { ok: true, rating: value };
}

export function validateReviewComment(
  value: string,
): { ok: true; comment: string | null } | { ok: false; message: string } {
  const comment = value.trim();
  if (comment.length === 0) return { ok: true, comment: null };
  if (comment.length > MAX_REVIEW_COMMENT_LENGTH) {
    return {
      ok: false,
      message: `Comment must be at most ${MAX_REVIEW_COMMENT_LENGTH} characters.`,
    };
  }
  return { ok: true, comment };
}
