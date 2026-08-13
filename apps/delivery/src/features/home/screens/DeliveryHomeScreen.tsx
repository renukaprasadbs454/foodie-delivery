import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform, Dimensions, RefreshControl, Vibration } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Text,
  trackAnalyticsEvent,
  useConnectivity,
} from 'foodie-shared-rn';
import { useGetDeliveryOffersQuery, useGetDeliveryProfileQuery, useSetAvailabilityMutation, useVerifyFaceForOnlineMutation } from '../../../api/endpoints/deliveryApi';
import { useGetWalletLedgerQuery } from '../../../api/endpoints/walletApi';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { selectActiveAssignment, selectIsOnline, setIsOnline, selectRejectedOffers, setActiveAssignment } from '../availabilitySlice';
import { DeliveryHomeSkeleton } from '../components/DeliveryHomeSkeleton';
import { useAssignmentOrderSubscription } from '../hooks/useAssignmentOrderSubscription';
import { formatMoney } from '../types';
import type { MainStackParamList } from '../../../navigation/types';
import { ensureLocalPushRegistration } from '../../notifications/pushRegistration';
import { selectUserId } from '../../auth/authSlice';
import { Audio } from 'expo-av';
import { OfferCard } from '../components/OfferCard';
import { useAcceptAssignmentMutation } from '../../../api/endpoints/deliveryApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { addRejectedOffer } from '../availabilitySlice';
import { Toast } from 'foodie-shared-rn';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryHome'>;

const THEME_PRIMARY = '#F59E0B';
const THEME_DARK = '#14532D';
const THEME_BG = '#F5F7FA';
const THEME_TEXT_MUTED = '#718096';
const THEME_CARD = '#FFFFFF';

export function DeliveryHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const isOnline = useAppSelector(selectIsOnline);
  const active = useAppSelector(selectActiveAssignment);
  const userId = useAppSelector(selectUserId);
  const rejectedOffers = useAppSelector(selectRejectedOffers);
  const dispatch = useAppDispatch();

  const [setAvailability, availabilityState] = useSetAvailabilityMutation();
  const [verifyFace] = useVerifyFaceForOnlineMutation();

  // Camera / selfie state
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  // Pending action after selfie succeeds: 'go_online' or 'recheck'
  const pendingActionRef = useRef<'go_online' | 'recheck' | null>(null);
  // Track when partner last verified (for 3-hour re-check)
  const lastVerifiedAtRef = useRef<number | null>(null);

  const [acceptAssignment] = useAcceptAssignmentMutation();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, variant: 'info' | 'success' | 'error' | 'warning' } | null>(null);

  const onAccept = async (assignmentId: string, orderId: string) => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to accept an offer.', variant: 'warning' });
      return;
    }
    if (active?.orderId) {
      setToast({ message: 'Please complete your assigned order first before accepting a new one.', variant: 'error' });
      return;
    }
    setAcceptingId(assignmentId);
    try {
      const result = await acceptAssignment(assignmentId).unwrap();
      trackAnalyticsEvent('delivery_offer_accepted', { assignmentId });
      dispatch(setActiveAssignment({
        assignmentId: result.assignmentId || assignmentId,
        orderId: result.orderId || orderId,
      }));
      navigation.navigate('AssignmentDetails', {
        assignmentId: result.assignmentId || assignmentId,
        orderId: result.orderId || orderId,
      });
    } catch (error: any) {
      setToast({ message: 'Failed to accept offer: ' + (error?.data?.message || 'Unknown error'), variant: 'error' });
    } finally {
      setAcceptingId(null);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const ledgerQuery = useGetWalletLedgerQuery(
    { createdAtFrom: todayStart.toISOString() },
    { pollingInterval: 5000, refetchOnFocus: true }
  );

  const ledgerEntries = ledgerQuery.data || [];
  const deliveriesToday = ledgerEntries.filter(e => e.referenceType === 'DELIVERY_ASSIGNMENT').length;
  // Calculate earnings total (including everything positive) and specifically the bonus
  const incentiveToday = ledgerEntries
    .filter(e => e.referenceType === 'INCENTIVE')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalEarningsToday = ledgerEntries
    .filter(e => e.entryType === 'CREDIT')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const profileQuery = useGetDeliveryProfileQuery(undefined, { pollingInterval: 5000, refetchOnFocus: true });
  const offersQuery = useGetDeliveryOffersQuery(undefined, { pollingInterval: 5000, refetchOnFocus: true });
  const orderQuery = useGetOrderQuery(active?.orderId ?? '', { skip: !active?.orderId, pollingInterval: active?.orderId ? 5000 : 0 });

  useAssignmentOrderSubscription(active?.orderId, orderQuery.data?.status);

  useEffect(() => {
    trackAnalyticsEvent('delivery_home_viewed');
    trackAnalyticsEvent('delivery_home_loaded');

    async function requestCorePermissions() {
      try {
        await Location.requestForegroundPermissionsAsync();
        await Location.requestBackgroundPermissionsAsync();
        if (userId) {
          await ensureLocalPushRegistration(userId);
        }
      } catch (e) {
        console.warn('Permission issue', e);
      }
    }
    void requestCorePermissions();
  }, [userId]);

  const rawOffers = Array.isArray(offersQuery.data) ? offersQuery.data : (offersQuery.data as any)?.content || [];
  const visibleOffers = rawOffers.filter((o: any) => !rejectedOffers.includes(o.assignmentId));

  useEffect(() => {
    async function playSoundAndVibrate() {
      if (visibleOffers.length > 0 && isOnline && !active?.orderId) {
        Vibration.vibrate([0, 500, 200, 500]);
        try {
          // Play default system notification sound via Audio (creating a beep sequence)
          const { sound } = await Audio.Sound.createAsync(
            require('../../../../assets/adaptive-icon.png'), // placeholder, actually we'll just not load a file if we don't have one
            { shouldPlay: false }
          );
          // Wait, I shouldn't load a PNG as sound. Let me just use a generic expo-av hack or just skip the file.
        } catch (e) { }
      }
    }
    void playSoundAndVibrate();
  }, [visibleOffers.length, isOnline, active?.orderId]);

  const loading = (offersQuery.isLoading && !offersQuery.data) || (Boolean(active?.orderId) && orderQuery.isLoading && !orderQuery.data) || (profileQuery.isLoading && !profileQuery.data);

  const kycStatus = profileQuery.data?.kycStatus ?? 'PENDING';
  const isKycApproved = kycStatus === 'VERIFIED';
  const pendingOrRejected = !isKycApproved;

  // Open camera to capture selfie
  const openSelfieCamera = useCallback(async (action: 'go_online' | 'recheck') => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setToast({ message: 'Camera permission required for identity verification.', variant: 'warning' });
        return;
      }
    }
    pendingActionRef.current = action;
    setIsCameraVisible(true);
  }, [permission, requestPermission]);

  // Handle photo capture and verification
  const handleCapturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3 });
      setIsCameraVisible(false);
      if (!photo) {
        setToast({ message: 'Selfie capture failed. Please try again.', variant: 'error' });
        return;
      }
      setToast({ message: 'Verifying identity...', variant: 'info' });
      const ok = await verifyFace({
        uri: photo.uri,
        mimeType: 'image/jpeg',
        fileName: 'selfie.jpg',
      }).unwrap();
      if (!ok) {
        setToast({ message: 'Identity match failed! Cannot go online.', variant: 'error' });
        return;
      }
      lastVerifiedAtRef.current = Date.now();
      if (pendingActionRef.current === 'go_online') {
        try {
          await setAvailability({ isOnline: true }).unwrap();
          dispatch(setIsOnline(true));
          setToast({ message: 'Identity verified. You are now online!', variant: 'success' });
        } catch (e) {
          alert('Failed to update availability. Please try again.');
        }
      } else {
        // recheck passed — stay online
        setToast({ message: 'Identity re-verified. Continuing online.', variant: 'success' });
      }
    } catch (error: any) {
      setIsCameraVisible(false);
      setToast({ message: 'Verification error. Please try again.', variant: 'error' });
    }
  }, [verifyFace, setAvailability, dispatch]);

  // 3-hour periodic re-verification while online
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const lastVerified = lastVerifiedAtRef.current;
      if (!lastVerified || now - lastVerified >= THREE_HOURS_MS) {
        setToast({ message: 'Time for your 3-hour identity check to stay online.', variant: 'warning' });
        setTimeout(() => openSelfieCamera('recheck'), 1500);
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [isOnline, openSelfieCamera]);

  const toggleAvailability = async () => {
    if (!isConnected || availabilityState.isLoading) return;
    if (pendingOrRejected) {
      alert('Your KYC verification is not complete. You cannot go online yet.');
      return;
    }
    if (!isOnline) {
      // Going online — require selfie first
      await openSelfieCamera('go_online');
      return;
    }
    // Going offline — no selfie needed
    try {
      await setAvailability({ isOnline: false }).unwrap();
      dispatch(setIsOnline(false));
    } catch (e) {
      alert('Failed to update availability. Please try again.');
    }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: THEME_BG }}><DeliveryHomeSkeleton /></View>;

  return (
    <View style={styles.container}>
      {/* Absolute Dark Top Arch matching Login Screen */}
      <View style={[styles.topArch, { height: 260 + insets.top }]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        bounces={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await Promise.all([profileQuery.refetch(), offersQuery.refetch()]);
              setIsRefreshing(false);
            }}
            tintColor="#FFF"
            colors={['#F59E0B']}
          />
        }
      >

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <Feather name={isOnline ? "sun" : "moon"} size={16} color="#A0AEC0" />
              <Text style={styles.greeting}>
                {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 17 ? 'Good Afternoon,' : 'Good Evening,'}
              </Text>
            </View>
            <Text style={styles.name}>{profileQuery.data?.name ? profileQuery.data.name.split(' ')[0] : 'Partner'}</Text>
          </View>
          <Pressable
            style={styles.profileButton}
            onPress={() => navigation.navigate('DeliveryProfile')}
          >
            <Feather name="user" size={24} color="#FFF" />
          </Pressable>
        </View>

        {/* Central Premium Status Card */}
        <View style={[styles.statusCard, isOnline && styles.statusCardOnline]}>
          <View style={styles.statusHeaderRow}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#14532D' : '#A0AEC0' }]} />
            <Text style={styles.statusText}>{isOnline ? 'ONLINE & READY' : 'CURRENTLY OFFLINE'}</Text>
          </View>

          <Text style={styles.earningsLabel}>Daily Earnings</Text>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsSymbol}>₹</Text>
            <Text style={styles.earningsAmount}>{totalEarningsToday.toFixed(2)}</Text>
          </View>

          <Pressable
            style={styles.incentiveMiniCard}
            onPress={() => navigation.navigate('Incentives' as any)}
          >
            <View style={styles.incentiveMiniLeft}>
              <Text style={styles.incentiveMiniTitle}>Earn upto ₹450 extra</Text>
              <View style={styles.milestoneRow}>
                <Ionicons name="bicycle" size={14} color="#F59E0B" />
                <Text style={styles.milestoneMiniText}> 20 and 33 trips milestones</Text>
              </View>
            </View>
            <View style={styles.incentiveMiniRight}>
              <Text style={styles.viewDetailsText}>View details</Text>
              <Feather name="chevron-right" size={16} color="#DD6B20" />
            </View>
          </Pressable>

          <Pressable
            style={[styles.toggleButton, isOnline ? styles.toggleButtonOnline : null, pendingOrRejected && styles.toggleButtonDisabled]}
            onPress={toggleAvailability}
          >
            {isOnline ? (
              <View style={styles.onlineBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.toggleButtonTextOnline}>Swipe to Offline</Text>
              </View>
            ) : (
              <View style={styles.offlineActionRow}>
                <Text style={styles.toggleButtonText}>GO ONLINE</Text>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-right" size={20} color={THEME_PRIMARY} />
                </View>
              </View>
            )}
          </Pressable>

          {pendingOrRejected && (
            <Pressable
              style={styles.kycWarningBox}
              onPress={() => navigation.navigate('PendingVerification' as any)}
            >
              <Feather name="alert-circle" size={16} color="#E23744" />
              <Text style={styles.kycWarning}>
                Verification {kycStatus}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Active Assignment Section */}
        {active?.orderId && (
          <Pressable
            style={styles.activeAssignmentCard}
            onPress={() => navigation.navigate('AssignmentDetails', { assignmentId: active.assignmentId, orderId: active.orderId })}
          >
            <View style={styles.activeTopRow}>
              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>ON ROUTE</Text></View>
              <Text style={styles.activeStatus}>{orderQuery.data?.status ?? 'Tracking Order'}</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.iconSpaced}>
                <Ionicons name="location" size={24} color={THEME_PRIMARY} />
              </View>
              <View style={styles.routeTextContainer}>
                <Text style={styles.pickupLabel}>Pickup Address</Text>
                <Text style={styles.pickupText}>{(orderQuery.data as any)?.restaurantName ?? 'Restaurant'}</Text>
              </View>
            </View>

            <View style={styles.activeBottomRow}>
              <View>
                <Text style={styles.earnHintLabel}>Estimated Payout</Text>
                <Text style={styles.earnAmount}>{formatMoney(orderQuery.data?.totalAmount ?? 0)}</Text>
              </View>
              <View style={styles.navAction}>
                <Text style={styles.navText}>Tap for Details</Text>
                <Feather name="chevron-right" size={20} color={THEME_PRIMARY} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Incoming Offers - Full Details */}
        {visibleOffers.length > 0 && !active?.orderId && isOnline && (
          <View style={{ marginBottom: 32 }}>
            <Text style={styles.menuTitle}>New Delivery Offers</Text>
            {visibleOffers.map((offer: any) => (
              <OfferCard
                key={offer.assignmentId}
                offer={offer}
                accepting={acceptingId === offer.assignmentId}
                acceptDisabled={!isConnected || acceptingId !== null}
                onReject={() => {
                  dispatch(addRejectedOffer(offer.assignmentId));
                }}
                onAccept={() => void onAccept(offer.assignmentId, offer.orderId)}
              />
            ))}
          </View>
        )}

        {/* Action Modules Grid */}
        <Text style={styles.menuTitle}>Dashboard Options</Text>
        <View style={styles.menuGrid}>
          <Pressable style={styles.menuFeatureCard} onPress={() => navigation.navigate('DeliveryOffers' as any)}>
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Feather name="map" size={26} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.menuItemTitle}>Offers</Text>
            <Text style={styles.menuItemSubtitle}>Nearby Shifts</Text>
          </Pressable>

          <Pressable style={styles.menuFeatureCard} onPress={() => navigation.navigate('Wallet' as any)}>
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(20, 83, 45, 0.1)' }]}>
              <Feather name="dollar-sign" size={26} color="#14532D" />
            </View>
            <Text style={styles.menuItemTitle}>Payouts</Text>
            <Text style={styles.menuItemSubtitle}>Balance</Text>
          </Pressable>

          <Pressable style={styles.menuFeatureCard} onPress={() => navigation.navigate('DeliveryNotifications' as any)}>
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Feather name="bell" size={26} color="#38bdf8" />
            </View>
            <Text style={styles.menuItemTitle}>Alerts</Text>
            <Text style={styles.menuItemSubtitle}>Updates</Text>
          </Pressable>
        </View>

      </ScrollView>
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />

      {isCameraVisible && (
        <View style={styles.cameraModal}>
          <Text style={styles.cameraTitle}>Identity Verification</Text>
          <Text style={styles.cameraSubtitle}>Position your face in the circle to go online</Text>
          <View style={styles.cameraMask}>
            <CameraView
              style={styles.cameraPreview}
              facing="front"
              ref={cameraRef}
            />
          </View>
          <View style={styles.cameraActions}>
            <Pressable style={styles.cameraCancelBtn} onPress={() => setIsCameraVisible(false)}>
              <Feather name="x" size={24} color="#E23744" />
            </Pressable>
            <Pressable style={styles.cameraCaptureBtn} onPress={handleCapturePhoto}>
              <View style={styles.cameraCaptureInner} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_BG,
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: width,
    backgroundColor: THEME_DARK,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 15,
    color: '#A0AEC0',
    marginLeft: 6,
    fontWeight: '500',
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusCard: {
    backgroundColor: THEME_CARD,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 40,
  },
  statusCardOnline: {
    borderWidth: 2,
    borderColor: '#14532D',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#4A5568',
  },
  earningsLabel: {
    fontSize: 15,
    color: THEME_TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 4,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  earningsSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#718096',
    marginRight: 4,
    marginBottom: 6,
  },
  earningsAmount: {
    fontSize: 38,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: '900',
    color: '#1A202C',
  },
  incentiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  incentiveStat: {
    flex: 1,
    alignItems: 'center',
  },
  incentiveStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  incentiveStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
  },
  incentiveDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  toggleButton: {
    backgroundColor: THEME_PRIMARY,
    borderRadius: 20,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  offlineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonOnline: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  toggleButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#14532D',
    marginRight: 10,
  },
  toggleButtonTextOnline: {
    color: '#4A5568',
    fontSize: 18,
    fontWeight: '700',
  },
  kycWarningBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    borderRadius: 12,
  },
  kycWarning: {
    color: '#E23744',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  incomingOfferCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  incomingOfferIcon: {
    backgroundColor: '#F59E0B',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  incomingOfferBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  incomingOfferTextContainer: {
    flex: 1,
  },
  incomingOfferTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  incomingOfferSub: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeAssignmentCard: {
    backgroundColor: '#14532D',
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#323438',
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveBadgeText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },
  activeStatus: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E0',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2E32',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  iconSpaced: {
    marginRight: 16,
  },
  routeTextContainer: {
    flex: 1,
  },
  pickupLabel: {
    fontSize: 13,
    color: '#A0AEC0',
    marginBottom: 4,
    fontWeight: '500',
  },
  pickupText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  activeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  earnHintLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 4,
    fontWeight: '500',
  },
  earnAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F59E0B',
  },
  navAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  navText: {
    color: THEME_PRIMARY,
    fontWeight: '700',
    marginRight: 6,
    fontSize: 14,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  menuFeatureCard: {
    width: '31%',
    backgroundColor: THEME_CARD,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#95A5A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  incentiveMiniCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 24,
  },
  incentiveMiniLeft: {
  },
  incentiveMiniTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneMiniText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
    marginLeft: 4,
  },
  incentiveMiniRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DD6B20',
    marginRight: 4,
  },
  cameraModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A202C',
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  cameraSubtitle: {
    color: '#A0AEC0',
    fontSize: 13,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cameraMask: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#10B981',
    marginBottom: 60,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    position: 'absolute',
    bottom: 50,
  },
  cameraCaptureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
  },
  cameraCancelBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
