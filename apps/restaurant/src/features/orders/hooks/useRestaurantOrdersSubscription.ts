import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  restaurantOrdersTopic,
  type WebSocketMessage,
} from 'foodie-shared-rn';
import { useAppDispatch } from '../../../store/hooks';
import { ordersApi } from '../../../api/endpoints/ordersApi';
import {
  addWebsocketMessageHandler,
  websocketConnect,
  websocketSubscribe,
  websocketUnsubscribe,
} from '../../../store/websocketMiddleware';

/**
 * Foreground + focus-scoped `/topic/restaurant/{id}/orders` subscription.
 * Invalidates Order LIST (and patches getOrder when orderId+status present).
 * Unsubscribes on blur or AppState background (SD §13.4).
 */
export function useRestaurantOrdersSubscription(restaurantId: string | null) {
  const dispatch = useAppDispatch();
  const [wsActive, setWsActive] = useState(false);
  const focusedRef = useRef(false);
  const destinationRef = useRef<string | null>(null);
  const removeHandlerRef = useRef<(() => void) | null>(null);

  const tearDown = useCallback(() => {
    const destination = destinationRef.current;
    if (destination) {
      removeHandlerRef.current?.();
      removeHandlerRef.current = null;
      dispatch(websocketUnsubscribe({ destination }));
      destinationRef.current = null;
    }
    setWsActive(false);
  }, [dispatch]);

  const setUp = useCallback(() => {
    if (!restaurantId || !focusedRef.current) return;
    if (AppState.currentState !== 'active') return;
    if (destinationRef.current) return;

    const destination = restaurantOrdersTopic(restaurantId);
    destinationRef.current = destination;
    dispatch(websocketConnect());

    removeHandlerRef.current = addWebsocketMessageHandler(
      destination,
      (message: WebSocketMessage) => {
        if (
          message.type === 'NEW_ORDER_ALERT' ||
          message.type === 'ORDER_STATUS_CHANGED'
        ) {
          dispatch(ordersApi.util.invalidateTags([{ type: 'Order', id: 'LIST' }]));
        }
        if (
          message.type === 'ORDER_STATUS_CHANGED' &&
          typeof message.orderId === 'string' &&
          typeof message.status === 'string' &&
          message.status.length > 0
        ) {
          const orderId = message.orderId;
          const nextStatus = message.status;
          dispatch(
            ordersApi.util.updateQueryData('getOrder', orderId, (draft) => {
              draft.status = nextStatus;
            }),
          );
        }
      },
    );

    dispatch(websocketSubscribe({ destination }));
    setWsActive(true);
  }, [dispatch, restaurantId]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      setUp();
      return () => {
        focusedRef.current = false;
        tearDown();
      };
    }, [setUp, tearDown]),
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        setUp();
      } else {
        tearDown();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      sub.remove();
    };
  }, [setUp, tearDown]);

  return { wsActive };
}
