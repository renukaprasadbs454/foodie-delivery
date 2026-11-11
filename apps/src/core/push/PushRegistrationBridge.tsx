import { useEffect } from 'react';
import { selectAuthStatus, selectUserId } from '@/features/auth/authSlice';
import { ensureLocalPushRegistration } from '@/features/notifications/pushRegistration';
import { useRegisterDeviceTokenMutation } from '@/api/endpoints/notificationsApi';
import { useAppSelector } from '@/store/hooks';

export function PushRegistrationBridge() {
  const authStatus = useAppSelector(selectAuthStatus);
  const userId = useAppSelector(selectUserId);
  const [registerToken] = useRegisterDeviceTokenMutation();

  useEffect(() => {
    if (authStatus !== 'authenticated' || !userId) {
      return;
    }

    void ensureLocalPushRegistration(userId).then((reg) => {
      if (reg?.deviceToken) {
        registerToken(reg.deviceToken).catch(() => {});
      }
    }).catch(() => {});
  }, [authStatus, userId, registerToken]);

  return null;
}
