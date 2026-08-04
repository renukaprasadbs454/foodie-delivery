/**
 * P2-ADM-04 payment refund shapes — RefundPaymentRequestDto /
 * RefundInitiationResponseDto. No payments list GET (GAP-API-17).
 */

export type RefundInitiation = {
  refundRequestId: string;
  status: string;
};

export type RefundPaymentBody = {
  amount: number;
  reason: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPaymentUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function validateRefundForm(
  paymentId: string,
  amountRaw: string,
  reason: string,
):
  | { ok: true; paymentId: string; body: RefundPaymentBody }
  | { ok: false; message: string } {
  const id = paymentId.trim();
  if (!isPaymentUuid(id)) {
    return { ok: false, message: 'Enter a valid payment UUID.' };
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 0.01) {
    return { ok: false, message: 'Amount must be at least 0.01.' };
  }
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, message: 'Refund reason is required.' };
  }
  if (trimmed.length > 500) {
    return { ok: false, message: 'Refund reason must be 500 characters or fewer.' };
  }
  return {
    ok: true,
    paymentId: id,
    body: { amount, reason: trimmed },
  };
}
