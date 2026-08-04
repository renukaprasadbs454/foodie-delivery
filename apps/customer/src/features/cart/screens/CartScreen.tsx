import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
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
} from '../../../api/endpoints/cartApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { BrowseStackParamList } from '../../../navigation/types';
import { formatMoney, isMenuRestaurantId } from '../../menu/types';
import { CartItemRow } from '../components/CartItemRow';
import { CartSkeleton } from '../components/CartSkeleton';
import { canProceedToCheckout, isCartItemId } from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Cart'>;

/**
 * P2-CUS-03 Cart — review/remove/clear; checkout gated when empty; no COD.
 * P2-OPT-01 — FlatList virtualization (SD §25).
 */
export function CartScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const cartQuery = useGetCartQuery();
  const [removeCartItem, removeState] = useRemoveCartItemMutation();
  const [clearCart, clearState] = useClearCartMutation();
  const [clearVisible, setClearVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
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

  useEffect(() => {
    trackAnalyticsEvent('customer_cart_viewed');
    trackAnalyticsEvent('cart_viewed');
  }, []);

  const items = cartQuery.data?.items ?? [];
  const checkoutEnabled = canProceedToCheckout(items.length);
  const restaurantId = cartQuery.data?.restaurantId;

  const onRemove = async (cartItemId: string) => {
    if (!isCartItemId(cartItemId)) {
      setToast({ message: 'Invalid cart item.', variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to update your cart.',
        variant: 'warning',
      });
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

  const onConfirmClear = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to clear your cart.',
        variant: 'warning',
      });
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

  const goBrowse = () => {
    navigation.navigate('Home');
  };

  const goMenu = () => {
    if (restaurantId && isMenuRestaurantId(restaurantId)) {
      navigation.navigate('Menu', { restaurantId });
      return;
    }
    navigation.goBack();
  };

  const showItems =
    !cartQuery.isLoading && !cartQuery.isError && items.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <FlatList
        style={{ flex: 1 }}
        data={showItems ? items : []}
        keyExtractor={(item) => item.cartItemId}
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          gap: tokens.spacing.md,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={cartQuery.isFetching}
            onRefresh={() => {
              void cartQuery.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: tokens.spacing.md }}>
            <Text variant="heading1" accessibilityRole="header">
              Cart
            </Text>
            {!isConnected ? (
              <Text variant="caption" color={tokens.color.warning}>
                Offline — showing cached cart; changes are blocked.
              </Text>
            ) : null}
            {cartQuery.isLoading ? <CartSkeleton /> : null}
            {cartQuery.isError ? (
              <EmptyState
                title="Could not load cart"
                description="Pull to retry."
                accessibilityLabel="Cart load error"
                actionLabel="Retry"
                onAction={() => {
                  void cartQuery.refetch();
                }}
              />
            ) : null}
            {!cartQuery.isLoading &&
            !cartQuery.isError &&
            items.length === 0 ? (
              <EmptyState
                title="Your cart is empty"
                description="Browse restaurants to add items. Cash on delivery is not available."
                accessibilityLabel="Cart empty"
                actionLabel="Browse restaurants"
                onAction={goBrowse}
              />
            ) : null}
          </View>
        }
        ListFooterComponent={
          showItems ? (
            <View style={{ gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }}>
              <Text variant="heading2">
                Subtotal ₹{formatMoney(cartQuery.data?.subtotal)}
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                No cash on delivery in V1.
              </Text>
              <Button
                label="Clear cart"
                accessibilityLabel="Clear cart"
                variant="secondary"
                disabled={!isConnected || clearState.isLoading}
                onPress={() => setClearVisible(true)}
              />
              <Button
                label="Back to menu"
                accessibilityLabel="Back to menu"
                variant="secondary"
                onPress={goMenu}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            removeDisabled={!isConnected || removeState.isLoading}
            removeLoading={
              removeState.isLoading && removingId === item.cartItemId
            }
            onRemove={() => {
              void onRemove(item.cartItemId);
            }}
          />
        )}
      />

      <View
        style={{
          padding: tokens.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: tokens.color.border,
          backgroundColor: tokens.color.background,
          gap: tokens.spacing.sm,
        }}
      >
        <Button
          label="Checkout"
          accessibilityLabel="Checkout"
          disabled={!checkoutEnabled}
          onPress={() => {
            if (!checkoutEnabled) return;
            trackAnalyticsEvent('checkout_tapped');
            navigation.navigate('Checkout');
          }}
        />

        {!checkoutEnabled ? (
          <Text
            variant="caption"
            color={tokens.color.textSecondary}
            style={{ textAlign: 'center' }}
          >
            Add items to enable checkout.
          </Text>
        ) : null}
      </View>

      <Modal
        visible={clearVisible}
        onRequestClose={() => setClearVisible(false)}
        title="Clear cart?"
        accessibilityLabel="Confirm clear cart"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body">Remove all items from your cart?</Text>
          <Button
            label="Clear cart"
            accessibilityLabel="Confirm clear cart"
            variant="danger"
            loading={clearState.isLoading}
            onPress={() => {
              void onConfirmClear();
            }}
          />
          <Button
            label="Cancel"
            accessibilityLabel="Cancel clear cart"
            variant="secondary"
            onPress={() => setClearVisible(false)}
          />
        </View>
      </Modal>

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
