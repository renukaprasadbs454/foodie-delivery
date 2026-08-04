import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Skeleton,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetRestaurantQuery } from '../../../api/endpoints/restaurantsApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearIsNewUser } from '../../auth/authSlice';
import { OnboardingStepper } from '../components/OnboardingStepper';
import {
  selectRestaurantId,
  setRestaurantStatus,
} from '../restaurantOnboardingSlice';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PendingApproval'>;

/**
 * P2-RES-01 — GET /restaurants/{id} while PENDING.
 * Without restaurantId → GAP-API-03 shell (no GET /restaurants/me).
 */
export function PendingApprovalScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const restaurantId = useAppSelector(selectRestaurantId);

  const query = useGetRestaurantQuery(restaurantId ?? '', {
    skip: !restaurantId,
    pollingInterval: restaurantId ? 30_000 : 0,
    refetchOnFocus: true,
  });

  useEffect(() => {
    trackAnalyticsEvent('restaurant_pending_approval_viewed');
    trackAnalyticsEvent('restaurant_approval_pending');
  }, []);

  useEffect(() => {
    const status = query.data?.status;
    if (!status) return;
    dispatch(setRestaurantStatus(status));
    if (status === 'APPROVED') {
      dispatch(clearIsNewUser());
    }
  }, [dispatch, query.data?.status]);

  if (!restaurantId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          title="Restaurant id unavailable"
          description="Cold start without a stored restaurant id cannot load status. GET /restaurants/me is an API gap (GAP-API-03)."
          accessibilityLabel="Restaurant id gap"
        />
        <Button
          label="Start registration"
          accessibilityLabel="Start registration"
          onPress={() => navigation.navigate('RestaurantRegistration')}
          style={{ marginTop: tokens.spacing.md }}
        />
      </View>
    );
  }

  const status = query.data?.status ?? 'PENDING';
  const loading = query.isLoading && !query.data;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            onRefresh={() => {
              trackAnalyticsEvent('refresh_tapped');
              void query.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Pending approval
        </Text>
        <OnboardingStepper activeIndex={3} />
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing last known status when available.
          </Text>
        ) : null}
        {loading ? (
          <Skeleton.Block width="100%" height={96} />
        ) : (
          <EmptyState
            title={
              status === 'APPROVED'
                ? 'Restaurant approved'
                : status === 'SUSPENDED'
                  ? 'Restaurant suspended'
                  : 'Waiting for admin approval'
            }
            description={
              status === 'APPROVED'
                ? 'Opening your restaurant workspace…'
                : `Status: ${status}. You cannot self-approve. Pull to refresh or wait for polling.`
            }
            accessibilityLabel={`Restaurant status ${status}`}
          />
        )}
        {query.isError ? (
          <Text variant="body" color={tokens.color.error}>
            Could not load restaurant status. Pull to refresh.
          </Text>
        ) : null}
        <Button
          label="Upload documents"
          accessibilityLabel="Upload documents"
          variant="secondary"
          onPress={() => navigation.navigate('RestaurantDocuments')}
        />
        <Button
          label="Upload images"
          accessibilityLabel="Upload images"
          variant="secondary"
          onPress={() => navigation.navigate('RestaurantImages')}
        />
      </ScrollView>
    </View>
  );
}
