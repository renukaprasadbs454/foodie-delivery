import React, { useEffect, useState } from 'react';
import { Linking, Switch, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  ListItem,
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
    <SafeAreaView style={styles.container}>
      <View style={[styles.topArch, { height: 180 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>App preferences and access management</Text>
        </View>

        <View style={styles.settingsGroupList}>

          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                <Feather name="bell" size={20} color="#38bdf8" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Local preference + OS permission</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) => { void onToggleNotifications(v); }}
                trackColor={{ false: '#CBD5E0', true: '#F59E0B' }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Feather name="radio" size={20} color="#14532D" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Push Registration</Text>
                <Text style={styles.settingSubtitle}>
                  {pushRegistration.permissionStatus === 'granted'
                    ? pushRegistration.deviceToken
                      ? `Granted · Token: ${pushRegistration.deviceToken.slice(0, 10)}...`
                      : 'Granted · Token pending'
                    : pushRegistration.permissionStatus === 'denied'
                      ? 'Denied · Backend registration blocked'
                      : 'Permission not requested'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.settingCard}
            onPress={() => void Linking.openSettings()}
          >
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                <Feather name="map-pin" size={20} color="#ec4899" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Location Services</Text>
                <Text style={styles.settingSubtitle}>Background tracking for availability</Text>
              </View>
              <Feather name="external-link" size={18} color="#A0AEC0" />
            </View>
          </Pressable>

          <Pressable
            style={styles.settingCard}
            onPress={() => {
              trackAnalyticsEvent('notification_permission_tapped', { action: 'os_settings' });
              void Linking.openSettings();
            }}
          >
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Feather name="sliders" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>System Settings</Text>
                <Text style={styles.settingSubtitle}>Manage OS-level permissions</Text>
              </View>
              <Feather name="external-link" size={18} color="#A0AEC0" />
            </View>
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={() => setLogoutVisible(true)}
          >
            <Feather name="log-out" size={20} color="#E23744" />
            <Text style={styles.logoutButtonText}>Sign Out Securely</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={logoutVisible}
        onRequestClose={() => setLogoutVisible(false)}
        accessibilityLabel="Confirm logout"
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBox}>
              <Feather name="log-out" size={32} color="#E23744" />
            </View>
            <Text style={styles.modalTitle}>Ready to leave?</Text>
            <Text style={styles.modalBody}>
              You will need to sign in again to accept incoming deliveries.
            </Text>
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setLogoutVisible(false)}
                disabled={loggingOut}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={() => void onLogout()}
                disabled={loggingOut}
              >
                <Text style={styles.modalConfirmText}>{loggingOut ? 'Signing out...' : 'Log Out'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

import { StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#14532D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  settingsGroupList: {
    gap: 12,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
    paddingRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226, 55, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(226, 55, 68, 0.2)',
    borderRadius: 20,
    height: 56,
    marginTop: 16,
    gap: 12,
  },
  logoutButtonText: {
    color: '#E23744',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 32, 44, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 10,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(226, 55, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E23744',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
