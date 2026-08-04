import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
  const { isConnected } = useConnectivity();
  const validId = isOrderId(orderId);

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
          screen: 'OrderSuccess',
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
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to pay.',
        variant: 'warning',
      });
      return;
    }
    if (!attemptKey.current) {
      attemptKey.current = createIdempotencyKey();
    }
    setPhase('initiating');
    try {
      const result = await initiatePayment({
        orderId,
        idempotencyKey: attemptKey.current,
      }).unwrap();
      setInitiation(result);
      trackAnalyticsEvent('payment_initiated', { orderId });
      setPhase('sdk');
      trackAnalyticsEvent('payment_sdk_opened', { orderId });
      const sdkResult = await openRazorpayCheckout(result);
      if (sdkResult.status === 'cancelled') {
        setPhase('ready');
        setToast({ message: 'Payment cancelled.', variant: 'warning' });
        trackAnalyticsEvent('payment_failed', { orderId, reason: 'cancelled' });
        return;
      }
      if (sdkResult.status === 'error') {
        setPhase('ready');
        setToast({ message: sdkResult.message, variant: 'error' });
        return;
      }
      if (sdkResult.status === 'unavailable') {
        setToast({ message: sdkResult.message, variant: 'info' });
        setPhase('unavailable_sdk');
      } else {
        // Client success is not truth — wait for webhook → CONFIRMED.
        setPhase('awaiting_confirmed');
      }
      void orderQuery.refetch();
    } catch (err) {
      setPhase('ready');
      handleError(toUnwrappedApiError(err));
      trackAnalyticsEvent('payment_failed', { orderId });
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
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.lg,
        gap: tokens.spacing.md,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
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
      {orderQuery.data ? (
        <Text variant="heading2">
          Status: {orderQuery.data.status}
          {orderQuery.data.totalAmount != null
            ? ` · ₹${formatMoney(orderQuery.data.totalAmount)}`
            : ''}
        </Text>
      ) : null}
      {initiation ? (
        <Text variant="bodySmall" color={tokens.color.textSecondary}>
          Razorpay order ready · {initiation.currency}{' '}
          {formatMoney(initiation.amount)}
        </Text>
      ) : null}
      <Text variant="caption" color={tokens.color.textSecondary}>
        Confirmation comes from the server after Razorpay webhook capture — not
        from the client SDK alone. No cash on delivery.
      </Text>

      {phase === 'failed' ? (
        <EmptyState
          title="Payment not completed"
          description="The order is no longer payable. Return home or contact support."
          accessibilityLabel="Payment failed"
          actionLabel="Home"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <>
          <Button
            label={
              phase === 'awaiting_confirmed' || phase === 'unavailable_sdk'
                ? 'Waiting for confirmation…'
                : 'Pay now'
            }
            accessibilityLabel="Pay now"
            loading={phase === 'initiating' || phase === 'sdk'}
            disabled={!isConnected || blocking}
            onPress={() => {
              attemptKey.current = createIdempotencyKey();
              void runInitiateAndCheckout();
            }}
          />
          {phase === 'ready' && initiation ? (
            <Button
              label="Retry payment"
              accessibilityLabel="Retry payment"
              variant="secondary"
              disabled={!isConnected}
              onPress={onRetry}
            />
          ) : null}
          <Button
            label="My orders"
            accessibilityLabel="My orders"
            variant="secondary"
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('OrdersTab' as never);
              } else {
                navigation.navigate('Home');
              }
            }}
          />
        </>
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
    </View>
  );
}
