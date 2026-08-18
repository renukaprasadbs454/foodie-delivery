import React, { useEffect, useState, useRef } from 'react';
import { FlatList, RefreshControl, View, StatusBar, Pressable, TextInput as RNTextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Modal,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useClearCartMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemQuantityMutation,
} from '../../../api/endpoints/cartApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { BrowseStackParamList } from '../../../navigation/types';
import { formatMoney, isMenuRestaurantId } from '../../menu/types';
import { CartItemRow } from '../components/CartItemRow';
import { useGetMenuQuery } from '../../../api/endpoints/menuApi';
import { useGetRestaurantQuery } from '../../../api/endpoints/restaurantsApi';
import * as Location from 'expo-location';
import { useGetAddressesQuery } from '../../../api/endpoints/addressesApi';
import { useGetMyProfileQuery } from '../../../api/endpoints/usersApi';
import { MOCK_RESTAURANTS, MOCK_MENUS } from '../../restaurants/mockData';
import { canProceedToCheckout } from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const cartQuery = useGetCartQuery();
  const [removeCartItem, removeState] = useRemoveCartItemMutation();
  const [updateItemQuantity] = useUpdateCartItemQuantityMutation();
  const [clearCart, clearState] = useClearCartMutation();
  const [clearVisible, setClearVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: addresses } = useGetAddressesQuery();
  const { data: myProfile } = useGetMyProfileQuery();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

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

  useEffect(() => {
    trackAnalyticsEvent('customer_cart_viewed');
    trackAnalyticsEvent('cart_viewed');
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

  const items = cartQuery.data?.items ?? [];
  const checkoutEnabled = canProceedToCheckout(items.length);
  const restaurantId = cartQuery.data?.restaurantId;

  const validId = restaurantId ? (isMenuRestaurantId(restaurantId) || restaurantId.startsWith('mock-resto-')) : false;
  const isMock = restaurantId?.startsWith('mock-resto-') ?? false;

  const menuQuery = useGetMenuQuery(restaurantId || '', { skip: !validId || isMock });
  const { data: realRestaurant } = useGetRestaurantQuery(restaurantId || '', { skip: !validId || isMock });

  const mockRestaurant = isMock ? MOCK_RESTAURANTS.find((r: any) => r.id === restaurantId) : null;
  const restaurantData = isMock ? mockRestaurant : realRestaurant;
  const menuData = isMock && restaurantId ? MOCK_MENUS[restaurantId] : menuQuery.data;

  const menuItemsMap = new Map();
  menuData?.categories?.forEach((cat: any) => {
    cat.items.forEach((mi: any) => {
      menuItemsMap.set(mi.menuItemId, mi);
    });
  });

  const [userCity, setUserCity] = useState<string>('Bengaluru');
  const [distanceInfo, setDistanceInfo] = useState<string>('Estimating status...');
  useEffect(() => {
    (async () => {
      if (!restaurantId) return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setDistanceInfo('Location needed');
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const fakeDistanceKm = ((restaurantId.length % 10) / 2 + 1.2).toFixed(1);
        const baseMins = Math.round(parseFloat(fakeDistanceKm) * 5 + 12);
        setDistanceInfo(`Delivery in ${baseMins}-${baseMins + 5} mins`);

        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (reverseGeocode.length > 0) {
          const cityVal = reverseGeocode[0].city || reverseGeocode[0].subregion || reverseGeocode[0].district || 'Bengaluru';
          setUserCity(cityVal);
        }
      } catch (err) {
        setDistanceInfo('Delivery in 25-30 mins');
      }
    })();
  }, [restaurantId]);

  const onRemove = async (cartItemId: string) => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to update your cart.', variant: 'warning' });
      return;
    }
    setRemovingId(cartItemId);
    try {
      await removeCartItem(cartItemId).unwrap();
      trackAnalyticsEvent('item_removed', { cartItemId });
      setToast({ message: 'Item removed', variant: 'success' });
    } catch (err) {
      handleError(toUnwrappedApiError(err));
    } finally {
      setRemovingId(null);
    }
  };

  const onUpdateQuantity = async (cartItemId: string, newQty: number) => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to update your cart.', variant: 'warning' });
      return;
    }
    setRemovingId(cartItemId);
    try {
      if (newQty > 0) {
        await updateItemQuantity({ cartItemId, quantity: newQty }).unwrap();
      } else {
        await removeCartItem(cartItemId).unwrap();
        trackAnalyticsEvent('item_removed', { cartItemId });
      }
    } catch (err) {
      handleError(toUnwrappedApiError(err));
    } finally {
      setRemovingId(null);
    }
  };

  const onConfirmClear = async () => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to clear your cart.', variant: 'warning' });
      return;
    }
    try {
      await clearCart().unwrap();
      trackAnalyticsEvent('cart_cleared');
      setClearVisible(false);
      setToast({ message: 'Cart cleared', variant: 'success' });
    } catch (err) {
      handleError(toUnwrappedApiError(err));
    }
  };

  const showItems = !cartQuery.isLoading && !cartQuery.isError && items.length > 0;
  const subtotalAmt = Number(cartQuery.data?.subtotal) || 0;
  const deliveryFee = 25;
  const taxes = 18;
  const totalBill = Math.max(0, subtotalAmt + deliveryFee + taxes - discount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <Animated.View style={{ flex: 1, backgroundColor: '#F2F2F7', opacity: fadeValue, transform: [{ scale: scaleValue }] }}>
        <FlatList
          style={{ flex: 1 }}
          data={showItems ? items : []}
          keyExtractor={(item) => item.cartItemId}
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={cartQuery.isFetching}
              onRefresh={() => { void cartQuery.refetch(); }}
              tintColor="#FCD34D"
            />
          }
          ListHeaderComponent={
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 24, letterSpacing: -0.5 }}>
                    Checkout Cart
                  </Text>
                  {restaurantData?.name && (
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginTop: 4 }}>
                      {restaurantData.name}
                    </Text>
                  )}
                  <Text style={{ color: '#A7F3D0', fontWeight: '600', fontSize: 13, marginTop: 2 }}>
                    ⏱️ {distanceInfo} | {userCity}
                  </Text>
                </View>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const menuItem = menuItemsMap.get(item.menuItemId);
            return (
              <View style={{ backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingTop: index === 0 ? 16 : 8 }}>
                <CartItemRow
                  item={item}
                  name={menuItem?.name}
                  isVeg={menuItem?.isVeg}
                  onIncrement={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                  onDecrement={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                  loading={removeState.isLoading && removingId === item.cartItemId}
                />
              </View>
            );
          }}
          ListFooterComponent={
            showItems ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}>
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' }}>
                  <Pressable onPress={() => navigation.navigate('Home')}>
                    <Text style={{ color: '#14532D', fontWeight: '800', fontSize: 14 }}>+ Add more items</Text>
                  </Pressable>
                  <Text style={{ color: '#6B7280', fontWeight: '700', fontSize: 14 }}>|</Text>
                  <Pressable onPress={() => setClearVisible(true)}>
                    <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 14 }}>🗑️ Clear Cart</Text>
                  </Pressable>
                </View>

                {/* Promo Code Card */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: '#FFFFFF',
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                }}>
                  <View style={{ backgroundColor: '#FEF3C7', padding: 8, borderRadius: 10 }}>
                    <Text style={{ fontSize: 18 }}>🏷️</Text>
                  </View>
                  <RNTextInput
                    placeholder="Enter Promo Code"
                    placeholderTextColor="#6B7280"
                    style={{ flex: 1, color: '#111827', fontSize: 16, fontWeight: '700' }}
                    value={couponCode}
                    onChangeText={setCouponCode}
                  />
                  <Pressable
                    onPress={() => {
                      if (couponCode) {
                        setDiscount(40);
                        setToast({ message: 'Coupon Applied!', variant: 'success' });
                      }
                    }}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#14532D', borderRadius: 10 }}
                  >
                    <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 13 }}>APPLY</Text>
                  </Pressable>
                </View>

                {/* Delivery Information Block */}
                <View style={{
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  gap: 16,
                  shadowColor: '#14532D',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 2
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Text style={{ fontSize: 16 }}>⏱️</Text>
                    <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12, borderStyle: 'dotted' }}>
                      <Text style={{ color: '#111827', fontWeight: '800', fontSize: 14 }}>{distanceInfo}</Text>
                    </View>
                  </View>

                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
                    onPress={() => navigation.navigate('Addresses', { selectMode: true })}
                  >
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#111827', fontWeight: '800', fontSize: 14 }}>
                        {addresses?.[0] ? `Delivery at ${addresses[0].label || 'Home'}` : 'Delivery Address'}
                      </Text>
                      <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 13, marginTop: 4 }}>
                        {addresses?.[0]?.line1 || 'No address saved yet. Tap here to add one.'}
                      </Text>
                      <Text style={{ color: '#14532D', fontWeight: '800', fontSize: 13, marginTop: 10 }}>
                        {addresses?.[0] ? 'Change delivery address ›' : '+ Add delivery address'}
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {/* Contacts Block */}
                <View style={{
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 16 }}>📞</Text>
                    <Text style={{ color: '#111827', fontWeight: '800', fontSize: 14 }}>
                      {myProfile?.fullName || 'Customer'}, {myProfile?.phoneNumber || '—'}
                    </Text>
                  </View>
                </View>

                {/* Detailed Bill Block */}
                <View style={{
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Text style={{ fontSize: 16 }}>🧾</Text>
                    <Text style={{ color: '#14532D', fontWeight: '900', fontSize: 16 }}>
                      Detailed Bill
                    </Text>
                  </View>

                  <View style={{ gap: 8, paddingHorizontal: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#6B7280', fontWeight: '600' }}>Item Total</Text>
                      <Text style={{ color: '#111827', fontWeight: '700' }}>₹{formatMoney(subtotalAmt)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#6B7280', fontWeight: '600' }}>Delivery Partner Fee</Text>
                      <Text style={{ color: '#111827', fontWeight: '700' }}>₹{formatMoney(deliveryFee)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#6B7280', fontWeight: '600' }}>Taxes & Charges</Text>
                      <Text style={{ color: '#111827', fontWeight: '700' }}>₹{formatMoney(taxes)}</Text>
                    </View>
                    {discount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#10B981', fontWeight: '700' }}>Coupon Discount</Text>
                        <Text style={{ color: '#10B981', fontWeight: '700' }}>-₹{formatMoney(discount)}</Text>
                      </View>
                    )}
                    <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#14532D', fontWeight: '900', fontSize: 16 }}>To Pay</Text>
                      <Text style={{ color: '#14532D', fontWeight: '900', fontSize: 16 }}>₹{formatMoney(totalBill)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 }}>
                <Text style={{ fontSize: 64, marginBottom: 16 }}>🛒</Text>
                <Text style={{ textAlign: 'center', color: '#14532D', fontWeight: '900', fontSize: 20, marginBottom: 8 }}>
                  Your cart is empty
                </Text>
                <Text style={{ textAlign: 'center', color: '#4B5563', marginBottom: 24, fontSize: 14 }}>
                  Good food is always cooking! Go ahead, order some yummy items from the menu.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('Home')}
                  style={{
                    backgroundColor: '#14532D',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                    borderWidth: 1.5,
                    borderColor: '#FCD34D',
                  }}
                >
                  <Text style={{ color: '#FCD34D', fontWeight: '800' }}>Browse Restaurants</Text>
                </Pressable>
              </View>
            )
          }
        />

        {/* Footer Proceed Button */}
        <View style={{
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
          {checkoutEnabled ? (
            <Pressable
              accessibilityLabel="Continue to Checkout"
              onPress={() => navigation.navigate('Checkout')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#0F3E22' : '#14532D',
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
              <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 16, letterSpacing: 0.8 }}>
                Continue to Checkout ➔
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => navigation.navigate('Home')}
                style={{
                  flex: 1,
                  backgroundColor: '#14532D',
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#FCD34D',
                }}
              >
                <Text style={{ color: '#FCD34D', fontWeight: '800' }}>Add Items</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Modal
          visible={clearVisible}
          onRequestClose={() => setClearVisible(false)}
          title="Clear cart?"
          accessibilityLabel="Confirm clear cart"
        >
          <View style={{ gap: tokens.spacing.md, padding: 8 }}>
            <Text style={{ fontSize: 16, color: '#4B5563', marginBottom: 12 }}>
              Are you sure you want to remove all items from your cart?
            </Text>
            <Pressable
              onPress={() => { void onConfirmClear(); }}
              style={{
                backgroundColor: '#DC2626',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Confirm Clear</Text>
            </Pressable>
            <Pressable
              onPress={() => setClearVisible(false)}
              style={{
                backgroundColor: '#F3F4F6',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#1F2937', fontWeight: '700' }}>Cancel</Text>
            </Pressable>
          </View>
        </Modal>

        <Toast
          visible={Boolean(toast)}
          message={toast?.message ?? ''}
          variant={toast?.variant ?? 'info'}
          accessibilityLabel={toast?.message ?? 'Toast'}
          onDismiss={() => setToast(null)}
        />
      </Animated.View>
    </SafeAreaView >
  );
}
