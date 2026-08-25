/**
 * P2-CUS-05 Payment — UI-API Payment + API §7.1 initiation DTO.
 */

export type PaymentInitiation = {
  razorpayOrderId?: string | null; // optional — omit for mock/simple payment mode
  amount: number | string;
  currency: string;
  keyId: string;
};

export const ORDER_STATUS_CONFIRMED = 'CONFIRMED';
export const ORDER_STATUS_PLACED = 'PLACED';

/** Terminal failure-ish statuses while awaiting payment confirmation. */
export const ORDER_PAYMENT_FAILED_STATUSES = [
  'CANCELLED',
  'REJECTED',
] as const;

export function isConfirmedStatus(status: string | undefined): boolean {
  return status === ORDER_STATUS_CONFIRMED;
}

export function isPaymentFailedStatus(status: string | undefined): boolean {
  if (!status) return false;
  return (ORDER_PAYMENT_FAILED_STATUSES as readonly string[]).includes(status);
}
