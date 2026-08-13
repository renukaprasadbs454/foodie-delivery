import { useEffect } from 'react';
import {
  selectAuthStatus,
  selectUserId,
} from '../../features/auth/authSlice';
import { ensureLocalPushRegistration } from '../../features/notifications/pushRegistration';
import { useAppSelector } from '../../store/hooks';

export function PushRegistrationBridge() {
  const authStatus = useAppSelector(selectAuthStatus);
  const userId = useAppSelector(selectUserId);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !userId) {
      return;
    }

    void ensureLocalPushRegistration(userId);
  }, [authStatus, userId]);

  return null;
}
