import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { userNotificationsTopic } from 'foodie-shared-rn';
import { notificationsApi } from '../../../api/endpoints/notificationsApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectUserId } from '../../auth/authSlice';
import {
  addWebsocketMessageHandler,
  websocketConnect,
  websocketSubscribe,
  websocketUnsubscribe,
} from '../../../store/websocketMiddleware';

/**
 * Focus-scoped optional `/topic/user/{userCredentialId}/notifications`.
 * On NOTIFICATION, invalidate inbox list (suppress push when subscribed).
 */
export function useNotificationsSubscription() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;

      const destination = userNotificationsTopic(userId);
      dispatch(websocketConnect());

      const remove = addWebsocketMessageHandler(destination, (message) => {
        if (message.type === 'NOTIFICATION') {
          dispatch(
            notificationsApi.util.invalidateTags([
              { type: 'Notification', id: 'LIST' },
            ]),
          );
        }
      });

      dispatch(websocketSubscribe({ destination }));

      return () => {
        remove();
        dispatch(websocketUnsubscribe({ destination }));
      };
    }, [dispatch, userId]),
  );
}
