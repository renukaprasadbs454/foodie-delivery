/**
 * P2-ADM-03 restaurant shapes — RestaurantDetailResponseDto /
 * SuspendRestaurantRequestDto / RestaurantReviewItemDto.
 */

export type RestaurantAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  pincode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type RestaurantDetail = {
  restaurantId: string;
  name: string;
  description?: string | null;
  cuisineTypes?: string[] | null;
  address?: RestaurantAddress | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  logoImageUrl?: string | null;
  coverImageUrl?: string | null;
  avgRating?: number | string | null;
  status?: string | null;
  commissionPct?: number | string | null;
  ownerUserCredentialId?: string | null;
};

export type RestaurantReview = {
  restaurantRating: number;
  deliveryRating?: number | null;
  comment?: string | null;
  createdAt?: string | null;
};

export type SuspendRestaurantBody = {
  reason: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function validateSuspendReason(
  reason: string,
): { ok: true; reason: string } | { ok: false; message: string } {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, message: 'Suspend reason is required.' };
  }
  if (trimmed.length > 500) {
    return { ok: false, message: 'Suspend reason must be 500 characters or fewer.' };
  }
  return { ok: true, reason: trimmed };
}

export function formatCommissionPct(
  value: number | string | null | undefined,
): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n}%`;
}
