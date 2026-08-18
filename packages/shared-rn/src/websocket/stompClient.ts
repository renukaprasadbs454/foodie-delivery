import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import type { AccessToken } from '../types/tokens';
import type { WebSocketMessage } from '../types/websocket';
import { logger } from '../utils/logger';

/**
 * STOMP-over-SockJS client wrapper — Blueprint §34 / System Design §13 /
 * 04_API_Contracts.md WebSocket Contracts.
 *
 * Feature subscriptions are NOT registered here — apps' websocketMiddleware
 * owns subscribe/unsubscribe lifecycle (focus/blur). This module is infrastructure only.
 */

export type StompClientConfig = {
  /** e.g. https://api.foodie.example.com/ws (SockJS endpoint) */
  brokerURL: string;
  getAccessToken: () => AccessToken | string | null | undefined;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
  /**
   * Optional SockJS factory. Apps typically:
   * `webSocketFactory: () => new SockJS(brokerURL) as unknown as WebSocket`
   */
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
  /** Re-auth with fresh token on reconnect (System Design §13.1). */
  updateAuthHeader: () => void;
};

export function createStompClient(config: StompClientConfig): FoodieStompClient {
  const subscriptions = new Map<string, StompSubscription>();

  const resolveAuthHeader = (): Record<string, string> => {
    const token = config.getAccessToken();
    if (!token) return {};
    return { Authorization: `Bearer ${String(token)}` };
  };

  const client = new Client({
    brokerURL: config.webSocketFactory ? undefined : config.brokerURL,
    webSocketFactory: config.webSocketFactory,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectHeaders: resolveAuthHeader(),
    beforeConnect: () => {
      // Fresh token on every reconnect — System Design §13.1
      client.connectHeaders = resolveAuthHeader();
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
      // logger.error('WebSocket transport error'); // Silenced to prevent terminal spam in Dev LAN
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
      if (!client.active) {
        client.activate();
      }
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
      if (existing) {
        existing.unsubscribe();
      }
      const sub = client.subscribe(destination, (raw) => {
        try {
          const parsed = JSON.parse(raw.body) as WebSocketMessage;
          handler(parsed, raw);
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
      for (const sub of subscriptions.values()) {
        sub.unsubscribe();
      }
      subscriptions.clear();
    },
    isConnected() {
      return client.connected;
    },
    updateAuthHeader() {
      client.connectHeaders = resolveAuthHeader();
    },
  };
}
