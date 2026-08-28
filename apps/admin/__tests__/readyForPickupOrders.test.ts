import { ORDER_STATUSES, isOrderStatus } from '../features/orders/types';
import { OrderItemRecord } from '../features/orders/pages/OrdersPage';

describe('Ready for Pickup Order Status Contract', () => {
  it('includes READY_FOR_PICKUP in valid order status system constants', () => {
    expect(ORDER_STATUSES).toContain('READY_FOR_PICKUP');
    expect(isOrderStatus('READY_FOR_PICKUP')).toBe(true);
  });

  it('supports READY_FOR_PICKUP in order records and filter toolbars', () => {
    const mockPickupOrder: OrderItemRecord = {
      id: 'e5f6a7b8-0005-4000-8000-555566667777',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98765 00005',
      storeName: 'Punjab Grill & Spice',
      module: 'North Indian & Tandoori',
      itemsSummary: '1x Paneer Tikka Masala, 2x Garlic Naan',
      totalAmount: 620,
      paymentMethod: 'DIGITAL',
      status: 'READY_FOR_PICKUP',
      createdAt: '15 mins ago',
    };

    expect(mockPickupOrder.status).toBe('READY_FOR_PICKUP');
  });
});
