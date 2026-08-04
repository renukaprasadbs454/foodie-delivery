/**
 * P2-ADM-04 order shapes — OrderResponseDto / OverrideOrderStatusRequestDto.
 */

export const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'REJECTED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  menuItemId?: string;
  variantId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
};

export type OrderStatusEvent = {
  eventId?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorType?: string | null;
  actorId?: string | null;
  reason?: string | null;
  createdAt?: string | null;
};

export type AdminOrder = {
  orderId: string;
  orderNumber: string;
  status: OrderStatus | string;
  customerId?: string;
  restaurantId?: string;
  addressId?: string;
  subtotal?: number | string;
  deliveryFee?: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  totalAmount?: number | string;
  placedAt?: string | null;
  items?: OrderItem[] | null;
  orderStatusEvents?: OrderStatusEvent[] | null;
};

export type OverrideOrderStatusBody = {
  targetStatus: OrderStatus;
  reason: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isOrderUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function validateOverrideReason(
  reason: string,
): { ok: true; reason: string } | { ok: false; message: string } {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, message: 'Override reason is required.' };
  }
  if (trimmed.length > 500) {
    return { ok: false, message: 'Override reason must be 500 characters or fewer.' };
  }
  return { ok: true, reason: trimmed };
}

export function validateOverrideBody(
  targetStatus: string,
  reason: string,
): { ok: true; body: OverrideOrderStatusBody } | { ok: false; message: string } {
  if (!isOrderStatus(targetStatus)) {
    return { ok: false, message: 'Select a valid target status.' };
  }
  const reasonResult = validateOverrideReason(reason);
  if (!reasonResult.ok) return reasonResult;
  return {
    ok: true,
    body: { targetStatus, reason: reasonResult.reason },
  };
}

export function formatMoneyInr(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '₹—';
  return `₹${n.toFixed(2)}`;
}
