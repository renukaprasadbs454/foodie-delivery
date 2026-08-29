/**
 * P2-CUS-04 Checkout shapes — UI-API Checkout + API §2.4 / §11 / §6.1
 * (AddressResponseDto, EligibleCouponResponseDto, ApplyCoupon*, OrderResponseDto).
 */

export type CustomerAddress = {
  addressId: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  pincode: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isDefault: boolean;
};

export type EligibleCoupon = {
  code: string;
  discountType: string;
  value: number | string;
  minOrderAmount?: number | string | null;
  maxDiscountAmount?: number | string | null;
  expiryDate?: string | null;
};

export type ApplyCouponRequest = {
  code: string;
  restaurantId: string;
  cartTotal: number | string;
};

export type ApplyCouponResult = {
  code: string;
  discountAmount: number | string;
  finalTotal: number | string;
};

export type CreateOrderRequest = {
  addressId: string;
  couponCode?: string | null;
};

export type Order = {
  orderId: string;
  orderNumber: string;
  status: string;
  customerId?: string;
  restaurantId?: string;
  addressId?: string;
  subtotal: number | string;
  deliveryFee: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  placedAt?: string;
};

export const MAX_COUPON_CODE_LENGTH = 30;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAddressId(value: string): boolean {
  return UUID_RE.test(value);
}

export function isOrderId(value: string): boolean {
  if (!value) return false;
  return value.length > 5;
}

export function validateCouponCode(
  code: string,
): { ok: true; code: string } | { ok: false; message: string } {
  const trimmed = code.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Enter a coupon code.' };
  }
  if (trimmed.length > MAX_COUPON_CODE_LENGTH) {
    return {
      ok: false,
      message: `Coupon code must be at most ${MAX_COUPON_CODE_LENGTH} characters.`,
    };
  }
  return { ok: true, code: trimmed };
}
