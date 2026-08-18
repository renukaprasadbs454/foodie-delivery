/**
 * P2-CUS-06 order history / tracking shapes — UI-API MyOrders / LiveOrderTracking /
 * OrderSuccess + backend OrderSummaryResponseDto / OrderResponseDto /
 * TransitionOrderStatusRequestDto.
 */

import type { OrderStatus } from 'foodie-shared-rn';

export type { OrderStatus };

export type OrderSummary = {
  orderId: string;
  orderNumber: string;
  status: string;
  restaurantId?: string;
  totalAmount: number | string;
  placedAt?: string;
};

export type OrderLineItem = {
  menuItemId?: string;
  variantId?: string | null;
  name?: string;
  quantity: number;
  unitPrice?: number | string;
  lineTotal?: number | string;
};

export type OrderStatusEvent = {
  fromStatus?: string | null;
  toStatus?: string;
  occurredAt?: string;
  reason?: string | null;
};

/** Full order detail — extends checkout Order with items / events. */
export type OrderDetail = {
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
  items?: OrderLineItem[];
  orderStatusEvents?: OrderStatusEvent[];
};

export type MyOrdersParams = {
  status?: string;
  page?: number;
  size?: number;
  sort?: OrderSort;
};

export type TransitionOrderStatusArg = {
  orderId: string;
  targetStatus: 'CANCELLED';
  reason: string;
};

export type OrderSort = 'placedAt' | 'totalAmount';

export const ORDER_SORT_WHITELIST: readonly OrderSort[] = [
  'placedAt',
  'totalAmount',
] as const;

export const DEFAULT_ORDERS_PAGE_SIZE = 20;

export const TRACKING_STEPPER_STATUSES: readonly OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

export function isOrderId(value: string): boolean {
  if (!value) return false;
  return value.length > 5;
}

export function isOrderSort(value: string): value is OrderSort {
  return (ORDER_SORT_WHITELIST as readonly string[]).includes(value);
}

export function hasMoreOrderPages(
  page: OrderSummary[] | undefined,
  size: number,
): boolean {
  if (!page) return false;
  return page.length >= size;
}

const TERMINAL: ReadonlySet<string> = new Set([
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
]);

const PRE_PREPARING: ReadonlySet<string> = new Set([
  'PLACED',
  'CONFIRMED',
  'ACCEPTED',
]);

export function isTerminalOrderStatus(status: string | undefined): boolean {
  if (!status) return false;
  return TERMINAL.has(status);
}

/** Customer may cancel only pre-PREPARING (state machine). */
export function canCustomerCancelOrder(status: string | undefined): boolean {
  if (!status) return false;
  return PRE_PREPARING.has(status);
}

export function validateCancelReason(
  reason: string,
): { ok: true; reason: string } | { ok: false; message: string } {
  const trimmed = reason.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'A cancel reason is required.' };
  }
  if (trimmed.length > 500) {
    return { ok: false, message: 'Reason must be at most 500 characters.' };
  }
  return { ok: true, reason: trimmed };
}
