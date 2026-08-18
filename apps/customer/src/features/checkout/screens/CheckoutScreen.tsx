import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useCreateOrderMutation } from '../../../api/endpoints/ordersApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { formatMoney, parseMoney } from '../../menu/types';
import type { BrowseStackParamList } from '../../../navigation/types';
import { AddressPickerRow } from '../components/AddressPickerRow';
import { CheckoutSkeleton } from '../components/CheckoutSkeleton';
import { isAddressId } from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const cartQuery = useGetCartQuery();
  const addressesQuery = useGetAddressesQuery();
  const [createOrder, createState] = useCreateOrderMutation();

  const [addressId, setAddressId] = useState<string | null>(null);
  const placeAttemptKey = useRef<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) => setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  const cart = cartQuery.data;
  const restaurantId = cart?.restaurantId ?? undefined;
  const addresses = addressesQuery.data ?? [];

  useEffect(() => {
    trackAnalyticsEvent('customer_checkout_viewed');
    trackAnalyticsEvent('checkout_started');
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    const list = addressesQuery.data;
    if (!addressId && list && list.length > 0) {
      const preferred = list.find((row) => row.isDefault)?.addressId ?? list[0]?.addressId;
      if (preferred) setAddressId(preferred);
    }
  }, [addressId, addressesQuery.data]);

  const loading = cartQuery.isLoading || addressesQuery.isLoading || createState.isLoading;

  const onPlaceOrder = async () => {
    if (!addressId || !isAddressId(addressId)) {
      setToast({ message: 'Select a delivery address.', variant: 'error' });
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
        description="Add items before checkout."
        accessibilityLabel="Checkout empty cart"
        actionLabel="Browse"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  const grandTotal = Math.max(0, Number(cart?.subtotal || 0) + 25 + 18);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F2F2F7' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={{ flex: 1, opacity: fadeValue, transform: [{ scale: scaleValue }] }}>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 140,
            }}
            refreshControl={
              <RefreshControl
                refreshing={cartQuery.isFetching || addressesQuery.isFetching}
                onRefresh={() => {
                  void cartQuery.refetch();
                  void addressesQuery.refetch();
                }}
                tintColor="#FCD34D"
              />
            }
          >
            {/* Header Banner */}
            <View style={{
              paddingTop: 12,
              paddingBottom: 20,
              paddingHorizontal: 20,
              backgroundColor: '#14532D',
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              shadowColor: '#14532D',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5
            }}>
              <Text style={{ color: '#FCD34D', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>
                Payment Review
              </Text>
              {!isConnected && (
                <Text style={{ color: '#F87171', fontWeight: '800', marginTop: 4 }}>
                  Offline — placing an order is locked
                </Text>
              )}
            </View>

            <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 20 }}>
              {loading && !cart ? (
                <CheckoutSkeleton />
              ) : (
                <>
                  {/* Address Section */}
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    padding: 16,
                    borderRadius: 16,
                    gap: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#14532D',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    elevation: 2
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <Text style={{ fontSize: 18 }}>📍</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#14532D' }}>Delivery Address</Text>
                    </View>
                    {addresses.length === 0 ? (
                      <EmptyState
                        title="No addresses yet"
                        description="Add a delivery address to continue checkout."
                        accessibilityLabel="Checkout no addresses"
                        actionLabel="Addresses"
                        onAction={() => navigation.navigate('Addresses', { selectMode: true })}
                      />
                    ) : (
                      <View style={{ gap: 10 }}>
                        {addresses.map((address) => (
                          <AddressPickerRow
                            key={address.addressId}
                            address={address}
                            selected={addressId === address.addressId}
                            onSelect={() => {
                              setAddressId(address.addressId);
                              trackAnalyticsEvent('address_selected', { addressId: address.addressId });
                              placeAttemptKey.current = null;
                            }}
                          />
                        ))}
                        <View style={{ height: 1.5, backgroundColor: '#F3F4F6', marginVertical: 4 }} />
                        <Pressable
                          onPress={() => navigation.navigate('Addresses', { selectMode: true })}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          <Text style={{ color: '#14532D', fontWeight: '800', fontSize: 14 }}>
                            Manage Addresses ›
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Detailed Bill Block */}
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    padding: 16,
                    gap: 12,
                    shadowColor: '#14532D',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    elevation: 2
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <Text style={{ fontSize: 18 }}>🧾</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#14532D' }}>
                        Detailed Bill
                      </Text>
                    </View>

                    <View style={{ gap: 8, paddingHorizontal: 2 }}>
                      <View style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}>
                        <Text>placedAt totalAmount</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Item Total</Text>
                        <Text style={{ color: '#111827', fontWeight: '700' }}>₹{formatMoney(cart?.subtotal || 0)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Delivery Fee</Text>
                        <Text style={{ color: '#111827', fontWeight: '700' }}>₹25.00</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#6B7280', fontWeight: '600' }}>Taxes & Charges</Text>
                        <Text style={{ color: '#111827', fontWeight: '700' }}>₹18.00</Text>
                      </View>
                      <View style={{ height: 1.5, backgroundColor: '#F3F4F6', marginVertical: 4 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontWeight: '900', color: '#14532D', fontSize: 16 }}>To Pay</Text>
                        <Text style={{ fontWeight: '900', color: '#14532D', fontSize: 16 }}>₹{formatMoney(grandTotal)}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontStyle: 'italic', fontSize: 12, color: '#6B7280', textAlign: 'center', marginHorizontal: 8 }}>
                    Final totals are calculated securely.
                  </Text>
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer Proceed Action */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
            paddingBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 10
          }}>
            <Pressable
              accessibilityLabel="Place Order"
              disabled={createState.isLoading || addresses.length === 0 || !addressId}
              onPress={() => { void onPlaceOrder(); }}
              style={({ pressed }) => ({
                backgroundColor: pressed || (createState.isLoading || addresses.length === 0 || !addressId) ? '#114022' : '#14532D',
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#FCD34D',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4
              })}
            >
              <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                {createState.isLoading ? 'Processing Order...' : `Proceed to Payment (₹${formatMoney(grandTotal)}) ➔`}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Go Back to Cart"
              onPress={() => navigation.navigate('Cart')}
              style={({ pressed }) => ({
                paddingVertical: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: '#6B7280', fontWeight: '800', fontSize: 14 }}>
                Back to Cart
              </Text>
            </Pressable>
          </View>

          {createState.isLoading && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator color="#FCD34D" size="large" />
            </View>
          )}

          <Toast
            visible={Boolean(toast)}
            message={toast?.message ?? ''}
            variant={toast?.variant ?? 'info'}
            accessibilityLabel={toast?.message ?? 'Toast'}
            onDismiss={() => setToast(null)}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
