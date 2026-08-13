import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { AssignmentDetailSkeleton } from '../components/AssignmentDetailSkeleton';
import { useAssignmentOrderSubscription } from '../hooks/useAssignmentOrderSubscription';
import { formatMoney, isUuid } from '../types';
import { legForOrderStatus } from '../../navigation/types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AssignmentDetails'>;

/**
 * P2-DEL-02/03 — GET /orders/{id} for assignment detail.
 * Entry to DeliveryNavigation / PickupOtp / DeliveryOtp.
 */
export function AssignmentDetailsScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { orderId, assignmentId } = route.params;
  const validOrderId = Boolean(orderId && isUuid(orderId));
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validOrderId,
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });

  const { wsActive } = useAssignmentOrderSubscription(
    validOrderId ? orderId : undefined,
    orderQuery.data?.status,
  );

  useEffect(() => {
    trackAnalyticsEvent('delivery_assignment_details_viewed');
    trackAnalyticsEvent('assignment_opened', {
      orderId,
      ...(assignmentId ? { assignmentId } : {}),
    });
  }, [assignmentId, orderId]);

  if (!validOrderId) {
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
          title="Invalid order link"
          description="Assignment details require a valid order id."
          accessibilityLabel="Invalid order id"
        />
      </View>
    );
  }

  const order = orderQuery.data;
  const loading = orderQuery.isLoading && !order;
  const status = order?.status;
  const requireAssignmentId = () => {
    if (!assignmentId) {
      setToast({
        message:
          'Assignment id is required for navigation and OTP. Accept an offer in this session (deep links only provide orderId).',
        variant: 'warning',
      });
      return false;
    }
    return true;
  };

  return (
    <View style={styles.container}>
      {/* Decorative Dark Top Background */}
      <View style={[styles.topArch, { height: 180 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={orderQuery.isFetching}
            onRefresh={() => void orderQuery.refetch()}
            tintColor="#FFFFFF"
            colors={['#F59E0B']}
          />
        }
      >
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Assignment</Text>
          {assignmentId ? (
            <Text style={styles.pageSubtitle}>ID: {assignmentId}</Text>
          ) : (
            <Text style={styles.pageSubtitle}>Unknown Assignment. Displaying Order {orderId}</Text>
          )}

          {!isConnected ? (
            <View style={styles.warningContainer}>
              <Feather name="wifi-off" size={16} color="#B91C1C" />
              <Text style={styles.warningText}>
                Offline — showing cached order
              </Text>
            </View>
          ) : null}
          <View style={styles.connectionStatus}>
            <View style={[styles.pulseDot, { backgroundColor: wsActive ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.connectionText}>
              {wsActive ? 'Live updates connected' : 'Polling fallback active'}
            </Text>
          </View>
        </View>

        {loading ? <AssignmentDetailSkeleton /> : null}

        {orderQuery.isError && !order ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="search" size={32} color="#A0AEC0" />
            </View>
            <Text style={styles.emptyTitle}>Order Not Found</Text>
            <Text style={styles.emptySubtitle}>Could not load this order. It may be unassigned or unavailable.</Text>
          </View>
        ) : null}

        {order ? (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumberLabel}>Order #{order.orderNumber}</Text>
                <Text style={styles.orderStatusText}>{order.status}</Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalAmount}>{formatMoney(order.totalAmount)}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.itemsLabel}>Order Items</Text>
            {(order.items ?? []).map((item: any, index: number) => (
              <View key={`${item.menuItemId ?? 'item'}-${index}`} style={styles.itemRow}>
                <View style={styles.itemQuantityCircle}>
                  <Text style={styles.itemQuantityText}>{item.quantity}x</Text>
                </View>
                <Text style={styles.itemName}>{item.name ?? 'Item'}</Text>
                <Text style={styles.itemPrice}>{formatMoney(item.lineTotal ?? item.unitPrice)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actionSection}>
          <Pressable
            style={[styles.actionButton, styles.primaryNavButton]}
            onPress={() => {
              trackAnalyticsEvent('start_navigation_tapped', { orderId });
              if (!requireAssignmentId() || !assignmentId) return;
              navigation.navigate('DeliveryNavigation', {
                assignmentId,
                orderId,
                leg: legForOrderStatus(status),
              });
            }}
          >
            <Feather name="navigation" size={20} color="#FFFFFF" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Start Navigation</Text>
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
    </View >
  );
}


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
    paddingTop: 60,
    paddingBottom: 60,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    color: '#CBD5E0',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 20,
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumberLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  totalBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A0AEC0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemQuantityCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemQuantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4A5568',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
  actionSection: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
  },
  actionIcon: {
    marginRight: 8,
  },
  primaryNavButton: {
    backgroundColor: '#14532D',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
  },
  secondaryButtonText: {
    color: '#14532D',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tertiaryButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tertiaryButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
