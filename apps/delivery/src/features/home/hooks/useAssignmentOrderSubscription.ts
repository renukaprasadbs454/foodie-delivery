import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { orderTopic, type WebSocketMessage } from 'foodie-shared-rn';
import { useAppDispatch } from '../../../store/hooks';
import { ordersApi } from '../../../api/endpoints/ordersApi';
import {
  addWebsocketMessageHandler,
  websocketConnect,
  websocketSubscribe,
  websocketUnsubscribe,
} from '../../../store/websocketMiddleware';
import { isTerminalOrderStatus } from '../types';

/**
 * Focus-scoped `/topic/order/{orderId}` — P2-DEL-02 (XAP-01 embedded).
 * Patches getOrder on ORDER_STATUS_CHANGED. GAP-IA-11 residual on auth wording.
 */
export function useAssignmentOrderSubscription(
  orderId: string | undefined,
  status: string | undefined,
) {
  const dispatch = useAppDispatch();
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

      const remove = addWebsocketMessageHandler(
        destination,
        (message: WebSocketMessage) => {
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
        },
      );

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

  return { wsActive };
}
