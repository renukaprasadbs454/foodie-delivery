/**
 * Canonical STOMP topics — 04_API_Contracts.md WebSocket Contracts.
 * Do not invent additional topics.
 */
export function orderTopic(orderId: string): string {
  return `/topic/order/${orderId}`;
}

export function restaurantOrdersTopic(restaurantId: string): string {
  return `/topic/restaurant/${restaurantId}/orders`;
}

export function userNotificationsTopic(userCredentialId: string): string {
  return `/topic/user/${userCredentialId}/notifications`;
}
