import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  Toast,
  createIdempotencyKey,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { useInitiatePaymentMutation } from '../../../api/endpoints/paymentsApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { formatMoney } from '../../menu/types';
import { isOrderId } from '../../checkout/types';
import type { BrowseStackParamList } from '../../../navigation/types';
import { openRazorpayCheckout } from '../razorpayCheckout';
import {
  isConfirmedStatus,
  isPaymentFailedStatus,
  type PaymentInitiation,
} from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Payment'>;

type Phase =
  | 'ready'
  | 'initiating'
  | 'sdk'
  | 'awaiting_confirmed'
  | 'failed'
  | 'unavailable_sdk';

/**
 * P2-CUS-05 Payment — initiate + await CONFIRMED (webhook-driven).
 * Client Razorpay success ≠ payment truth. Never call webhook from app. No COD.
 */
export function PaymentScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const validId = isOrderId(orderId);

  const [paymentMethod, setPaymentMethod] = useState<string>('PhonePe');

  const [phase, setPhase] = useState<Phase>('ready');
  const [initiation, setInitiation] = useState<PaymentInitiation | null>(null);
  const attemptKey = useRef<string | null>(null);
  const navigatedRef = useRef(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [initiatePayment] = useInitiatePaymentMutation();
  const awaiting = phase === 'awaiting_confirmed' || phase === 'unavailable_sdk';
  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validId,
    pollingInterval: awaiting ? 2500 : 0,
  });

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
    trackAnalyticsEvent('customer_payment_viewed', { orderId });
  }, [orderId]);

  useEffect(() => {
    if (!validId || navigatedRef.current) return;
    const status = orderQuery.data?.status;
    if (isConfirmedStatus(status)) {
      navigatedRef.current = true;
      trackAnalyticsEvent('payment_completed', { orderId });
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('OrdersTab', {
          screen: 'LiveOrderTracking',
          params: { orderId },
        });
      }
      return;
    }
    if (isPaymentFailedStatus(status)) {
      setPhase('failed');
      trackAnalyticsEvent('payment_failed', { orderId });
    }
  }, [navigation, orderId, orderQuery.data?.status, validId]);

  const runInitiateAndCheckout = async () => {
    if (!validId) return;
    setPhase('initiating');
    trackAnalyticsEvent('payment_initiated', { orderId });
    setTimeout(() => {
      setPhase('ready');
      setToast({ message: `Order Placed successfully via ${paymentMethod} (Mock)!`, variant: 'success' });
      trackAnalyticsEvent('payment_completed', { orderId, method: paymentMethod });
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('OrdersTab', {
          screen: 'LiveOrderTracking',
          params: { orderId },
        });
      }
    }, 1200);
  };

  const runCodCheckout = () => {
    trackAnalyticsEvent('payment_completed', { orderId, method: 'COD' });
    setToast({ message: 'Order Placed with Cash on Delivery!', variant: 'success' });
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('OrdersTab', {
        screen: 'LiveOrderTracking',
        params: { orderId },
      });
    }
  };

  const onRetry = () => {
    trackAnalyticsEvent('payment_retry_tapped', { orderId });
    // Same Idempotency-Key for the same attempt until a new attempt starts.
    void runInitiateAndCheckout();
  };

  if (!validId) {
    return (
      <EmptyState
        title="Invalid order"
        description="The payment link is not valid."
        accessibilityLabel="Invalid payment order id"
        actionLabel="Home"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  const blocking =
    phase === 'initiating' ||
    phase === 'sdk' ||
    phase === 'awaiting_confirmed' ||
    phase === 'unavailable_sdk';

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: insets.top + 32,
        gap: tokens.spacing.md,
      }}
      edges={['top', 'left', 'right']}
    >
      <Text variant="heading1" style={{ fontSize: 32, fontWeight: '900', color: '#14532D', marginBottom: 4 }} accessibilityRole="header">
        Payment
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — payment initiate is blocked.
        </Text>
      ) : null}
      <Text variant="body" color={tokens.color.textSecondary}>
        Order {orderId}
      </Text>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 }}>
        <Text variant="heading2" style={{ color: '#18181b', fontWeight: '800', marginBottom: 8 }}>Select Payment Method</Text>

        {[
          { id: 'PhonePe', label: 'PhonePe UPI' },
          { id: 'GPay', label: 'Google Pay' },
          { id: 'CreditDebit', label: 'Credit / Debit Card' },
          { id: 'NetBanking', label: 'Net Banking' },
          { id: 'COD', label: 'Cash on Delivery' },
        ].map((method) => (
          <Pressable
            key={method.id}
            onPress={() => setPaymentMethod(method.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: method.id === 'COD' ? 0 : 1, borderBottomColor: '#f4f4f5' }}
          >
            <View style={{ height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: paymentMethod === method.id ? '#14532D' : '#d4d4d8', alignItems: 'center', justifyContent: 'center' }}>
              {paymentMethod === method.id && <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#14532D' }} />}
            </View>
            <Text style={{ fontSize: 16, color: '#18181b', fontWeight: '700' }}>{method.label}</Text>
          </Pressable>
        ))}
      </View>

      {phase === 'failed' ? (
        <EmptyState
          title="Payment not completed"
          description="The order is no longer payable. Return home or contact support."
          accessibilityLabel="Payment failed"
          actionLabel="Home"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <View style={{ marginTop: 24, gap: 16 }}>
          <Pressable
            disabled={blocking}
            onPress={() => {
              if (paymentMethod === 'COD') {
                runCodCheckout();
              } else {
                attemptKey.current = createIdempotencyKey();
                void runInitiateAndCheckout();
              }
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed || blocking ? '#064e3b' : '#14532D',
              borderRadius: 12,
              paddingVertical: 18,
              opacity: blocking ? 0.7 : 1,
              alignItems: 'center',
              shadowColor: '#14532D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }}>
              {phase === 'awaiting_confirmed' || phase === 'unavailable_sdk'
                ? 'Processing...' : 'Place Order'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('OrdersTab' as never);
              } else {
                navigation.navigate('Home');
              }
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#f3f4f6' : 'transparent',
              borderWidth: 2,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '700' }}>My Orders</Text>
          </Pressable>
        </View>
      )}

      {blocking ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: tokens.color.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.spacing.md,
            padding: tokens.spacing.xl,
          }}
          accessibilityLabel="Payment in progress"
        >
          <ActivityIndicator color={tokens.color.accent} size="large" />
          <Text variant="body" color={tokens.color.textInverse}>
            {phase === 'awaiting_confirmed' || phase === 'unavailable_sdk'
              ? 'Waiting for payment confirmation…'
              : phase === 'sdk'
                ? 'Opening Razorpay…'
                : 'Starting payment…'}
          </Text>
        </View>
      ) : null}

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
