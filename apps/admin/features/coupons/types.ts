/**
 * P2-ADM-05 coupon shapes — CreateCouponRequestDto / CouponResponseDto /
 * DeactivateCouponResponseDto (§13.4 / §13.5).
 */

export const DISCOUNT_TYPES = ['FLAT', 'PERCENT'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type CreateCouponBody = {
  code: string;
  discountType: DiscountType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  expiryDate: string;
  usageLimitTotal?: number | null;
  usageLimitPerUser: number;
  restaurantId?: string | null;
};

export type Coupon = {
  couponId: string;
  code: string;
  discountType: string;
  value: number | string;
  minOrderAmount: number | string;
  maxDiscountAmount?: number | string | null;
  expiryDate?: string | null;
  usageLimitTotal?: number | null;
  usageLimitPerUser: number;
  restaurantId?: string | null;
  isActive: boolean;
};

export type DeactivateCouponResult = {
  couponId: string;
  isActive: boolean;
};

const CODE_RE = /^[A-Z0-9_]{3,30}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCouponUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isDiscountType(value: string): value is DiscountType {
  return (DISCOUNT_TYPES as readonly string[]).includes(value);
}

export type CreateCouponFormInput = {
  code: string;
  discountType: string;
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  expiryDate: string;
  usageLimitTotal: string;
  usageLimitPerUser: string;
  restaurantId: string;
};

export function validateCreateCoupon(
  input: CreateCouponFormInput,
): { ok: true; body: CreateCouponBody } | { ok: false; message: string } {
  const code = input.code.trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    return {
      ok: false,
      message: 'Code must match A–Z / 0–9 / _ and be 3–30 characters.',
    };
  }
  if (!isDiscountType(input.discountType)) {
    return { ok: false, message: 'Discount type must be FLAT or PERCENT.' };
  }
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0.01) {
    return { ok: false, message: 'Value must be at least 0.01.' };
  }
  if (input.discountType === 'PERCENT' && value > 100) {
    return { ok: false, message: 'Percent value cannot exceed 100.' };
  }
  const minOrderAmount = Number(input.minOrderAmount);
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    return { ok: false, message: 'Minimum order amount must be ≥ 0.' };
  }

  let maxDiscountAmount: number | null | undefined;
  if (input.maxDiscountAmount.trim()) {
    maxDiscountAmount = Number(input.maxDiscountAmount);
    if (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0) {
      return { ok: false, message: 'Max discount must be greater than 0 when set.' };
    }
  } else {
    maxDiscountAmount = null;
  }
  if (input.discountType === 'PERCENT') {
    if (maxDiscountAmount == null || maxDiscountAmount <= 0) {
      return {
        ok: false,
        message: 'Max discount is required for PERCENT coupons.',
      };
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiryDate)) {
    return { ok: false, message: 'Expiry date must be YYYY-MM-DD (future).' };
  }
  const today = new Date();
  const todayIso = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
  if (input.expiryDate <= todayIso) {
    return { ok: false, message: 'Expiry date must be in the future.' };
  }

  const usageLimitPerUser = Number(input.usageLimitPerUser);
  if (!Number.isInteger(usageLimitPerUser) || usageLimitPerUser < 1) {
    return { ok: false, message: 'Usage limit per user must be an integer ≥ 1.' };
  }

  let usageLimitTotal: number | null | undefined;
  if (input.usageLimitTotal.trim()) {
    usageLimitTotal = Number(input.usageLimitTotal);
    if (!Number.isInteger(usageLimitTotal) || usageLimitTotal < 1) {
      return { ok: false, message: 'Usage limit total must be an integer ≥ 1.' };
    }
  } else {
    usageLimitTotal = null;
  }

  let restaurantId: string | null | undefined;
  if (input.restaurantId.trim()) {
    if (!UUID_RE.test(input.restaurantId.trim())) {
      return { ok: false, message: 'Restaurant ID must be a valid UUID when set.' };
    }
    restaurantId = input.restaurantId.trim();
  } else {
    restaurantId = null;
  }

  return {
    ok: true,
    body: {
      code,
      discountType: input.discountType,
      value,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate: input.expiryDate,
      usageLimitTotal,
      usageLimitPerUser,
      restaurantId,
    },
  };
}
