import React, { useEffect, useState } from 'react';
import { Linking, Switch, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  ListItem,
  Modal,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { selectUserId } from '../../auth/authSlice';
import { logoutDelivery } from '../../auth/session';
import {
  loadLocalPushRegistration,
  requestLocalPushRegistration,
  type LocalPushRegistration,
} from '../../notifications/pushRegistration';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { store } from '../../../store/store';
import type { MainStackParamList } from '../../../navigation/types';
import {
  loadLocalSettings,
  saveLocalSettings,
  type LocalDeliverySettings,
} from '../localSettings';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliverySettings'>;

/**
 * P2-DEL-05 Settings + P2-XAP-03 local push registration.
 * Device-token backend sync remains Gap-blocked (GAP-API-01).
 */
export function DeliverySettingsScreen(_props: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);
  const [settings, setSettings] = useState<LocalDeliverySettings>({
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

  useEffect(() => {
    trackAnalyticsEvent('delivery_settings_viewed');
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
      trackAnalyticsEvent('notification_permission_tapped', {
        enabled: value,
        gap: 'device_token',
        permissionStatus: registration.permissionStatus,
      });
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
    trackAnalyticsEvent('notification_permission_tapped', {
      enabled: value,
      gap: 'device_token',
    });
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
      await logoutDelivery(dispatch, store.getState.bind(store));
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
        title="Location for availability"
        subtitle="Background location is required to go online. Manage permission in system settings."
        accessibilityLabel="Location permission explainer"
        onPress={() => {
          void Linking.openSettings();
        }}
      />

      <ListItem
        title="Open system settings"
        subtitle="Manage OS notification and location permission"
        accessibilityLabel="Open system settings"
        onPress={() => {
          trackAnalyticsEvent('notification_permission_tapped', {
            action: 'os_settings',
          });
          void Linking.openSettings();
        }}
      />

      <View style={{ paddingHorizontal: tokens.spacing.md, marginTop: tokens.spacing.lg }}>
        <Button
          label="Log out"
          accessibilityLabel="Log out"
          variant="secondary"
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
            You will need to sign in again to accept deliveries.
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
