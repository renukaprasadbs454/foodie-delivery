/**
 * WebSocket payload types from 04_API_Contracts.md WebSocket Contracts.
 */
export type WebSocketMessageType =
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_ASSIGNMENT_CANCELLED'
  | 'LOCATION_UPDATE'
  | 'NEW_ORDER_ALERT'
  | 'NOTIFICATION';

export type WebSocketLocation = {
  lat: number;
  lng: number;
  timestamp: string;
};

export type WebSocketMessage = {
  type: WebSocketMessageType;
  orderId?: string;
  status?: string;
  location?: WebSocketLocation;
  timestamp: string;
  [key: string]: unknown;
};
