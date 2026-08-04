import { createAction, type Middleware } from '@reduxjs/toolkit';
import { createStompClient, type FoodieStompClient } from 'foodie-shared-web';
import { ENV } from '../constants/env';

/**
 * WebSocket middleware shell — Blueprint §34.2.
 * No feature topic subscriptions in Phase 1 foundation.
 * Admin WS connect headers are BFF/feature-owned (shared-web stompClient notes).
 */
export const websocketConnect = createAction('websocket/connect');
export const websocketDisconnect = createAction('websocket/disconnect');
export const websocketSubscribe = createAction<{ destination: string }>(
  'websocket/subscribe',
);
export const websocketUnsubscribe = createAction<{ destination: string }>(
  'websocket/unsubscribe',
);

let client: FoodieStompClient | null = null;

export const websocketMiddleware: Middleware = (_storeApi) => (next) => (action) => {
  const result = next(action);

  if (websocketConnect.match(action)) {
    if (!client) {
      client = createStompClient({
        brokerURL: ENV.wsUrl,
        getConnectHeaders: () => ({}),
      });
    }
    client.connect();
  }

  if (websocketDisconnect.match(action)) {
    client?.disconnect();
    client = null;
  }

  if (websocketSubscribe.match(action) && client?.isConnected()) {
    client.subscribe(action.payload.destination, () => {
      /* Feature handlers patch RTK cache in Phase 2 */
    });
  }

  if (websocketUnsubscribe.match(action)) {
    // Per-destination unsubscribe map is feature-owned in Phase 2.
  }

  return result;
};
