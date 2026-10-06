import type { SemanticColorTokens } from './tokens';

/**
 * OrderStatus + DeliveryAssignment.status → semantic color roles.
 * Blueprint §22.2; enums from 04_API_Contracts.md Module 6 / Phase3 §3.7.
 */
export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export type DeliveryAssignmentStatus =
  | 'OFFERED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export type StatusColorRole = keyof Pick<
  SemanticColorTokens,
  'success' | 'error' | 'warning' | 'inProgress' | 'accent' | 'textSecondary'
>;

const ORDER_STATUS_COLOR: Record<OrderStatus, StatusColorRole> = {
  PLACED: 'inProgress',
  CONFIRMED: 'inProgress',
  ACCEPTED: 'success',
  PREPARING: 'inProgress',
  READY_FOR_PICKUP: 'inProgress',
  ASSIGNED: 'inProgress',
  PICKED_UP: 'inProgress',
  OUT_FOR_DELIVERY: 'inProgress',
  DELIVERED: 'success',
  REJECTED: 'error',
  CANCELLED: 'error',
};

const ASSIGNMENT_STATUS_COLOR: Record<DeliveryAssignmentStatus, StatusColorRole> = {
  OFFERED: 'warning',
  ACCEPTED: 'success',
  PICKED_UP: 'inProgress',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

export function getOrderStatusColorRole(status: OrderStatus): StatusColorRole {
  return ORDER_STATUS_COLOR[status];
}

export function getDeliveryAssignmentStatusColorRole(
  status: DeliveryAssignmentStatus,
): StatusColorRole {
  return ASSIGNMENT_STATUS_COLOR[status];
}

export function resolveStatusColor(
  colors: SemanticColorTokens,
  role: StatusColorRole,
): string {
  return colors[role];
}
