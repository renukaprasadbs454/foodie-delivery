import { MOCK_RESTAURANT_PROFILE, type MockRestaurantProfile } from './restaurantData';
import { MOCK_FULL_MENU, MOCK_CATEGORIES } from './menuData';
import { MOCK_ORDERS, MOCK_ORDER_SUMMARIES, type ExtendedOrderDetail } from './orderData';
import { MOCK_REVIEWS, type ExtendedRestaurantReview } from './reviewData';
import { MOCK_DASHBOARD_SUMMARY, getMockDashboardSummaryData, type DashboardSummary } from './dashboardData';
import type { FullMenu, MenuCategory, MenuItem } from '../features/menu/types';
import type { OrderSummary } from '../features/orders/types';

export * from './restaurantData';
export * from './menuData';
export * from './orderData';
export * from './reviewData';
export * from './dashboardData';
export * from './bankAndBusinessData';
export * from './locationData';



/**
 * Returns mock restaurant profile data
 */
export function getMockRestaurantProfile(): MockRestaurantProfile {
  return MOCK_RESTAURANT_PROFILE;
}

/**
 * Returns mock full menu with categories and items
 */
export function getMockMenu(): FullMenu {
  return MOCK_FULL_MENU;
}

/**
 * Returns mock order summaries, optionally filtered by status
 */
export function getMockOrders(statusFilter?: string): OrderSummary[] {
  if (!statusFilter) {
    return MOCK_ORDER_SUMMARIES;
  }
  const cleanFilter = statusFilter.toUpperCase();
  return MOCK_ORDERS.filter((o) => {
    const st = o.status.toUpperCase();
    if (cleanFilter === 'CONFIRMED') return st === 'CONFIRMED' || st === 'PENDING';
    if (cleanFilter === 'DELIVERED') return st === 'DELIVERED' || st === 'COMPLETED';
    if (cleanFilter === 'REJECTED') return st === 'REJECTED' || st === 'CANCELLED';
    return st === cleanFilter;
  }).map((o) => ({
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    status: o.status,
    restaurantId: o.restaurantId,
    totalAmount: o.totalAmount,
    placedAt: o.placedAt,
  }));
}

/**
 * Returns mock order detail by orderId, or first mock order if not found
 */
export function getMockOrderDetails(orderId?: string): ExtendedOrderDetail {
  if (!orderId) return MOCK_ORDERS[0];
  const found = MOCK_ORDERS.find((o) => o.orderId === orderId);
  return found ?? MOCK_ORDERS[0];
}

/**
 * Returns mock customer reviews, optionally filtered by star rating or sorted
 */
export function getMockReviews(
  ratingFilter?: number | null,
  sort?: string,
): ExtendedRestaurantReview[] {
  let list = [...MOCK_REVIEWS];
  if (ratingFilter !== null && ratingFilter !== undefined && ratingFilter > 0) {
    list = list.filter((r) => Math.round(r.restaurantRating) === ratingFilter);
  }
  if (sort) {
    list.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
      if (sort === 'oldest') {
        return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      }
      if (sort === 'highest') {
        return b.restaurantRating - a.restaurantRating;
      }
      if (sort === 'lowest') {
        return a.restaurantRating - b.restaurantRating;
      }
      return 0;
    });
  }
  return list;
}

/**
 * Returns calculated mock dashboard summary
 */
export function getMockDashboardSummary(): DashboardSummary {
  return MOCK_DASHBOARD_SUMMARY;
}
