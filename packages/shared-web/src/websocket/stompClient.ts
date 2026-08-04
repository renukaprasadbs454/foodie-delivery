import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import type { WebSocketMessage } from '../types/websocket';
import { logger } from '../utils/logger';

/**
 * STOMP-over-SockJS client for Admin when needed.
 * Blueprint §34 / 04_API_Contracts.md WebSocket Contracts.
 *
 * Auth: Admin browser cannot read JWT from httpOnly cookies. Connection auth
 * for Admin WS (if used) must be mediated by BFF ticket/proxy patterns owned
 * by foodie-admin — this wrapper accepts an explicit connect header provider
 * and does not invent a ticket endpoint.
 */

export type StompClientConfig = {
  brokerURL: string;
  getConnectHeaders?: () => Record<string, string>;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
  webSocketFactory?: () => WebSocket;
  debug?: boolean;
};

export type FoodieStompClient = {
  connect: () => void;
  disconnect: () => void;
  subscribe: (
    destination: string,
    handler: (message: WebSocketMessage, raw: IMessage) => void,
  ) => StompSubscription | null;
  unsubscribeAll: () => void;
  isConnected: () => boolean;
  updateConnectHeaders: () => void;
};

export function createStompClient(config: StompClientConfig): FoodieStompClient {
  const subscriptions = new Map<string, StompSubscription>();

  const resolveHeaders = () => config.getConnectHeaders?.() ?? {};

  const client = new Client({
    brokerURL: config.webSocketFactory ? undefined : config.brokerURL,
    webSocketFactory: config.webSocketFactory,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectHeaders: resolveHeaders(),
    beforeConnect: () => {
      client.connectHeaders = resolveHeaders();
    },
    onConnect: () => {
      logger.info('WebSocket connected');
      config.onConnect?.();
    },
    onDisconnect: () => {
      logger.warn('WebSocket disconnected');
      config.onDisconnect?.();
    },
    onStompError: (frame) => {
      logger.error('WebSocket STOMP error', {
        message: frame.headers['message'] ?? frame.body,
      });
      config.onError?.(frame);
    },
    onWebSocketError: (event) => {
      logger.error('WebSocket transport error');
      config.onError?.(event);
    },
    debug: config.debug
      ? (msg) => {
          logger.debug(msg);
        }
      : () => undefined,
  });

  return {
    connect() {
      if (!client.active) client.activate();
    },
    disconnect() {
      subscriptions.clear();
      void client.deactivate();
    },
    subscribe(destination, handler) {
      if (!client.connected) {
        logger.warn('WebSocket subscribe skipped — not connected', {
          destination,
        });
        return null;
      }
      const existing = subscriptions.get(destination);
      existing?.unsubscribe();
      const sub = client.subscribe(destination, (raw) => {
        try {
          handler(JSON.parse(raw.body) as WebSocketMessage, raw);
        } catch (error) {
          logger.error('WebSocket message parse failed', {
            destination,
            message: error instanceof Error ? error.message : 'unknown',
          });
        }
      });
      subscriptions.set(destination, sub);
      return sub;
    },
    unsubscribeAll() {
      for (const sub of subscriptions.values()) sub.unsubscribe();
      subscriptions.clear();
    },
    isConnected() {
      return client.connected;
    },
    updateConnectHeaders() {
      client.connectHeaders = resolveHeaders();
    },
  };
}
