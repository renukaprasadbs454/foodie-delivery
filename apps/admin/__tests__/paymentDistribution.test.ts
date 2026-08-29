import { calculatePaymentSplit, isPaymentUuid, validateRefundForm } from '../features/payments/types';

describe('Payment Commission Auto-Split & Escrow System', () => {
  it('calculates exact admin revenue, restaurant share, and rider share with 100% money conservation', () => {
    const config = {
      restaurantCommissionRate: 15,
      deliveryCommissionRate: 10,
      platformFixedFee: 40,
    };

    const foodSubtotal = 450;
    const deliveryFee = 90;

    const split = calculatePaymentSplit(foodSubtotal, deliveryFee, config);

    expect(split.totalPaid).toBe(580);
    expect(split.adminFoodCommission).toBe(67.5);
    expect(split.adminDeliveryCommission).toBe(9);
    expect(split.platformFee).toBe(40);
    expect(split.adminTotalRevenue).toBe(116.5);
    expect(split.restaurantNetShare).toBe(382.5);
    expect(split.deliveryPartnerNetShare).toBe(81);

    // Verify 100% money conservation: Admin + Restaurant + Rider = Total Paid
    const totalDistributed = Number(
      (split.adminTotalRevenue + split.restaurantNetShare + split.deliveryPartnerNetShare).toFixed(2)
    );
    expect(totalDistributed).toBe(split.totalPaid);
  });

  it('handles custom zero commission and high platform fees accurately', () => {
    const customConfig = {
      restaurantCommissionRate: 0,
      deliveryCommissionRate: 0,
      platformFixedFee: 50,
    };

    const split = calculatePaymentSplit(300, 40, customConfig);

    expect(split.totalPaid).toBe(390);
    expect(split.adminTotalRevenue).toBe(50);
    expect(split.restaurantNetShare).toBe(300);
    expect(split.deliveryPartnerNetShare).toBe(40);

    const sum = split.adminTotalRevenue + split.restaurantNetShare + split.deliveryPartnerNetShare;
    expect(sum).toBe(390);
  });

  it('maintains backwards compatibility for refund validation', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(isPaymentUuid(validUuid)).toBe(true);

    const refund = validateRefundForm(validUuid, '250.00', 'Order missing items');
    expect(refund.ok).toBe(true);
    if (refund.ok) {
      expect(refund.body.amount).toBe(250);
      expect(refund.body.reason).toBe('Order missing items');
    }
  });
});
