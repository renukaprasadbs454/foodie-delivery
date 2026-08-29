import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetRestaurantProfileQuery,
  useGetRestaurantQuery,
} from '../../../api/endpoints/restaurantsApi';
import { useGetRestaurantOrdersQuery } from '../../../api/endpoints/ordersApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectRestaurantId,
  setRestaurantCreated,
} from '../../onboarding/restaurantOnboardingSlice';
import { useRestaurantOrdersSubscription } from '../hooks/useRestaurantOrdersSubscription';
import { formatMoney } from '../types';
import type { OrdersStackParamList } from '../../../navigation/types';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import { getMockDashboardSummary, getMockRestaurantProfile } from '../../../mock';

type Props = NativeStackScreenProps<OrdersStackParamList, 'Dashboard'>;

const BRAND_PRIMARY = '#14532D'; // Primary Dark Green
const BRAND_ACCENT = '#F59E0B';  // Accent Orange/Gold

export function DashboardScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const dispatch = useAppDispatch();
  const storedRestaurantId = useAppSelector(selectRestaurantId);

  const profileQuery = useGetRestaurantProfileQuery(undefined, {
    skip: Boolean(storedRestaurantId),
  });

  const activeQuery = useGetRestaurantOrdersQuery(
    { page: 0, size: 20, sort: 'placedAt' },
    {
      refetchOnFocus: true,
    },
  );

  useEffect(() => {
    if (profileQuery.data?.restaurantId && !storedRestaurantId) {
      dispatch(
        setRestaurantCreated({
          restaurantId: profileQuery.data.restaurantId,
          status: profileQuery.data.status ?? 'APPROVED',
        }),
      );
    }
  }, [dispatch, profileQuery.data, storedRestaurantId]);

  const restaurantId =
    storedRestaurantId ??
    profileQuery.data?.restaurantId ??
    activeQuery.data?.find((o) => o.restaurantId)?.restaurantId ??
    (MOCK_CONFIG.ENABLE_MOCK_FALLBACK ? MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID : undefined);

  const { wsActive } = useRestaurantOrdersSubscription(restaurantId ?? null);

  const restaurantQuery = useGetRestaurantQuery(restaurantId ?? '', {
    skip: !restaurantId,
  });

  // Determine if we should use Mock Fallback
  const apiOrders = activeQuery.data;
  const apiProfile = restaurantQuery.data;
  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected ||
      activeQuery.isError ||
      !apiOrders ||
      apiOrders.length === 0 ||
      restaurantQuery.isError ||
      !apiProfile);

  const mockSummary = getMockDashboardSummary();
  const mockProfile = getMockRestaurantProfile();

  // Data selection: Real API data if available, else Mock Fallback
  const displayRestaurantName =
    apiProfile?.name ?? (isUsingMock ? mockProfile.name : 'Foodie Restaurant');
  const displayLogoUrl =
    apiProfile?.logoImageUrl ?? (isUsingMock ? mockProfile.logoImageUrl : null);
  const displayStatus =
    apiProfile?.status ?? (isUsingMock ? mockProfile.status : 'APPROVED');

  const orders =
    apiOrders && apiOrders.length > 0
      ? apiOrders
      : isUsingMock
        ? mockSummary.recentOrders
        : [];

  const todayOrdersCount =
    apiOrders && apiOrders.length > 0
      ? apiOrders.length
      : isUsingMock
        ? mockSummary.todayOrdersCount
        : 0;

  const pendingOrdersCount =
    apiOrders && apiOrders.length > 0
      ? apiOrders.filter((o) => ['CONFIRMED', 'PENDING'].includes(o.status)).length
      : isUsingMock
        ? mockSummary.pendingOrdersCount
        : 0;

  const completedOrdersCount =
    apiOrders && apiOrders.length > 0
      ? apiOrders.filter((o) =>
        ['DELIVERED', 'COMPLETED', 'READY_FOR_PICKUP'].includes(o.status),
      ).length
      : isUsingMock
        ? mockSummary.completedOrdersCount
        : 0;

  const totalRevenue =
    apiOrders && apiOrders.length > 0
      ? apiOrders.reduce((acc, o) => {
        const val = typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount) || 0;
        return acc + val;
      }, 0)
      : isUsingMock
        ? mockSummary.grossRevenue
        : 0;

  useEffect(() => {
    trackAnalyticsEvent('restaurant_dashboard_viewed');
  }, []);

  // LOADING STATE
  const isProfileLoading = !storedRestaurantId && profileQuery.isLoading;
  const isDataLoading =
    Boolean(restaurantId) &&
    !isUsingMock &&
    ((restaurantQuery.isLoading && !restaurantQuery.data) ||
      (activeQuery.isLoading && !activeQuery.data));

  if (isProfileLoading || isDataLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.md,
          justifyContent: 'center',
          gap: tokens.spacing.md,
        }}
      >
        <Text variant="heading2" style={{ color: BRAND_PRIMARY, textAlign: 'center' }}>
          Loading restaurant dashboard…
        </Text>
        <Skeleton.Block width="100%" height={140} />
        <Skeleton.Block width="100%" height={200} />
      </View>
    );
  }

  // MISSING RESTAURANT PROFILE STATE (when mock fallback disabled and no profile)
  if (!restaurantId && !MOCK_CONFIG.ENABLE_MOCK_FALLBACK) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
          gap: tokens.spacing.md,
        }}
      >
        <EmptyState
          title="Restaurant Profile Not Found"
          description="No registered restaurant profile was found for this account. Please complete registration or retry."
          accessibilityLabel="Missing restaurant profile"
        />
        <View style={{ gap: tokens.spacing.sm }}>
          <Button
            label="Register Restaurant"
            accessibilityLabel="Register Restaurant"
            style={{ backgroundColor: BRAND_PRIMARY }}
            onPress={() => dispatch(setRestaurantCreated({ restaurantId: '', status: 'PENDING' }))}
          />
          <Button
            label="Retry Loading Profile"
            accessibilityLabel="Retry Loading Profile"
            variant="secondary"
            onPress={() => {
              void profileQuery.refetch();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 80,
          maxWidth: isWide ? 1200 : undefined,
          alignSelf: isWide ? 'center' : undefined,
          width: '100%',
        }}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isFetching || restaurantQuery.isFetching}
            onRefresh={() => {
              void restaurantQuery.refetch();
              void activeQuery.refetch();
            }}
          />
        }
      >
        {/* DEMO MODE BADGE (SUBTLE) */}
        {isUsingMock ? <DemoModeIndicator isMockActive={true} /> : null}

        {/* BRANDING HEADER BANNER */}
        <Card
          style={{
            backgroundColor: BRAND_PRIMARY,
            padding: tokens.spacing.lg,
            borderRadius: 16,
            borderColor: 'rgba(245, 158, 11, 0.3)',
            borderWidth: 1,
            gap: tokens.spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ gap: 4, flex: 1 }}>
              <Text
                variant="heading1"
                style={{ color: '#FFFFFF', fontWeight: 'bold' }}
                accessibilityRole="header"
              >
                {displayRestaurantName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: BRAND_ACCENT,
                  }}
                />
                <Text variant="caption" style={{ color: BRAND_ACCENT, fontWeight: 'bold' }}>
                  ONLINE & ACCEPTING ORDERS
                </Text>
                <Text variant="caption" style={{ color: '#A7F3D0', fontSize: 11 }}>
                  ({displayStatus})
                </Text>
              </View>
            </View>

            {displayLogoUrl ? (
              <Image
                source={{ uri: displayLogoUrl }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 2,
                  borderColor: BRAND_ACCENT,
                }}
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: BRAND_ACCENT,
                }}
              >
                <Text style={{ fontSize: 24 }}>🍳</Text>
              </View>
            )}
          </View>

          {/* Connection / Channel Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, marginTop: 4 }}>
            {!isConnected ? (
              <Text variant="caption" style={{ color: '#F87171' }}>
                ⚠️ Offline — Demo data active.
              </Text>
            ) : wsActive ? (
              <Text variant="caption" style={{ color: '#86EFAC' }}>
                ● Live order WebSocket connected
              </Text>
            ) : isUsingMock ? (
              <Text variant="caption" style={{ color: '#FDE68A' }}>
                ● Demo mode active (Mock data loaded)
              </Text>
            ) : (
              <Text variant="caption" style={{ color: '#9CA3AF' }}>
                Polling order queue (45s)…
              </Text>
            )}
          </View>
        </Card>

        {/* SUMMARY CARDS GRID */}
        <View style={{ gap: tokens.spacing.sm }}>
          <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 18 }}>
            Executive Overview
          </Text>

          {/* 2x2 Grid of Summary Cards */}
          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
            {/* Today's Orders */}
            <Card
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: 14,
                borderLeftWidth: 4,
                borderLeftColor: BRAND_PRIMARY,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" color={tokens.color.textSecondary}>
                  Today's Orders
                </Text>
                <Text style={{ fontSize: 16 }}>📦</Text>
              </View>
              <Text variant="heading1" style={{ color: BRAND_PRIMARY, fontSize: 26, fontWeight: 'bold' }}>
                {todayOrdersCount}
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                Total received today
              </Text>
            </Card>

            {/* Pending Orders */}
            <Card
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: 14,
                borderLeftWidth: 4,
                borderLeftColor: BRAND_ACCENT,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" color={tokens.color.textSecondary}>
                  Pending Orders
                </Text>
                <Text style={{ fontSize: 16 }}>⏳</Text>
              </View>
              <Text variant="heading1" style={{ color: BRAND_ACCENT, fontSize: 26, fontWeight: 'bold' }}>
                {pendingOrdersCount}
              </Text>
              <Text variant="caption" style={{ color: BRAND_ACCENT, fontWeight: '600' }}>
                Needs kitchen action
              </Text>
            </Card>
          </View>

          <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
            {/* Completed Orders */}
            <Card
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: 14,
                borderLeftWidth: 4,
                borderLeftColor: '#16A34A',
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" color={tokens.color.textSecondary}>
                  Completed
                </Text>
                <Text style={{ fontSize: 16 }}>✅</Text>
              </View>
              <Text variant="heading1" style={{ color: '#16A34A', fontSize: 26, fontWeight: 'bold' }}>
                {completedOrdersCount}
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                Dispatched & Served
              </Text>
            </Card>

            {/* Revenue Card (Gold Highlight) */}
            <Card
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: 14,
                borderLeftWidth: 4,
                borderLeftColor: BRAND_ACCENT,
                backgroundColor: '#FEF3C7',
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" style={{ color: '#92400E', fontWeight: 'bold' }}>
                  Gross Revenue
                </Text>
                <Text style={{ fontSize: 16 }}>💰</Text>
              </View>
              <Text variant="heading2" style={{ color: '#92400E', fontSize: 20, fontWeight: 'bold' }}>
                {formatMoney(totalRevenue)}
              </Text>
              <Text variant="caption" style={{ color: '#B45309' }}>
                Sales total
              </Text>
            </Card>
          </View>
        </View>

        {/* QUICK ACTIONS ROW */}
        <View style={{ gap: tokens.spacing.xs, marginTop: tokens.spacing.xs }}>
          <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 18 }}>
            Quick Actions
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs }}>
            <Button
              label="📋 Live Orders"
              accessibilityLabel="Open order queue"
              style={{ flex: 1, minWidth: 140, backgroundColor: BRAND_PRIMARY }}
              onPress={() => {
                trackAnalyticsEvent('open_queue_tapped');
                navigation.getParent()?.navigate('OrdersTab');
              }}
            />
            <Button
              label="🍽️ Menu"
              accessibilityLabel="Open menu"
              variant="secondary"
              style={{ flex: 1, minWidth: 140 }}
              onPress={() => {
                trackAnalyticsEvent('open_menu_tapped');
                navigation.getParent()?.navigate('MenuTab');
              }}
            />
            <Button
              label="💰 Settlements"
              accessibilityLabel="Open settlement history"
              variant="secondary"
              style={{ flex: 1, minWidth: 140 }}
              onPress={() => {
                navigation.getParent()?.navigate('ProfileTab', {
                  screen: 'SettlementHistory',
                });
              }}
            />
            <Button
              label="⭐ Reviews"
              accessibilityLabel="Open reviews"
              variant="secondary"
              style={{ flex: 1, minWidth: 140 }}
              onPress={() => {
                trackAnalyticsEvent('open_reviews_tapped');
                navigation.getParent()?.navigate('ReviewsTab');
              }}
            />
            <Button
              label="👤 Profile"
              accessibilityLabel="Open profile"
              variant="secondary"
              style={{ flex: 1, minWidth: 140 }}
              onPress={() => {
                trackAnalyticsEvent('open_profile_tapped');
                navigation.getParent()?.navigate('ProfileTab');
              }}
            />
          </View>
        </View>

        {/* RECENT ORDERS SECTION */}
        <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.md, borderRadius: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: tokens.color.border,
              paddingBottom: tokens.spacing.xs,
            }}
          >
            <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 17 }}>
              Recent Orders
            </Text>
            <Pressable
              onPress={() => navigation.getParent()?.navigate('OrdersTab')}
              accessibilityRole="button"
              accessibilityLabel="View all orders"
            >
              <Text variant="label" style={{ color: BRAND_PRIMARY }}>
                View All Queue →
              </Text>
            </Pressable>
          </View>

          {orders.length === 0 ? (
            <EmptyState
              title="No Recent Orders"
              description="New customer orders will appear here automatically."
              accessibilityLabel="No recent orders"
            />
          ) : (
            <View style={{ gap: tokens.spacing.sm }}>
              {orders.slice(0, 5).map((order) => (
                <Pressable
                  key={order.orderId}
                  onPress={() => {
                    trackAnalyticsEvent('order_opened', { orderId: order.orderId });
                    navigation.navigate('RestaurantOrderDetails', {
                      orderId: order.orderId,
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for order ${order.orderNumber}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.radius.md,
                    backgroundColor: tokens.color.surface,
                    borderWidth: 1,
                    borderColor: tokens.color.border,
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text variant="label" style={{ color: tokens.color.textPrimary, fontWeight: 'bold' }}>
                      {order.orderNumber}
                    </Text>
                    <Text variant="caption" color={tokens.color.textSecondary}>
                      {order.placedAt
                        ? new Date(order.placedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Just now'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                      {formatMoney(order.totalAmount)}
                    </Text>
                    <Badge
                      label={order.status}
                      tone={
                        order.status === 'CONFIRMED'
                          ? 'warning'
                          : order.status === 'PREPARING'
                            ? 'accent'
                            : order.status === 'READY_FOR_PICKUP' || order.status === 'DELIVERED'
                              ? 'success'
                              : 'accent'
                      }
                      accessibilityLabel={`Order status ${order.status}`}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
