import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import {
  selectIsOnline,
  setActiveAssignment,
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

  useEffect(() => {
    trackAnalyticsEvent('delivery_offers_viewed');
  }, []);

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

  const offers = offersQuery.data ?? [];
  const loading = offersQuery.isLoading && !offersQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <FlatList
        style={{ flex: 1 }}
        data={loading ? [] : offers}
        keyExtractor={(item) => item.assignmentId}
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={offersQuery.isFetching}
            onRefresh={() => {
              void offersQuery.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: tokens.spacing.md }}>
            <Text variant="heading1" accessibilityRole="header">
              Delivery offers
            </Text>
            {!isOnline ? (
              <Text variant="caption" color={tokens.color.warning}>
                You appear offline locally. Offers may be empty until you go
                online.
              </Text>
            ) : null}
            {!isConnected ? (
              <Text variant="caption" color={tokens.color.warning}>
                Offline — showing cached offers. Accept is blocked.
              </Text>
            ) : null}
            {loading ? <OfferListSkeleton /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title={isConnected ? 'No offers right now' : 'No cached offers'}
              description={
                isConnected
                  ? 'Stay online to receive new delivery offers. Decline is not available (API gap).'
                  : 'Reconnect to refresh offers.'
              }
              accessibilityLabel="No delivery offers"
            />
          )
        }
        renderItem={({ item: offer }) => (
          <OfferCard
            offer={offer}
            accepting={acceptingId === offer.assignmentId}
            acceptDisabled={!isConnected || acceptingId !== null}
            onAccept={() => {
              void onAccept(offer.assignmentId, offer.orderId);
            }}
          />
        )}
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
