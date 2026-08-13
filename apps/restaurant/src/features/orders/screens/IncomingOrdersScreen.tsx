import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetRestaurantOrdersQuery,
  useTransitionOrderStatusMutation,
} from '../../../api/endpoints/ordersApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { toUnwrappedApiError } from '../../auth/apiError';
import { OrderCard } from '../components/OrderCard';
import { OrderQueueSkeleton } from '../components/OrderQueueSkeleton';
import { RejectOrderModal } from '../components/RejectOrderModal';
import { EmptyOrdersState } from '../components/EmptyOrdersState';
import { useRestaurantOrdersSubscription } from '../hooks/useRestaurantOrdersSubscription';
import type {
  OrderSummary,
  RestaurantTransitionStatus,
} from '../types';
import { validateRejectReason } from '../types';
import type { OrdersStackParamList } from '../../../navigation/types';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import { getMockOrders, MOCK_ORDERS, type ExtendedOrderDetail } from '../../../mock';

type Props = NativeStackScreenProps<OrdersStackParamList, 'IncomingOrders'>;

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

const STATUS_FILTERS = [
  { key: '', label: 'All Orders' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'REJECTED', label: 'Rejected' },
] as const;

export function IncomingOrdersScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const storedRestaurantId = useAppSelector(selectRestaurantId);
  const restaurantId =
    storedRestaurantId ??
    (MOCK_CONFIG.ENABLE_MOCK_FALLBACK ? MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID : undefined);

  const { wsActive } = useRestaurantOrdersSubscription(restaurantId ?? null);

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [rejectingOrder, setRejectingOrder] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);

  // Local state for demo mode transitions
  const [localOrders, setLocalOrders] = useState<ExtendedOrderDetail[]>(MOCK_ORDERS);

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const ordersQuery = useGetRestaurantOrdersQuery(
    { page: 0, size: 100, sort: 'placedAt' },
    {
      refetchOnFocus: true,
      pollingInterval: wsActive ? 0 : 45_000,
    },
  );

  const [transitionStatus] = useTransitionOrderStatusMutation();

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
    trackAnalyticsEvent('restaurant_incoming_orders_viewed');
  }, []);

  const apiOrders = ordersQuery.data;
  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected || ordersQuery.isError || !apiOrders || apiOrders.length === 0);

  const allOrders: OrderSummary[] = useMemo(() => {
    if (apiOrders && apiOrders.length > 0) {
      return apiOrders;
    }
    return localOrders.map((o) => ({
      orderId: o.orderId,
      orderNumber: o.orderNumber,
      status: o.status,
      restaurantId: o.restaurantId,
      totalAmount: o.totalAmount,
      placedAt: o.placedAt,
      customerName: o.customerName,
      items: o.items,
    }));
  }, [apiOrders, localOrders]);

  // Compute live count badges for each filter
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '': allOrders.length,
      CONFIRMED: 0,
      ACCEPTED: 0,
      PREPARING: 0,
      READY_FOR_PICKUP: 0,
      DELIVERED: 0,
      REJECTED: 0,
    };

    allOrders.forEach((o) => {
      const st = (o.status || '').toUpperCase();
      if (st === 'CONFIRMED' || st === 'PENDING') counts.CONFIRMED++;
      else if (st === 'ACCEPTED') counts.ACCEPTED++;
      else if (st === 'PREPARING') counts.PREPARING++;
      else if (st === 'READY_FOR_PICKUP') counts.READY_FOR_PICKUP++;
      else if (st === 'DELIVERED' || st === 'COMPLETED') counts.DELIVERED++;
      else if (st === 'REJECTED' || st === 'CANCELLED') counts.REJECTED++;
    });

    return counts;
  }, [allOrders]);

  const activeOrdersCount = useMemo(
    () =>
      allOrders.filter(
        (o) => !['DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(o.status),
      ).length,
    [allOrders],
  );

  const needsActionCount = useMemo(
    () => allOrders.filter((o) => ['CONFIRMED', 'PENDING'].includes(o.status)).length,
    [allOrders],
  );

  // Filter & Search & Sort orders
  const displayedOrders = useMemo(() => {
    let result = [...allOrders];

    if (activeStatusFilter) {
      if (activeStatusFilter === 'CONFIRMED') {
        result = result.filter((o) => ['CONFIRMED', 'PENDING'].includes(o.status));
      } else if (activeStatusFilter === 'DELIVERED') {
        result = result.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status));
      } else if (activeStatusFilter === 'REJECTED') {
        result = result.filter((o) => ['REJECTED', 'CANCELLED'].includes(o.status));
      } else {
        result = result.filter((o) => o.status === activeStatusFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) => {
        const ext = o as OrderSummary & { customerName?: string };
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          (o.orderId && o.orderId.toLowerCase().includes(q)) ||
          (ext.customerName && ext.customerName.toLowerCase().includes(q))
        );
      });
    }

    result.sort((a, b) => {
      const timeA = a.placedAt ? new Date(a.placedAt).getTime() : 0;
      const timeB = b.placedAt ? new Date(b.placedAt).getTime() : 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [allOrders, activeStatusFilter, searchQuery, sortOrder]);

  const handleTransition = async (
    orderId: string,
    targetStatus: RestaurantTransitionStatus,
    reason?: string,
  ) => {
    if (targetStatus === 'REJECTED') {
      const validated = validateRejectReason(reason ?? '');
      if (!validated.ok) {
        setToast({ message: validated.message, variant: 'error' });
        return;
      }
    }

    if (isUsingMock) {
      // Local demo transition
      setLocalOrders((prev) =>
        prev.map((o) => {
          if (o.orderId === orderId) {
            return {
              ...o,
              status: targetStatus,
              orderStatusEvents: [
                ...(o.orderStatusEvents ?? []),
                {
                  eventId: `e-demo-${Date.now()}`,
                  fromStatus: o.status,
                  toStatus: targetStatus,
                  reason: reason ?? null,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
          return o;
        }),
      );
      setRejectingOrder(null);
      setToast({
        message: `Order status set to ${targetStatus} (Demo Mode).`,
        variant: 'success',
      });
      return;
    }

    try {
      await transitionStatus({
        orderId,
        targetStatus,
        reason: reason ?? null,
      }).unwrap();
      setRejectingOrder(null);
      setToast({
        message: `Order status updated to ${targetStatus}.`,
        variant: 'success',
      });
      void ordersQuery.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.md,
          paddingTop: tokens.spacing.md,
          paddingBottom: 80,
          gap: tokens.spacing.md,
          maxWidth: isWide ? 1200 : undefined,
          alignSelf: isWide ? 'center' : undefined,
          width: '100%',
        }}
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isFetching}
            onRefresh={() => {
              void ordersQuery.refetch();
            }}
          />
        }
      >
        {/* DEMO MODE INDICATOR */}
        {isUsingMock ? <DemoModeIndicator isMockActive={true} /> : null}

        {/* HEADER SECTION */}
        <View style={{ gap: tokens.spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 2 }}>
              <Text variant="heading1" style={{ color: BRAND_PRIMARY }} accessibilityRole="header">
                Live Order Queue
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                Manage incoming orders, prepare meals and track deliveries
              </Text>
            </View>

            <Button
              label="🔄 Refresh"
              accessibilityLabel="Refresh orders"
              variant="secondary"
              loading={ordersQuery.isFetching}
              onPress={() => void ordersQuery.refetch()}
              style={{ height: 38 }}
            />
          </View>

          {/* REAL-TIME CONNECTION INDICATORS & METRICS */}
          <Card
            style={{
              backgroundColor: '#F8FAFC',
              padding: tokens.spacing.sm,
              borderRadius: 12,
              borderColor: tokens.color.border,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: tokens.spacing.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {isUsingMock ? (
                <Text variant="caption" style={{ color: '#D97706', fontWeight: 'bold' }}>
                  🟡 Demo mode active (Mock queue loaded)
                </Text>
              ) : wsActive ? (
                <Text variant="caption" style={{ color: '#16A34A', fontWeight: 'bold' }}>
                  🟢 Live orders streaming active
                </Text>
              ) : (
                <Text variant="caption" style={{ color: '#D97706', fontWeight: 'bold' }}>
                  🟡 Live updates via polling (45s)
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text variant="caption" color={tokens.color.textSecondary}>Active Orders:</Text>
                <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                  {activeOrdersCount}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text variant="caption" color={tokens.color.textSecondary}>Needs Action:</Text>
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 }}>
                  <Text variant="caption" style={{ color: '#B45309', fontWeight: 'bold' }}>
                    {needsActionCount}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* HORIZONTAL STATUS FILTER BAR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 2,
          }}
        >
          {STATUS_FILTERS.map((filter) => {
            const isSelected = activeStatusFilter === filter.key;
            const count = filterCounts[filter.key] ?? 0;

            return (
              <Pressable
                key={filter.key}
                onPress={() => {
                  setActiveStatusFilter(filter.key);
                  trackAnalyticsEvent('filter_changed', { status: filter.label });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${filter.label} with ${count} orders`}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  gap: 8,
                  height: 40,
                  backgroundColor: isSelected ? BRAND_PRIMARY : tokens.color.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? BRAND_PRIMARY : tokens.color.border,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: isSelected ? '#000000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: isSelected ? 3 : 0,
                }]}
              >
                <Text
                  variant="label"
                  style={{
                    color: isSelected ? '#FFFFFF' : tokens.color.textPrimary,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: 13,
                  }}
                >
                  {filter.label}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 10,
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                    minWidth: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontWeight: 'bold',
                      fontSize: 11,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* SEARCH & SORT CONTROLS BAR */}
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="🔍 Search by order # or customer..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search orders"
            />
          </View>

          <Button
            label={sortOrder === 'newest' ? '⬇️ Newest' : '⬆️ Oldest'}
            accessibilityLabel="Toggle sort order"
            variant="secondary"
            onPress={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
            style={{ height: 42 }}
          />
        </View>

        {/* ORDERS LIST & EMPTY STATES */}
        {ordersQuery.isLoading && !isUsingMock ? (
          <OrderQueueSkeleton />
        ) : displayedOrders.length === 0 ? (
          <EmptyOrdersState
            statusFilter={activeStatusFilter}
            isFetching={ordersQuery.isFetching}
            onRefresh={() => void ordersQuery.refetch()}
          />
        ) : (
          <View style={{ gap: tokens.spacing.md }}>
            {displayedOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                isTransitioning={false}
                onViewDetails={() => {
                  trackAnalyticsEvent('order_opened', { orderId: order.orderId });
                  navigation.navigate('RestaurantOrderDetails', {
                    orderId: order.orderId,
                  });
                }}
                onTransitionStatus={(orderId, targetStatus) => {
                  void handleTransition(orderId, targetStatus);
                }}
                onOpenRejectModal={(orderId, orderNumber) => {
                  setRejectingOrder({ orderId, orderNumber });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* REJECT ORDER MODAL */}
      <RejectOrderModal
        visible={Boolean(rejectingOrder)}
        orderNumber={rejectingOrder?.orderNumber}
        loading={false}
        onConfirm={(reason) => {
          if (rejectingOrder) {
            void handleTransition(rejectingOrder.orderId, 'REJECTED', reason);
          }
        }}
        onCancel={() => setRejectingOrder(null)}
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
