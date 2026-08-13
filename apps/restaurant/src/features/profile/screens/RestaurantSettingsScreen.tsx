import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, Switch, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Badge,
  Button,
  Card,
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

const BRAND_PRIMARY = '#14532D'; // Dark Green

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
  const [activeModal, setActiveModal] = useState<
    'help' | 'contact' | 'privacy' | 'terms' | null
  >(null);

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
            ? 'Notification permissions granted.'
            : 'Notification permission is not granted in system settings.',
        variant:
          registration.permissionStatus === 'granted' ? 'info' : 'warning',
      });
      return;
    }
    setToast({
      message: 'Notification preference saved.',
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
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: tokens.spacing.md,
          paddingBottom: 80,
          gap: tokens.spacing.md,
        }}
      >
        <View style={{ paddingHorizontal: tokens.spacing.md }}>
          <Text variant="heading1" style={{ color: BRAND_PRIMARY }} accessibilityRole="header">
            Settings & Support
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Notification preferences, app info, support & policies
          </Text>
        </View>

        {/* RESTAURANT & PAYOUT MANAGEMENT */}
        <View style={{ gap: 2 }}>
          <Text variant="label" style={{ paddingHorizontal: tokens.spacing.md, color: tokens.color.textSecondary }}>
            RESTAURANT & PAYOUT MANAGEMENT
          </Text>

          <ListItem
            title="🏪 Restaurant Information"
            subtitle="Name, branding, description & cuisine specialties"
            accessibilityLabel="Restaurant Information"
            onPress={() => navigation.navigate('RestaurantProfile')}
          />

          <ListItem
            title="📞 Contact Information"
            subtitle="Store phone, email & operational opening hours"
            accessibilityLabel="Contact Information"
            onPress={() => navigation.navigate('RestaurantProfile')}
          />

          <ListItem
            title="📍 Restaurant Location"
            subtitle="Manage your restaurant's physical address, map pin & GPS coordinates"
            accessibilityLabel="Restaurant Location"
            onPress={() => navigation.navigate('RestaurantLocation')}
          />

          <ListItem
            title="🏦 Bank & Payout Details"
            subtitle="Payout bank account, account number & UPI VPA handle"
            accessibilityLabel="Bank and Payout Details"
            onPress={() => navigation.navigate('BankAndBusinessDetails')}
          />

          <ListItem
            title="📜 Tax & Legal Information"
            subtitle="GSTIN, PAN number, business structure & FSSAI license"
            accessibilityLabel="Tax and Legal Information"
            onPress={() => navigation.navigate('BankAndBusinessDetails')}
          />

          <ListItem
            title="🔒 Security & Session"
            subtitle="Device sessions, access tokens & authentication settings"
            accessibilityLabel="Security"
            onPress={() => {
              setToast({
                message: 'Active session is securely authenticated via JWT token.',
                variant: 'info',
              });
            }}
          />
        </View>

        {/* NOTIFICATION PREFERENCES */}
        <View style={{ gap: 2, marginTop: tokens.spacing.xs }}>
          <Text variant="label" style={{ paddingHorizontal: tokens.spacing.md, color: tokens.color.textSecondary }}>
            APP PREFERENCES
          </Text>
          <ListItem
            title="Unread notifications"
            subtitle={
              unreadQuery.isError
                ? 'Could not load unread count'
                : unreadCount === 0
                  ? 'No unread notifications'
                  : `${unreadCount} unread notifications`
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
            subtitle="Local push alert preferences"
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
            title="Push registration status"
            subtitle={
              pushRegistration.permissionStatus === 'granted'
                ? pushRegistration.deviceToken
                  ? `Active (${pushRegistration.deviceToken.slice(0, 12)}...)`
                  : 'Permission granted · token pending'
                : pushRegistration.permissionStatus === 'denied'
                  ? 'Permission denied in OS'
                  : 'Not requested yet'
            }
            accessibilityLabel="Push registration status"
          />

          <ListItem
            title="Open system settings"
            subtitle="Manage device notification permissions"
            accessibilityLabel="Open system settings"
            onPress={() => {
              void Linking.openSettings();
            }}
          />
        </View>

        {/* HELP & SUPPORT SECTION */}
        <View style={{ gap: 2, marginTop: tokens.spacing.sm }}>
          <Text variant="label" style={{ paddingHorizontal: tokens.spacing.md, color: tokens.color.textSecondary }}>
            SUPPORT & POLICIES
          </Text>

          <ListItem
            title="❓ Help & Support"
            subtitle="Merchant FAQs, order handling & menu tips"
            accessibilityLabel="Help & Support"
            onPress={() => setActiveModal('help')}
          />

          <ListItem
            title="📞 Contact Support"
            subtitle="Partner helpline, email & operational support"
            accessibilityLabel="Contact Support"
            onPress={() => setActiveModal('contact')}
          />

          <ListItem
            title="🔒 Privacy Policy"
            subtitle="Data privacy, partner terms & security standards"
            accessibilityLabel="Privacy Policy"
            onPress={() => setActiveModal('privacy')}
          />

          <ListItem
            title="📜 Terms & Conditions"
            subtitle="Partner portal service level agreement & guidelines"
            accessibilityLabel="Terms & Conditions"
            onPress={() => setActiveModal('terms')}
          />

          <ListItem
            title="ℹ️ App Version"
            subtitle="v1.2.0 (Build 2026.08) · Foodie Partner Portal"
            accessibilityLabel="App Version v1.2.0"
          />
        </View>

        {/* ACCOUNT & LOGOUT SECTION */}
        <View style={{ gap: 2, marginTop: tokens.spacing.sm }}>
          <Text variant="label" style={{ paddingHorizontal: tokens.spacing.md, color: tokens.color.textSecondary }}>
            ACCOUNT & SESSION
          </Text>

          <ListItem
            title="🚪 Logout"
            subtitle="Sign out of your restaurant partner account"
            accessibilityLabel="Logout list item"
            onPress={() => setLogoutVisible(true)}
          />
        </View>

        {/* LOGOUT BUTTON */}
        <View
          style={{
            paddingHorizontal: tokens.spacing.md,
            marginTop: tokens.spacing.md,
          }}
        >
          <Button
            label="Log out of Partner Portal"
            accessibilityLabel="Log out"
            variant="danger"
            disabled={loggingOut}
            onPress={() => setLogoutVisible(true)}
          />
        </View>
      </ScrollView>

      {/* HELP & SUPPORT MODAL */}
      <Modal
        visible={activeModal === 'help'}
        onRequestClose={() => setActiveModal(null)}
        title="Help & Support Guide"
        accessibilityLabel="Help and Support Modal"
      >
        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: tokens.spacing.md }}>
          <Card style={{ padding: tokens.spacing.sm, gap: 4 }}>
            <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
              How do live incoming orders work?
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Orders stream in real-time when customer payments are confirmed. You can accept, prepare, and mark orders ready for pickup directly from the Live Order Queue.
            </Text>
          </Card>

          <Card style={{ padding: tokens.spacing.sm, gap: 4 }}>
            <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
              How do I update dish availability?
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Navigate to Menu management tab and use the quick in-stock switch on any dish card to toggle availability instantly.
            </Text>
          </Card>

          <Card style={{ padding: tokens.spacing.sm, gap: 4 }}>
            <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
              How do I edit business details?
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Go to Profile tab to update restaurant description, cuisine choices, address, cover banner, and logo photo.
            </Text>
          </Card>

          <Button
            label="Close Guide"
            accessibilityLabel="Close help modal"
            variant="secondary"
            onPress={() => setActiveModal(null)}
          />
        </ScrollView>
      </Modal>

      {/* CONTACT SUPPORT MODAL */}
      <Modal
        visible={activeModal === 'contact'}
        onRequestClose={() => setActiveModal(null)}
        title="Contact Partner Support"
        accessibilityLabel="Contact Support Modal"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body">
            Our dedicated Restaurant Partner Support team is available 24/7 to assist with active orders, payouts, and portal issues.
          </Text>

          <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.xs }}>
            <Text variant="label" style={{ color: BRAND_PRIMARY }}>
              📞 Partner Support Line
            </Text>
            <Text variant="body" style={{ fontWeight: 'bold' }}>
              +1 (800) 555-FOODIE
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Toll-free 24/7 hotline for urgent live order updates
            </Text>
          </Card>

          <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.xs }}>
            <Text variant="label" style={{ color: BRAND_PRIMARY }}>
              ✉️ Email Support
            </Text>
            <Text variant="body" style={{ fontWeight: 'bold' }}>
              partners@foodie.app
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Response within 2 hours for account & payment inquiries
            </Text>
          </Card>

          <Button
            label="Close Contact Info"
            accessibilityLabel="Close contact modal"
            variant="secondary"
            onPress={() => setActiveModal(null)}
          />
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        visible={activeModal === 'privacy'}
        onRequestClose={() => setActiveModal(null)}
        title="Privacy Policy"
        accessibilityLabel="Privacy Policy Modal"
      >
        <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: tokens.spacing.sm }}>
          <Text variant="label" style={{ color: BRAND_PRIMARY }}>
            Foodie Partner Data Standard
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            We respect your business data privacy. Information collected includes restaurant profile metadata, order activity, dish details, and device notification tokens.
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Data is strictly utilized for routing orders to delivery partners, processing settlements, and optimizing restaurant operations.
          </Text>
          <Button
            label="Close Privacy Policy"
            accessibilityLabel="Close privacy modal"
            variant="secondary"
            onPress={() => setActiveModal(null)}
            style={{ marginTop: tokens.spacing.sm }}
          />
        </ScrollView>
      </Modal>

      {/* TERMS & CONDITIONS MODAL */}
      <Modal
        visible={activeModal === 'terms'}
        onRequestClose={() => setActiveModal(null)}
        title="Terms & Conditions"
        accessibilityLabel="Terms and Conditions Modal"
      >
        <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: tokens.spacing.sm }}>
          <Text variant="label" style={{ color: BRAND_PRIMARY }}>
            Restaurant Partner Agreement
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            1. Partners must maintain accurate food preparation times and update out-of-stock items promptly.
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            2. Orders accepted must meet health and food safety standards.
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            3. Commission rates and payouts are processed according to merchant agreement schedules.
          </Text>
          <Button
            label="Close Terms"
            accessibilityLabel="Close terms modal"
            variant="secondary"
            onPress={() => setActiveModal(null)}
            style={{ marginTop: tokens.spacing.sm }}
          />
        </ScrollView>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={logoutVisible}
        onRequestClose={() => !loggingOut && setLogoutVisible(false)}
        title="Logout"
        accessibilityLabel="Confirm logout modal"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body" color={tokens.color.textPrimary}>
            Are you sure you want to logout?
          </Text>

          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button
              label="Cancel"
              accessibilityLabel="Cancel logout"
              variant="secondary"
              disabled={loggingOut}
              onPress={() => setLogoutVisible(false)}
            />
            <Button
              label="Logout"
              accessibilityLabel="Confirm logout"
              loading={loggingOut}
              disabled={loggingOut}
              style={{ backgroundColor: '#DC2626' }}
              onPress={() => {
                void onLogout();
              }}
            />
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
    </View>
  );
}

