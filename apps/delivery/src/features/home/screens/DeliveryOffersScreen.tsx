import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENV } from '../../../constants/env';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

import {
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useAcceptAssignmentMutation,
  useGetDeliveryOffersQuery,
} from '../../../api/endpoints/deliveryApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectUserId } from '../../auth/authSlice';
import {
  selectIsOnline,
  setActiveAssignment,
  addRejectedOffer,
  selectRejectedOffers
} from '../availabilitySlice';
import { OfferCard } from '../components/OfferCard';
import { OfferListSkeleton } from '../components/OfferListSkeleton';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryOffers'>;

/**
 * P2-DEL-02 — GET /delivery/offers + POST /delivery/assignments/{id}/accept.
 * Accept-only (GAP-API-10 — no decline). Accept blocked offline.
 * P2-OPT-01 — FlatList virtualization (SD §25).
 */

export function DeliveryOffersScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const cachedUserId = useAppSelector(selectUserId);
  const rejectedOffers = useAppSelector(selectRejectedOffers);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const offersQuery = useGetDeliveryOffersQuery(undefined, {
    pollingInterval: 20_000,
    refetchOnFocus: true,
  });
  const [acceptAssignment] = useAcceptAssignmentMutation();

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  const offers = offersQuery.data ?? [];
  const visibleOffers = offers.filter((o: any) => !rejectedOffers.includes(o.assignmentId));
  const loading = offersQuery.isLoading && !offersQuery.data;

  useEffect(() => {
    trackAnalyticsEvent('delivery_offers_viewed');
  }, []);

  useEffect(() => {
    async function showNotification() {
      if (visibleOffers.length > 0 && isOnline) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "🚀 New Delivery Offer!",
              body: "A new order is ready for pickup near you. Tap to accept it now!",
              sound: true, // Will play default notification ring
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // trigger immediately
          });
        } catch (e) {
          console.warn('Could not show notification:', e);
        }
      }
    }
    showNotification();
  }, [visibleOffers.length, isOnline]);

  const onAccept = async (assignmentId: string, orderId: string) => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to accept an offer.',
        variant: 'warning',
      });
      return;
    }
    setAcceptingId(assignmentId);
    try {
      const result = await acceptAssignment(assignmentId).unwrap();
      trackAnalyticsEvent('offer_accepted', { assignmentId });
      trackAnalyticsEvent('delivery_offer_accepted', { assignmentId });
      dispatch(
        setActiveAssignment({
          assignmentId: result.assignmentId || assignmentId,
          orderId: result.orderId || orderId,
        }),
      );
      navigation.navigate('AssignmentDetails', {
        assignmentId: result.assignmentId || assignmentId,
        orderId: result.orderId || orderId,
      });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
      void offersQuery.refetch();
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative Dark Top Background */}
      <View style={[styles.topArch, { height: 180 }]} />

      <FlatList
        style={styles.list}
        data={loading ? [] : visibleOffers}
        keyExtractor={(item) => item.assignmentId}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBox}>
            <Text style={styles.pageTitle}>Live Offers</Text>
            <Text style={styles.pageSubtitle}>Nearby shifts available for you</Text>

            {!isOnline && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  You appear offline. Offers may be empty until you go online.
                </Text>
              </View>
            )}
            {!isConnected && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  Offline — showing cached offers. Accept is blocked.
                </Text>
              </View>
            )}

            {loading ? <View style={{ marginTop: 24 }}><OfferListSkeleton /></View> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="map" size={32} color="#A0AEC0" />
              </View>
              <Text style={styles.emptyTitle}>
                {isConnected ? 'No shifts right now' : 'No cached shifts'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isConnected
                  ? 'Stay online to receive new delivery push notifications as they become available.'
                  : 'Reconnect to refresh your feed.'}
              </Text>

              {/* Development Testing Button */}
              {isConnected && isOnline && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ textAlign: 'center', color: '#14532D', fontWeight: 'bold' }} onPress={async () => {
                    try {
                      setToast({ message: 'Generating test order...', variant: 'info' });
                      const apiUrl = ENV.apiBaseUrl;
                      if (cachedUserId) {
                        const response = await fetch(`${apiUrl}/api/v1/debug/seed-offer/${cachedUserId}`, { method: 'POST' });
                        if (response.ok) {
                          setToast({ message: 'Test order seeded! Refreshing...', variant: 'success' });
                          void offersQuery.refetch();
                        } else {
                          setToast({ message: 'Server error: ' + response.status, variant: 'error' });
                        }
                      } else {
                        setToast({ message: 'User ID not found in cache.', variant: 'error' });
                      }
                    } catch (e) {
                      setToast({ message: 'Failed to generate test order.', variant: 'error' });
                    }
                  }}>
                    + Generate Test Order Directly
                  </Text>
                </View>
              )}
            </View>
          )
        }
        renderItem={({ item: offer }) => {
          if (rejectedOffers.includes(offer.assignmentId)) return null;
          return (
            <OfferCard
              offer={offer}
              accepting={acceptingId === offer.assignmentId}
              acceptDisabled={!isConnected || acceptingId !== null}
              onReject={() => {
                dispatch(addRejectedOffer(offer.assignmentId));
              }}
              onAccept={() => {
                void onAccept(offer.assignmentId, offer.orderId);
              }}
            />
          );
        }}
      />
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

import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerBox: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});
