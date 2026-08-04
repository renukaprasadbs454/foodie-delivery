import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Switch, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Badge,
  Button,
  ListItem,
  Modal,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetNotificationsQuery } from '../../../api/endpoints/notificationsApi';
import { selectUserId } from '../../auth/authSlice';
import { logoutRestaurant } from '../../auth/session';
import {
  loadLocalPushRegistration,
  requestLocalPushRegistration,
  type LocalPushRegistration,
} from '../../notifications/pushRegistration';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { store } from '../../../store/store';
import type { ProfileStackParamList } from '../../../navigation/types';
import {
  loadLocalSettings,
  saveLocalSettings,
  type LocalRestaurantSettings,
} from '../localSettings';

type Props = NativeStackScreenProps<ProfileStackParamList, 'RestaurantSettings'>;

/**
 * P2-RES-04 Settings + P2-RES-05 optional unread badge (UI-API).
 * No dedicated inbox (GAP-IA-02). Device-token Gap for push sync.
 */
export function RestaurantSettingsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const [settings, setSettings] = useState<LocalRestaurantSettings>({
    notificationsEnabled: false,
  });
  const [pushRegistration, setPushRegistration] =
    useState<LocalPushRegistration>({
      permissionStatus: 'undetermined',
      deviceToken: null,
      lastPromptedAt: null,
      lastResolvedAt: null,
      lastUserId: null,
    });
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const unreadQuery = useGetNotificationsQuery(
    { unreadOnly: true, page: 0, size: 20 },
    { refetchOnFocus: true },
  );

  const unreadCount = useMemo(
    () => unreadQuery.data?.length ?? 0,
    [unreadQuery.data],
  );

  useEffect(() => {
    trackAnalyticsEvent('restaurant_settings_viewed');
    void loadLocalSettings().then(setSettings);
    void loadLocalPushRegistration().then(setPushRegistration);
  }, []);

  const onToggleNotifications = async (value: boolean) => {
    const next = { ...settings, notificationsEnabled: value };
    setSettings(next);
    await saveLocalSettings(next);
    if (value && userId) {
      const registration = await requestLocalPushRegistration(userId);
      setPushRegistration(registration);
      setToast({
        message:
          registration.permissionStatus === 'granted'
            ? 'Device token captured locally only. Backend registration is still blocked by GAP-API-01.'
            : 'Notification permission is not granted. You can enable it later from system settings.',
        variant:
          registration.permissionStatus === 'granted' ? 'info' : 'warning',
      });
      return;
    }
    setToast({
      message:
        'Local push preference saved. Backend registration is still blocked by GAP-API-01.',
      variant: 'info',
    });
  };

  const onLogout = async () => {
    setLoggingOut(true);
    trackAnalyticsEvent('logout_tapped');
    if (!isConnected) {
      setToast({
        message: 'Offline — clearing local session anyway.',
        variant: 'warning',
      });
    }
    try {
      await logoutRestaurant(dispatch, store.getState.bind(store));
      trackAnalyticsEvent('session_logged_out');
    } finally {
      setLoggingOut(false);
      setLogoutVisible(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        paddingVertical: tokens.spacing.md,
        gap: tokens.spacing.md,
      }}
    >
      <View style={{ paddingHorizontal: tokens.spacing.md }}>
        <Text variant="heading1" accessibilityRole="header">
          Settings
        </Text>
      </View>

      <ListItem
        title="Unread notifications"
        subtitle={
          unreadQuery.isError
            ? 'Could not load unread count'
            : unreadCount === 0
              ? 'No unread notifications'
              : `${unreadCount} unread (badge only — no inbox UI)`
        }
        accessibilityLabel={`Unread notifications ${unreadCount}`}
        trailing={
          unreadCount > 0 ? (
            <Badge
              label={String(Math.min(unreadCount, 99))}
              tone="accent"
              accessibilityLabel={`${unreadCount} unread`}
            />
          ) : (
            <Text variant="caption" color={tokens.color.textSecondary}>
              0
            </Text>
          )
        }
        onPress={() => {
          trackAnalyticsEvent('notifications_gap_tapped', { gap: 'GAP-IA-02' });
          navigation.navigate('NotificationsHome');
        }}
      />

      <ListItem
        title="Notifications"
        subtitle="Local preference + OS permission only (device-token Gap)"
        accessibilityLabel="Notifications preference"
        trailing={
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => {
              void onToggleNotifications(v);
            }}
            accessibilityLabel="Notifications"
            accessibilityRole="switch"
            accessibilityState={{ checked: settings.notificationsEnabled }}
          />
        }
      />

      <ListItem
        title="Push registration"
        subtitle={
          pushRegistration.permissionStatus === 'granted'
            ? pushRegistration.deviceToken
              ? `Permission granted · token captured locally (${pushRegistration.deviceToken.slice(0, 10)}...)`
              : 'Permission granted · token capture pending locally'
            : pushRegistration.permissionStatus === 'denied'
              ? 'Permission denied · backend registration still blocked'
              : 'Permission not requested yet'
        }
        accessibilityLabel="Push registration status"
      />

      <ListItem
        title="Open system settings"
        subtitle="Manage OS notification permission"
        accessibilityLabel="Open system settings"
        onPress={() => {
          void Linking.openSettings();
        }}
      />

      <View
        style={{
          paddingHorizontal: tokens.spacing.md,
          marginTop: tokens.spacing.lg,
        }}
      >
        <Button
          label="Log out"
          accessibilityLabel="Log out"
          variant="danger"
          onPress={() => setLogoutVisible(true)}
        />
      </View>

      <Modal
        visible={logoutVisible}
        onRequestClose={() => setLogoutVisible(false)}
        title="Log out?"
        accessibilityLabel="Confirm logout"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body">
            You will need to sign in again with OTP.
          </Text>
          <Button
            label="Log out"
            accessibilityLabel="Confirm log out"
            loading={loggingOut}
            onPress={() => {
              void onLogout();
            }}
          />
          <Button
            label="Cancel"
            accessibilityLabel="Cancel log out"
            variant="secondary"
            onPress={() => setLogoutVisible(false)}
          />
        </View>
      </Modal>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}
