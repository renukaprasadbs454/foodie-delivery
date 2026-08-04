import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
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
import { useGetAddressesQuery } from '../../../api/endpoints/addressesApi';
import { useGetCartQuery } from '../../../api/endpoints/cartApi';
import {
  useApplyCouponMutation,
  useGetEligibleCouponsQuery,
} from '../../../api/endpoints/couponsApi';
import { useCreateOrderMutation } from '../../../api/endpoints/ordersApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { formatMoney, parseMoney } from '../../menu/types';
import type { BrowseStackParamList } from '../../../navigation/types';
import { AddressPickerRow } from '../components/AddressPickerRow';
import { CheckoutSkeleton } from '../components/CheckoutSkeleton';
import { CouponField } from '../components/CouponField';
import {
  isAddressId,
  validateCouponCode,
  type ApplyCouponResult,
} from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Checkout'>;

/**
 * P2-CUS-04 Checkout — address + coupon preview + place order (Idempotency-Key).
 * Address create/manage deferred to P2-CUS-07; empty list → Addresses CTA.
 */
export function CheckoutScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const cartQuery = useGetCartQuery();
  const addressesQuery = useGetAddressesQuery();
  const [applyCoupon, applyState] = useApplyCouponMutation();
  const [createOrder, createState] = useCreateOrderMutation();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [couponDraft, setCouponDraft] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponPreview, setCouponPreview] = useState<ApplyCouponResult | null>(
    null,
  );
  const placeAttemptKey = useRef<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

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

  const cart = cartQuery.data;
  const cartTotal = parseMoney(cart?.subtotal);
  const restaurantId = cart?.restaurantId ?? undefined;
  const addresses = addressesQuery.data ?? [];

  const eligibleQuery = useGetEligibleCouponsQuery(
    {
      restaurantId: restaurantId ?? '',
      cartTotal,
    },
    { skip: !restaurantId || cartTotal <= 0 },
  );

  useEffect(() => {
    trackAnalyticsEvent('customer_checkout_viewed');
    trackAnalyticsEvent('checkout_started');
  }, []);

  useEffect(() => {
    const list = addressesQuery.data;
    if (!addressId && list && list.length > 0) {
      const preferred =
        list.find((row) => row.isDefault)?.addressId ?? list[0]?.addressId;
      if (preferred) setAddressId(preferred);
    }
  }, [addressId, addressesQuery.data]);

  const previewLabel = useMemo(() => {
    if (!couponPreview) return null;
    return `Preview: −₹${formatMoney(couponPreview.discountAmount)} → ₹${formatMoney(couponPreview.finalTotal)}`;
  }, [couponPreview]);

  const loading =
    cartQuery.isLoading || addressesQuery.isLoading || createState.isLoading;

  const onApplyCoupon = async () => {
    const validation = validateCouponCode(couponDraft);
    if (!validation.ok) {
      setToast({ message: validation.message, variant: 'error' });
      return;
    }
    if (!restaurantId) {
      setToast({ message: 'Cart has no restaurant.', variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to apply a coupon.',
        variant: 'warning',
      });
      return;
    }
    try {
      const result = await applyCoupon({
        code: validation.code,
        restaurantId,
        cartTotal,
      }).unwrap();
      setAppliedCoupon(result.code);
      setCouponPreview(result);
      trackAnalyticsEvent('coupon_applied', { codeLength: result.code.length });
      setToast({ message: 'Coupon preview applied', variant: 'success' });
    } catch (err) {
      setCouponPreview(null);
      setAppliedCoupon(null);
      handleError(toUnwrappedApiError(err));
    }
  };

  const onPlaceOrder = async () => {
    if (!addressId || !isAddressId(addressId)) {
      setToast({ message: 'Select a delivery address.', variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to place your order.',
        variant: 'warning',
      });
      return;
    }
    if (!cart?.items?.length) {
      setToast({ message: 'Your cart is empty.', variant: 'error' });
      return;
    }
    if (!placeAttemptKey.current) {
      placeAttemptKey.current = createIdempotencyKey();
    }
    trackAnalyticsEvent('place_order_tapped');
    try {
      const order = await createOrder({
        addressId,
        couponCode: appliedCoupon,
        idempotencyKey: placeAttemptKey.current,
      }).unwrap();
      trackAnalyticsEvent('checkout_completed', { orderId: order.orderId });
      placeAttemptKey.current = null;
      navigation.replace('Payment', { orderId: order.orderId });
    } catch (err) {
      handleError(toUnwrappedApiError(err));
    }
  };

  if (cartQuery.isError) {
    return (
      <EmptyState
        title="Cart unavailable"
        description="Return to cart and try again."
        accessibilityLabel="Checkout cart error"
        actionLabel="Back to cart"
        onAction={() => navigation.navigate('Cart')}
      />
    );
  }

  if (!cartQuery.isLoading && (!cart?.items || cart.items.length === 0)) {
    return (
      <EmptyState
        title="Cart is empty"
        description="Add items before checkout. No cash on delivery."
        accessibilityLabel="Checkout empty cart"
        actionLabel="Browse"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          gap: tokens.spacing.md,
          paddingBottom: 140,
        }}
        refreshControl={
          <RefreshControl
            refreshing={cartQuery.isFetching || addressesQuery.isFetching}
            onRefresh={() => {
              void cartQuery.refetch();
              void addressesQuery.refetch();
              if (restaurantId) void eligibleQuery.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Checkout
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — placing an order is blocked.
          </Text>
        ) : null}

        {loading && !cart ? (
          <CheckoutSkeleton />
        ) : (
          <>
            <Text variant="heading2">Delivery address</Text>
            {addressesQuery.isLoading ? (
              <CheckoutSkeleton />
            ) : addresses.length === 0 ? (
              <EmptyState
                title="No addresses yet"
                description="Add a delivery address to continue checkout."
                accessibilityLabel="Checkout no addresses"
                actionLabel="Addresses"
                onAction={() =>
                  navigation.navigate('Addresses', { selectMode: true })
                }
              />
            ) : (
              <View style={{ gap: tokens.spacing.sm }}>
                {addresses.map((address) => (
                  <AddressPickerRow
                    key={address.addressId}
                    address={address}
                    selected={addressId === address.addressId}
                    onSelect={() => {
                      setAddressId(address.addressId);
                      trackAnalyticsEvent('address_selected', {
                        addressId: address.addressId,
                      });
                      placeAttemptKey.current = null;
                    }}
                  />
                ))}
                <Pressable
                  onPress={() =>
                    navigation.navigate('Addresses', { selectMode: true })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Manage addresses"
                >
                  <Text variant="label" color={tokens.color.accent}>
                    Manage addresses
                  </Text>
                </Pressable>
              </View>
            )}

            <Text variant="heading2">Coupon</Text>
            <CouponField
              value={couponDraft}
              onChangeText={(value) => {
                setCouponDraft(value);
                placeAttemptKey.current = null;
              }}
              onApply={() => {
                void onApplyCoupon();
              }}
              applying={applyState.isLoading}
              disabled={!isConnected || !restaurantId}
              previewLabel={previewLabel}
            />
            {(eligibleQuery.data ?? []).length > 0 ? (
              <Text variant="caption" color={tokens.color.textSecondary}>
                Eligible:{' '}
                {(eligibleQuery.data ?? [])
                  .slice(0, 5)
                  .map((c) => c.code)
                  .join(', ')}
              </Text>
            ) : null}

            <Text variant="heading2">Order summary</Text>
            <Text variant="body">
              Subtotal ₹{formatMoney(cart?.subtotal)}
            </Text>
            {couponPreview ? (
              <Text variant="bodySmall" color={tokens.color.textSecondary}>
                Preview discount −₹{formatMoney(couponPreview.discountAmount)}
              </Text>
            ) : null}
            <Text variant="caption" color={tokens.color.textSecondary}>
              No cash on delivery. Final totals are confirmed by the server when
              the order is placed.
            </Text>
          </>
        )}
      </ScrollView>

      <View
        style={{
          padding: tokens.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: tokens.color.border,
          gap: tokens.spacing.sm,
          backgroundColor: tokens.color.background,
        }}
      >
        <Button
          label="Place order"
          accessibilityLabel="Place order"
          loading={createState.isLoading}
          disabled={
            !isConnected ||
            createState.isLoading ||
            addresses.length === 0 ||
            !addressId
          }
          onPress={() => {
            void onPlaceOrder();
          }}
        />
        <Button
          label="Back to cart"
          accessibilityLabel="Back to cart"
          variant="secondary"
          onPress={() => navigation.navigate('Cart')}
        />
      </View>

      {createState.isLoading ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: tokens.color.overlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Placing order"
        >
          <ActivityIndicator color={tokens.color.accent} />
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
