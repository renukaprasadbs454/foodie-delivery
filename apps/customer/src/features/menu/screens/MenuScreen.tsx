import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  MIN_TOUCH_TARGET,
  Modal,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useAddCartItemMutation,
  useClearCartMutation,
  useGetCartQuery,
} from '../../../api/endpoints/cartApi';
import { useGetMenuQuery } from '../../../api/endpoints/menuApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { BrowseStackParamList } from '../../../navigation/types';
import { MenuItemRow } from '../components/MenuItemRow';
import { MenuSkeleton } from '../components/MenuSkeleton';
import { VariantPicker } from '../components/VariantPicker';
import type { AddCartItemRequest, MenuItem } from '../types';
import {
  formatMoney,
  isClearCartConflict,
  isMenuRestaurantId,
  parseMoney,
  validateAddCartItem,
} from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Menu'>;

type MenuSection = {
  title: string;
  categoryId: string;
  data: MenuItem[];
};

/**
 * P2-CUS-02 Menu — §4.1 tree + cart add §5.2; CLEAR_CART conflict recovery.
 * P2-OPT-01 — SectionList virtualization (SD §25).
 */
export function MenuScreen({ navigation, route }: Props) {
  const { restaurantId } = route.params;
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const validId = isMenuRestaurantId(restaurantId);

  const menuQuery = useGetMenuQuery(restaurantId, { skip: !validId });
  useGetCartQuery(undefined, { skip: !validId });
  const [addCartItem, addState] = useAddCartItemMutation();
  const [clearCart, clearState] = useClearCartMutation();

  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [pendingReadd, setPendingReadd] = useState<
    (AddCartItemRequest & { optimisticUnitPrice: number }) | null
  >(null);
  const [conflictVisible, setConflictVisible] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => {
      if (isClearCartConflict(error.code)) {
        setConflictVisible(true);
        return;
      }
      setToast({ message: error.message, variant: 'error' });
    },
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) =>
      setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_menu_viewed', { restaurantId });
  }, [restaurantId]);

  const sections = useMemo((): MenuSection[] => {
    const list = menuQuery.data?.categories ?? [];
    return [...list]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({
        title: category.name,
        categoryId: category.categoryId,
        data: category.items,
      }));
  }, [menuQuery.data?.categories]);

  const openPicker = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setOpenItem(item);
    setVariantId(item.variants[0]?.variantId ?? null);
    setQuantity('1');
    setNotes('');
    trackAnalyticsEvent('add_to_cart_tapped', {
      menuItemId: item.menuItemId,
    });
  };

  const closePicker = () => {
    setOpenItem(null);
    setVariantId(null);
  };

  const optimisticUnitPrice = useMemo(() => {
    if (!openItem) return 0;
    const base = parseMoney(openItem.basePrice);
    if (!variantId) return base;
    const variant = openItem.variants.find((v) => v.variantId === variantId);
    return base + parseMoney(variant?.priceDelta);
  }, [openItem, variantId]);

  const submitAdd = async (payload: AddCartItemRequest, unitPrice: number) => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to add items.',
        variant: 'warning',
      });
      return;
    }
    setPendingReadd({ ...payload, optimisticUnitPrice: unitPrice });
    try {
      await addCartItem({
        ...payload,
        optimisticUnitPrice: unitPrice,
      }).unwrap();
      trackAnalyticsEvent('cart_item_added', {
        menuItemId: payload.menuItemId,
      });
      setToast({ message: 'Added to cart', variant: 'success' });
      closePicker();
      setPendingReadd(null);
    } catch (err) {
      const apiErr = toUnwrappedApiError(err);
      if (isClearCartConflict(apiErr.code)) {
        setConflictVisible(true);
        return;
      }
      handleError(apiErr);
    }
  };

  const onConfirmAdd = () => {
    if (!openItem) return;
    const qty = Number(quantity);
    const validation = validateAddCartItem({
      quantity: qty,
      notes,
      requiresVariant: openItem.variants.length > 0,
      variantId,
    });
    if (!validation.ok) {
      setToast({ message: validation.message, variant: 'error' });
      return;
    }
    if (variantId) {
      trackAnalyticsEvent('variant_selected', { variantId });
    }
    void submitAdd(
      {
        menuItemId: openItem.menuItemId,
        variantId: openItem.variants.length > 0 ? variantId : null,
        quantity: qty,
        notes: notes.trim() || null,
      },
      optimisticUnitPrice,
    );
  };

  const onConfirmClearAndReadd = async () => {
    if (!pendingReadd) {
      setConflictVisible(false);
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to continue.',
        variant: 'warning',
      });
      return;
    }
    try {
      await clearCart().unwrap();
      const { optimisticUnitPrice: unit, ...payload } = pendingReadd;
      await addCartItem({
        ...payload,
        optimisticUnitPrice: unit,
      }).unwrap();
      trackAnalyticsEvent('cart_item_added', {
        menuItemId: payload.menuItemId,
      });
      setToast({ message: 'Cart cleared and item added', variant: 'success' });
      setConflictVisible(false);
      setPendingReadd(null);
      closePicker();
    } catch (err) {
      handleError(toUnwrappedApiError(err));
    }
  };

  if (!validId) {
    return (
      <EmptyState
        title="Invalid restaurant"
        description="The menu link is not valid."
        accessibilityLabel="Invalid menu restaurant id"
        actionLabel="Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  if (menuQuery.isError) {
    return (
      <EmptyState
        title="Menu unavailable"
        description="This restaurant menu could not be loaded."
        accessibilityLabel="Menu load error"
        actionLabel="Retry"
        onAction={() => {
          void menuQuery.refetch();
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.menuItemId}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          gap: tokens.spacing.md,
          paddingBottom: 96,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={menuQuery.isFetching}
            onRefresh={() => {
              void menuQuery.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: tokens.spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text variant="heading1" accessibilityRole="header">
                Menu
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Cart')}
                accessibilityRole="button"
                accessibilityLabel="Open cart"
                style={{
                  minHeight: MIN_TOUCH_TARGET,
                  justifyContent: 'center',
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  borderRadius: tokens.radius.md,
                  borderWidth: 1,
                  borderColor: tokens.color.border,
                }}
              >
                <Text variant="label">Cart</Text>
              </Pressable>
            </View>
            {!isConnected ? (
              <Text variant="caption" color={tokens.color.warning}>
                Offline — cached menu shown; adding items is blocked.
              </Text>
            ) : null}
            {menuQuery.isLoading ? <MenuSkeleton /> : null}
          </View>
        }
        ListEmptyComponent={
          menuQuery.isLoading ? null : (
            <EmptyState
              title="No menu items"
              description="This restaurant has not published a menu yet."
              accessibilityLabel="Menu empty"
            />
          )
        }
        renderSectionHeader={({ section }) => (
          <Text variant="heading2">{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <MenuItemRow item={item} onPress={() => openPicker(item)} />
        )}
      />

      <Modal
        visible={Boolean(openItem)}
        onRequestClose={closePicker}
        title={openItem?.name ?? 'Add item'}
        accessibilityLabel="Add to cart dialog"
      >
        {openItem ? (
          <View style={{ gap: tokens.spacing.md }}>
            <Text variant="bodySmall" color={tokens.color.textSecondary}>
              From ₹{formatMoney(openItem.basePrice)}
            </Text>
            {openItem.variants.length > 0 ? (
              <VariantPicker
                variants={openItem.variants}
                selectedVariantId={variantId}
                onSelect={setVariantId}
                basePrice={openItem.basePrice}
              />
            ) : null}
            <TextInput
              label="Quantity"
              accessibilityLabel="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <TextInput
              label="Notes (optional)"
              accessibilityLabel="Item notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Less spicy"
            />
            <Button
              label="Add to cart"
              accessibilityLabel="Confirm add to cart"
              loading={addState.isLoading}
              disabled={!isConnected || addState.isLoading}
              onPress={onConfirmAdd}
            />
            <Button
              label="Cancel"
              accessibilityLabel="Cancel add to cart"
              variant="secondary"
              onPress={closePicker}
            />
          </View>
        ) : null}
      </Modal>

      <Modal
        visible={conflictVisible}
        onRequestClose={() => setConflictVisible(false)}
        title="Replace cart?"
        accessibilityLabel="Clear cart conflict dialog"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body">
            Your cart has items from another restaurant. Clear it to add from
            this menu?
          </Text>
          <Button
            label="Clear cart and add"
            accessibilityLabel="Clear cart and add item"
            loading={clearState.isLoading || addState.isLoading}
            onPress={() => {
              void onConfirmClearAndReadd();
            }}
          />
          <Button
            label="Keep current cart"
            accessibilityLabel="Keep current cart"
            variant="secondary"
            onPress={() => setConflictVisible(false)}
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
