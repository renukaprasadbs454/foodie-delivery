import { createAction, type Middleware } from '@reduxjs/toolkit';
import {
  createStompClient,
  type FoodieStompClient,
  type WebSocketMessage,
} from 'foodie-shared-rn';
import { ENV } from '../constants/env';
import {
  selectAccessToken,
  type AuthState,
} from '../features/auth/authSlice';

/**
 * WebSocket middleware — Blueprint §34.2 / P2-RES-02 (XAP-01 embedded).
 * Handlers stay outside Redux (non-serializable); actions carry destinations only.
 */
export const websocketConnect = createAction('websocket/connect');
export const websocketDisconnect = createAction('websocket/disconnect');
export const websocketSubscribe = createAction<{ destination: string }>(
  'websocket/subscribe',
);
export const websocketUnsubscribe = createAction<{ destination: string }>(
  'websocket/unsubscribe',
);

type MessageHandler = (message: WebSocketMessage) => void;

const destinationHandlers = new Map<string, Set<MessageHandler>>();
const desiredDestinations = new Set<string>();
const activeSubs = new Map<string, { unsubscribe: () => void }>();

let client: FoodieStompClient | null = null;

/** Register a feature handler for a destination. Returns disposer. */
export function addWebsocketMessageHandler(
  destination: string,
  handler: MessageHandler,
): () => void {
  let set = destinationHandlers.get(destination);
  if (!set) {
    set = new Set();
    destinationHandlers.set(destination, set);
  }
  set.add(handler);
  return () => {
    set!.delete(handler);
    if (set!.size === 0) {
      destinationHandlers.delete(destination);
    }
  };
}

function dispatchToHandlers(destination: string, message: WebSocketMessage) {
  const set = destinationHandlers.get(destination);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(message);
    } catch {
      /* feature handlers must not break the bus */
    }
  }
}

function subscribeDestination(destination: string) {
  if (!client?.isConnected()) return;
  if (activeSubs.has(destination)) return;
  const sub = client.subscribe(destination, (message) => {
    dispatchToHandlers(destination, message);
  });
  if (sub) {
    activeSubs.set(destination, sub);
  }
}

function unsubscribeDestination(destination: string) {
  const sub = activeSubs.get(destination);
  if (sub) {
    sub.unsubscribe();
    activeSubs.delete(destination);
  }
}

function resubscribeAll() {
  activeSubs.clear();
  for (const destination of desiredDestinations) {
    subscribeDestination(destination);
  }
}

export const websocketMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);

  if (websocketConnect.match(action)) {
    if (!client) {
      client = createStompClient({
        brokerURL: ENV.wsUrl,
        getAccessToken: () =>
          selectAccessToken(storeApi.getState() as { auth: AuthState }),
        onConnect: () => {
          resubscribeAll();
        },
        onDisconnect: () => {
          activeSubs.clear();
        },
      });
    }
    client.connect();
  }

  if (websocketDisconnect.match(action)) {
    desiredDestinations.clear();
    activeSubs.clear();
    client?.disconnect();
    client = null;
  }

  if (websocketSubscribe.match(action)) {
    const { destination } = action.payload;
    desiredDestinations.add(destination);
    if (!client) {
      client = createStompClient({
        brokerURL: ENV.wsUrl,
        getAccessToken: () =>
          selectAccessToken(storeApi.getState() as { auth: AuthState }),
        onConnect: () => {
          resubscribeAll();
        },
        onDisconnect: () => {
          activeSubs.clear();
        },
      });
      client.connect();
    } else if (!client.isConnected()) {
      client.connect();
    }
    subscribeDestination(destination);
  }

  if (websocketUnsubscribe.match(action)) {
    const { destination } = action.payload;
    desiredDestinations.delete(destination);
    unsubscribeDestination(destination);
  }

  return result;
};
