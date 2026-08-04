/**
 * P2-RES-02 order queue / details — UI-API Dashboard / IncomingOrders /
 * RestaurantOrderDetails + OrderSummaryResponseDto / OrderResponseDto /
 * TransitionOrderStatusRequestDto.
 */

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
  eventId?: string;
  fromStatus?: string | null;
  toStatus?: string;
  actorType?: string;
  actorId?: string;
  reason?: string | null;
  createdAt?: string;
  occurredAt?: string;
};

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

export type RestaurantOrdersParams = {
  /** Single OrderStatus enum — backend does not accept comma lists. */
  status?: string;
  page?: number;
  size?: number;
  sort?: OrderSort;
};

export type RestaurantTransitionStatus =
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP';

export type TransitionOrderStatusArg = {
  orderId: string;
  targetStatus: RestaurantTransitionStatus;
  reason?: string | null;
};

/** Restaurant list sort allowlist — placedAt only. */
export type OrderSort = 'placedAt';

export const ORDER_SORT_WHITELIST: readonly OrderSort[] = ['placedAt'] as const;

export const DEFAULT_ORDERS_PAGE_SIZE = 20;

/** Status chips for queue filter (single-value query). */
export const QUEUE_STATUS_FILTERS = [
  '',
  'CONFIRMED',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isOrderId(value: string): boolean {
  return UUID_RE.test(value);
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

export function isTerminalOrderStatus(status: string | undefined): boolean {
  if (!status) return false;
  return TERMINAL.has(status);
}

/** Restaurant-allowed next actions from current status (client UX; server enforces). */
export function restaurantActionsForStatus(
  status: string | undefined,
): RestaurantTransitionStatus[] {
  switch (status) {
    case 'CONFIRMED':
      return ['ACCEPTED', 'REJECTED'];
    case 'ACCEPTED':
      return ['PREPARING'];
    case 'PREPARING':
      return ['READY_FOR_PICKUP'];
    default:
      return [];
  }
}

export function validateRejectReason(
  reason: string,
): { ok: true; reason: string } | { ok: false; message: string } {
  const trimmed = reason.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'A reject reason is required.' };
  }
  if (trimmed.length > 500) {
    return { ok: false, message: 'Reason must be at most 500 characters.' };
  }
  return { ok: true, reason: trimmed };
}

export function formatMoney(value: number | string | undefined): string {
  if (value === undefined || value === null) return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₹${n.toFixed(2)}`;
}
