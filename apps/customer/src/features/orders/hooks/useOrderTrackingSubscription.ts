import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { orderTopic, type WebSocketLocation, type WebSocketMessage } from 'foodie-shared-rn';
import { useAppDispatch } from '../../../store/hooks';
import { ordersApi } from '../../../api/endpoints/ordersApi';
import {
  addWebsocketMessageHandler,
  websocketConnect,
  websocketSubscribe,
  websocketUnsubscribe,
} from '../../../store/websocketMiddleware';
import { isTerminalOrderStatus } from '../types';

function parseLocation(message: WebSocketMessage): WebSocketLocation | null {
  if (
    message.type === 'LOCATION_UPDATE' &&
    message.location &&
    typeof message.location.lat === 'number' &&
    typeof message.location.lng === 'number'
  ) {
    return message.location;
  }
  const lat = message.lat;
  const lng = message.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return {
      lat,
      lng,
      timestamp:
        typeof message.timestamp === 'string'
          ? message.timestamp
          : new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Focus-scoped `/topic/order/{orderId}` subscription + location local state.
 * Tears down on blur. Patches getOrder cache on ORDER_STATUS_CHANGED.
 */
export function useOrderTrackingSubscription(
  orderId: string,
  status: string | undefined,
) {
  const dispatch = useAppDispatch();
  const [location, setLocation] = useState<WebSocketLocation | null>(null);
  const [wsActive, setWsActive] = useState(false);
  const terminal = isTerminalOrderStatus(status);

  useFocusEffect(
    useCallback(() => {
      if (!orderId || terminal) {
        setWsActive(false);
        return undefined;
      }

      const destination = orderTopic(orderId);
      dispatch(websocketConnect());

      const remove = addWebsocketMessageHandler(destination, (message) => {
        if (
          message.type === 'ORDER_STATUS_CHANGED' &&
          typeof message.status === 'string' &&
          message.status.length > 0
        ) {
          const nextStatus = message.status;
          dispatch(
            ordersApi.util.updateQueryData('getOrder', orderId, (draft) => {
              draft.status = nextStatus;
            }),
          );
        }
        const nextLocation = parseLocation(message);
        if (nextLocation) {
          setLocation(nextLocation);
        }
      });

      dispatch(websocketSubscribe({ destination }));
      setWsActive(true);

      return () => {
        remove();
        dispatch(websocketUnsubscribe({ destination }));
        setWsActive(false);
      };
    }, [dispatch, orderId, terminal]),
  );

  useEffect(() => {
    if (terminal) {
      setWsActive(false);
    }
  }, [terminal]);

  return { location, wsActive };
}
