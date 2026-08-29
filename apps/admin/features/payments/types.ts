/**
 * Payment shapes & Commission Distribution System — Foodie Admin.
 * Handles customer bill payments credited 100% to Admin Master Account
 * and auto-distributed to Restaurants & Delivery Partners based on commission rates.
 */

export type RefundInitiation = {
  refundRequestId: string;
  status: string;
};

export type RefundPaymentBody = {
  amount: number;
  reason: string;
};

export interface CommissionConfig {
  restaurantCommissionRate: number; // e.g. 15 = 15%
  deliveryCommissionRate: number;   // e.g. 10 = 10%
  platformFixedFee: number;         // e.g. 40 = ₹40 fixed platform/packaging fee
}

export interface PaymentSplitBreakdown {
  totalPaid: number;
  foodSubtotal: number;
  deliveryFee: number;
  platformFee: number;
  adminFoodCommission: number;
  adminDeliveryCommission: number;
  adminTotalRevenue: number;
  restaurantNetShare: number;
  deliveryPartnerNetShare: number;
}

export interface PaymentSettlementRecord {
  id: string;
  paymentUuid: string;
  orderId: string;
  customerName: string;
  paymentMethod: 'RAZORPAY_UPI' | 'CREDIT_CARD' | 'FOODIE_WALLET' | 'NET_BANKING';
  totalPaid: number;
  foodSubtotal: number;
  deliveryFee: number;
  adminTotalRevenue: number;
  restaurantNetShare: number;
  restaurantName: string;
  deliveryPartnerNetShare: number;
  driverName: string;
  settlementStatus: 'CREDITED_TO_ADMIN' | 'FUNDS_DISTRIBUTED' | 'REFUNDED';
  settledAt: string;
}

/**
 * Calculates the exact split breakdown when a customer pays an order bill.
 * 1. Customer pays totalBill (100% credited to Admin Master Account).
 * 2. Admin receives: Admin Food Commission + Admin Delivery Commission + Platform Fixed Fee.
 * 3. Restaurant receives: Food Subtotal - Admin Food Commission.
 * 4. Delivery Partner receives: Delivery Fee - Admin Delivery Commission.
 */
export function calculatePaymentSplit(
  foodSubtotal: number,
  deliveryFee: number,
  config: CommissionConfig,
): PaymentSplitBreakdown {
  const safeFood = Math.max(0, foodSubtotal);
  const safeDelivery = Math.max(0, deliveryFee);
  const safeFee = Math.max(0, config.platformFixedFee);

  const adminFoodCommission = Number(((safeFood * config.restaurantCommissionRate) / 100).toFixed(2));
  const adminDeliveryCommission = Number(((safeDelivery * config.deliveryCommissionRate) / 100).toFixed(2));

  const adminTotalRevenue = Number((adminFoodCommission + adminDeliveryCommission + safeFee).toFixed(2));
  const restaurantNetShare = Number((safeFood - adminFoodCommission).toFixed(2));
  const deliveryPartnerNetShare = Number((safeDelivery - adminDeliveryCommission).toFixed(2));

  const totalPaid = Number((safeFood + safeDelivery + safeFee).toFixed(2));

  return {
    totalPaid,
    foodSubtotal: safeFood,
    deliveryFee: safeDelivery,
    platformFee: safeFee,
    adminFoodCommission,
    adminDeliveryCommission,
    adminTotalRevenue,
    restaurantNetShare,
    deliveryPartnerNetShare,
  };
}

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
