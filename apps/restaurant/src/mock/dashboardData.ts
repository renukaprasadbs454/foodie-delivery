import { MOCK_ORDERS } from './orderData';
import { MOCK_RESTAURANT_PROFILE } from './restaurantData';
import type { OrderSummary } from '../features/orders/types';

export type DashboardSummary = {
  restaurantName: string;
  isOpen: boolean;
  status: string;
  todayOrdersCount: number;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  grossRevenue: number;
  recentOrders: OrderSummary[];
};

export function getMockDashboardSummaryData(ordersList = MOCK_ORDERS): DashboardSummary {
  const todayOrdersCount = ordersList.length;

  const pendingOrdersCount = ordersList.filter((o) =>
    ['CONFIRMED', 'PENDING'].includes(o.status),
  ).length;

  const completedOrdersCount = ordersList.filter((o) =>
    ['DELIVERED', 'COMPLETED', 'READY_FOR_PICKUP'].includes(o.status),
  ).length;

  const grossRevenue = ordersList.reduce((sum, o) => {
    const amt = typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount) || 0;
    return sum + amt;
  }, 0);

  const recentOrders: OrderSummary[] = ordersList.slice(0, 5).map((o) => ({
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    status: o.status,
    restaurantId: o.restaurantId,
    totalAmount: o.totalAmount,
    placedAt: o.placedAt,
  }));

  return {
    restaurantName: MOCK_RESTAURANT_PROFILE.name,
    isOpen: MOCK_RESTAURANT_PROFILE.isOpen,
    status: MOCK_RESTAURANT_PROFILE.status ?? 'APPROVED',
    todayOrdersCount,
    pendingOrdersCount,
    completedOrdersCount,
    grossRevenue,
    recentOrders,
  };
}

export const MOCK_DASHBOARD_SUMMARY = getMockDashboardSummaryData();
