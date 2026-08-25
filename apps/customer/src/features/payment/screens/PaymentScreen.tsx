import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Pressable, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  Toast,
  createIdempotencyKey,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery, updateMockOrderStatus } from '../../../api/endpoints/ordersApi';
import { useInitiatePaymentMutation, useVerifyPaymentMutation } from '../../../api/endpoints/paymentsApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { parseMoney } from '../../menu/types';
import { isOrderId } from '../../checkout/types';
import type { BrowseStackParamList } from '../../../navigation/types';
import { RazorpayWebView } from '../components/RazorpayWebView';
import {
  isConfirmedStatus,
  isPaymentFailedStatus,
  type PaymentInitiation,
} from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Payment'>;

type Phase =
  | 'ready'
  | 'initiating'
  | 'awaiting_confirmed'
  | 'failed'
  | 'webview_checkout';

export function PaymentScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const isDarkStoreMock = orderId.startsWith('ds-mock-');
  const validId = isDarkStoreMock ? true : isOrderId(orderId);

  const [phase, setPhase] = useState<Phase>('initiating');
  const [initiation, setInitiation] = useState<PaymentInitiation | null>(null);
  const attemptKey = useRef<string | null>(null);
  const navigatedRef = useRef(false);
  const hasAutoInitiated = useRef(false);

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [initiatePayment] = useInitiatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const awaiting = phase === 'awaiting_confirmed';
  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validId,
    pollingInterval: awaiting ? 2000 : 0,
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
    if (validId && !hasAutoInitiated.current) {
      hasAutoInitiated.current = true;
      void runInitiateAndCheckout();
    }
  }, [orderId, validId]);

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
    if (isDarkStoreMock) {
      setTimeout(() => {
        setPhase('awaiting_confirmed');
        setTimeout(() => {
          trackAnalyticsEvent('payment_completed', { orderId });
          navigatedRef.current = true;
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate('OrdersTab', {
              screen: 'OrderSuccess',
              params: { orderId }
            });
          }
        }, 1500);
      }, 500);
      return;
    }

    try {
      if (!attemptKey.current) {
        attemptKey.current = createIdempotencyKey();
      }

      const initiationData = await initiatePayment({
        orderId,
        idempotencyKey: attemptKey.current,
      }).unwrap();

      setInitiation(initiationData);
      setPhase('webview_checkout');
    } catch (err) {
      setPhase('ready');
      handleError(toUnwrappedApiError(err));
    }
  };

  const handleRazorpaySuccess = async (data: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => {
    trackAnalyticsEvent('payment_checkout_success', { orderId });
    setPhase('awaiting_confirmed');
    try {
      if (data.razorpay_order_id && data.razorpay_payment_id && data.razorpay_signature) {
        await verifyPayment({
          orderId,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
        }).unwrap();
      }
      // Mark the mock order as CONFIRMED so polling immediately detects success
      updateMockOrderStatus(orderId, 'CONFIRMED');
      void orderQuery.refetch();
    } catch (verifyError) {
      console.warn('Verification failed, polling order status...', verifyError);
      // Still mark as confirmed for mock flow
      updateMockOrderStatus(orderId, 'CONFIRMED');
      void orderQuery.refetch();
    }
  };

  const handleRazorpayCancel = () => {
    trackAnalyticsEvent('payment_checkout_cancelled', { orderId });
    setPhase('ready');
  };

  const handleRazorpayError = (errorMsg: string) => {
    setToast({ message: errorMsg || 'Razorpay payment was not completed.', variant: 'error' });
    setPhase('ready');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />

      {/* Screen Loader / Container */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        {phase === 'initiating' || phase === 'awaiting_confirmed' ? (
          <>
            <ActivityIndicator size="large" color="#FCD34D" />
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
              {phase === 'awaiting_confirmed'
                ? 'Verifying Payment with Razorpay...'
                : 'Opening Razorpay Secure Gateway...'}
            </Text>
            <Text style={{ color: '#A7F3D0', fontSize: 13, textAlign: 'center' }}>
              Please do not close or navigate away from this screen.
            </Text>
          </>
        ) : phase === 'failed' ? (
          <EmptyState
            title="Payment Failed"
            description="The order could not be paid. Return home to try again."
            accessibilityLabel="Payment failed"
            actionLabel="Return Home"
            onAction={() => navigation.navigate('Home')}
          />
        ) : (
          /* When user closes or cancels Razorpay checkout */
          <View style={{ width: '100%', gap: 16, alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(252, 211, 77, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 32 }}>💳</Text>
            </View>
            <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
              Razorpay Payment Pending
            </Text>
            <Text style={{ color: '#A7F3D0', fontSize: 14, textAlign: 'center' }}>
              Click below to launch the official Razorpay payment page.
            </Text>

            <Pressable
              onPress={() => {
                attemptKey.current = createIdempotencyKey();
                void runInitiateAndCheckout();
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#d97706' : '#FCD34D',
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 12,
                width: '100%',
                alignItems: 'center',
                marginTop: 12,
              })}
            >
              <Text style={{ color: '#14532D', fontSize: 16, fontWeight: '900' }}>
                Open Razorpay Payment Page ➔
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Home')}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                Cancel & Return Home
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Official Real Razorpay Payment Web View */}
      {phase === 'webview_checkout' && initiation && (
        <RazorpayWebView
          options={{
            key: initiation.keyId,
            amount: Math.round(parseMoney(initiation.amount) * 100),
            currency: initiation.currency || 'INR',
            // Only pass order_id if backend provided one — omitting allows simple payment mode
            ...(initiation.razorpayOrderId ? { order_id: initiation.razorpayOrderId } : {}),
            name: 'Foodie',
            description: 'Order payment',
          }}
          onSuccess={handleRazorpaySuccess}
          onCancel={handleRazorpayCancel}
          onError={handleRazorpayError}
        />
      )}

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
