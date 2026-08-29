import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View, ScrollView, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, EmptyState, Modal, Text, TextInput, Toast, trackAnalyticsEvent, useApiErrorHandler, useConnectivity, useTheme } from 'foodie-shared-rn';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGetRestaurantQuery } from '../../../api/endpoints/restaurantsApi';
import { MOCK_RESTAURANTS, MOCK_MENUS } from '../../restaurants/mockData';
import { GlobalCartBanner } from '../../cart/components/GlobalCartBanner';
import { useAddCartItemMutation, useClearCartMutation, useGetCartQuery, useUpdateCartItemQuantityMutation, useRemoveCartItemMutation } from '../../../api/endpoints/cartApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { BrowseStackParamList } from '../../../navigation/types';
import { MenuItemRow } from '../components/MenuItemRow';
import { MenuSkeleton } from '../components/MenuSkeleton';
import { VariantPicker } from '../components/VariantPicker';
import type { AddCartItemRequest, MenuItem } from '../types';
import { formatMoney, isClearCartConflict, isMenuRestaurantId, parseMoney, validateAddCartItem } from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Menu'>;
type MenuSection = { title: string; categoryId: string; data: MenuItem[]; };

export function MenuScreen({ navigation, route }: Props) {
  const { restaurantId } = route.params;
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const isMock = !!restaurantId && restaurantId.startsWith('mock-resto-');
  const validId = !!restaurantId && (isMenuRestaurantId(restaurantId) || isMock);

  const cartQuery = useGetCartQuery(undefined, { skip: !validId });
  const cartItemsCount = cartQuery?.data?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0;
  const cartSubtotal = cartQuery?.data?.subtotal ?? 0;
  const isCurrentRestaurantCart = cartQuery?.data?.restaurantId === restaurantId;

  const [addCartItem, addState] = useAddCartItemMutation();
  const [clearCart, clearState] = useClearCartMutation();
  const [updateItemQuantity] = useUpdateCartItemQuantityMutation();
  const [removeCartItem] = useRemoveCartItemMutation();

  const { data: realRestaurant } = useGetRestaurantQuery(restaurantId || '', { skip: !validId || isMock });
  const mockRestaurant = isMock ? MOCK_RESTAURANTS.find(r => r.id === restaurantId) : null;
  const restaurantData = isMock ? mockRestaurant : realRestaurant;

  const [distanceInfo, setDistanceInfo] = useState<string>('Estimating...');
  useEffect(() => {
    (async () => {
      try {
        const fakeDistanceKm = (((restaurantId?.length ?? 1) % 10) / 2 + 1.2).toFixed(1);
        const baseMins = Math.round(parseFloat(fakeDistanceKm) * 5 + 12);
        setDistanceInfo(`${baseMins}-${baseMins + 5} mins • ${fakeDistanceKm} km`);
      } catch (err) {
        setDistanceInfo('25-30 mins • 3.0 km');
      }
    })();
  }, [restaurantId]);

  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [pendingReadd, setPendingReadd] = useState<(AddCartItemRequest & { optimisticUnitPrice: number }) | null>(null);
  const [conflictVisible, setConflictVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'info' | 'success' | 'error' | 'warning'; } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg' | 'non-veg' | 'egg' | 'recommended'>('all');

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => {
      if (isClearCartConflict(error.code)) { setConflictVisible(true); return; }
      setToast({ message: error.message, variant: 'error' });
    }
  });

  const openPicker = (item: MenuItem) => { setOpenItem(item); setVariantId(item.variants[0]?.variantId || null); setQuantity('1'); setNotes(''); };
  const closePicker = () => { setOpenItem(null); setVariantId(null); };

  const optimisticUnitPrice = useMemo(() => {
    if (!openItem) return 0;
    const base = parseMoney(openItem.basePrice);
    if (!variantId) return base;
    const variant = openItem.variants.find((v) => v.variantId === variantId);
    return base + parseMoney(variant?.priceDelta);
  }, [openItem, variantId]);

  const submitAdd = async (payload: AddCartItemRequest, unitPrice: number) => {
    setPendingReadd({ ...payload, optimisticUnitPrice: unitPrice });
    try {
      await addCartItem({ ...payload, optimisticUnitPrice: unitPrice }).unwrap();
      trackAnalyticsEvent('cart_item_added', { menuItemId: payload.menuItemId });
      closePicker();
      setPendingReadd(null);
    } catch (err) {
      const apiErr = toUnwrappedApiError(err);
      if (isClearCartConflict(apiErr.code)) { setConflictVisible(true); return; }
      handleError(apiErr);
    }
  };

  const onConfirmAdd = () => {
    if (!openItem) return;
    const qty = Number(quantity);
    const validation = validateAddCartItem({ quantity: qty, notes, requiresVariant: openItem.variants.length > 0, variantId });
    if (!validation.ok) { setToast({ message: validation.message, variant: 'error' }); return; }
    void submitAdd({ menuItemId: openItem.menuItemId, variantId: openItem.variants.length > 0 ? variantId : null, quantity: qty, notes: notes.trim() || null }, optimisticUnitPrice);
  };

  const onConfirmClearAndReadd = async () => {
    if (!pendingReadd) { setConflictVisible(false); return; }
    try {
      await clearCart().unwrap();
      const { optimisticUnitPrice: unit, ...payload } = pendingReadd;
      await addCartItem({ ...payload, optimisticUnitPrice: unit }).unwrap();
      setConflictVisible(false);
      setPendingReadd(null);
      closePicker();
    } catch (err) {
      handleError(toUnwrappedApiError(err));
    }
  };

  const cartItems = cartQuery?.data?.items ?? [];

  const handleAddOrVariant = (item: MenuItem) => {
    if (cartItemsCount > 0 && !isCurrentRestaurantCart) { setConflictVisible(true); return; }
    if (item.variants && item.variants.length > 0) { openPicker(item); } else {
      const existing = cartItems.find((i: any) => i.menuItemId === item.menuItemId);
      if (existing) {
        void updateItemQuantity({ cartItemId: existing.cartItemId, quantity: existing.quantity + 1 }).unwrap().catch((err: any) => handleError(toUnwrappedApiError(err)));
      } else {
        void submitAdd({ menuItemId: item.menuItemId, variantId: null, quantity: 1, notes: null }, parseMoney(item.basePrice));
      }
    }
  };

  const handleDecrement = (item: MenuItem) => {
    if (cartItemsCount > 0 && !isCurrentRestaurantCart) { setToast({ message: 'Your cart contains items from another restaurant.', variant: 'error' }); return; }
    if (item.variants && item.variants.length > 0) { openPicker(item); } else {
      const existing = cartItems.find((i: any) => i.menuItemId === item.menuItemId);
      if (existing) {
        if (existing.quantity > 1) {
          void updateItemQuantity({ cartItemId: existing.cartItemId, quantity: existing.quantity - 1 }).unwrap().catch((err: any) => handleError(toUnwrappedApiError(err)));
        } else {
          void removeCartItem(existing.cartItemId).unwrap().catch((err: any) => handleError(toUnwrappedApiError(err)));
        }
      }
    }
  };

  const isEggItem = (item: MenuItem) => {
    const name = item.name.toLowerCase();
    const desc = (item.description || '').toLowerCase();
    return name.includes('egg') || desc.includes('egg');
  };

  const isRecommendedItem = (item: MenuItem, catName: string) => {
    const desc = (item.description || '').toLowerCase();
    return desc.includes('highly reordered') || catName.toLowerCase().includes('signature');
  };

  if (!validId || !restaurantId) {
    return (
      <EmptyState
        title="Invalid restaurant"
        description="The menu link is not valid."
        accessibilityLabel="Menu screen invalid redirect"
        actionLabel="Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const menuData = isMock ? (MOCK_MENUS[restaurantId]?.categories ?? []) : [];

  const filteredData = useMemo(() => {
    return menuData
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          if (activeFilter === 'veg') return item.isVeg;
          if (activeFilter === 'non-veg') return !item.isVeg;
          if (activeFilter === 'egg') return isEggItem(item);
          if (activeFilter === 'recommended') return isRecommendedItem(item, (category as any).categoryName || (category as any).name || '');
          return true;
        })
      }))
      .filter(category => category.items.length > 0);
  }, [menuData, activeFilter]);

  const sections: MenuSection[] = useMemo(() => {
    return filteredData.map((c) => ({
      title: (c as any).categoryName || (c as any).name || 'Menu',
      categoryId: c.categoryId,
      data: c.items,
    }));
  }, [filteredData]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
        <SectionList
          style={{ flex: 1 }}
          sections={sections}
          keyExtractor={(item) => item.menuItemId}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: tokens.spacing.lg, paddingBottom: 96, paddingTop: 0, gap: tokens.spacing.md }}
          ListHeaderComponent={
            <View style={{ gap: tokens.spacing.md }}>
              <ImageBackground
                source={{ uri: restaurantData?.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000' }}
                style={{ marginHorizontal: -tokens.spacing.lg, marginTop: 0, minHeight: 265, justifyContent: 'flex-end', backgroundColor: '#14532D' }}
                imageStyle={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
              >
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <Feather name="chevron-left" size={24} color="#FCD34D" />
                </Pressable>
                <LinearGradient
                  colors={['transparent', 'rgba(20, 83, 45, 0.95)']}
                  style={{ paddingVertical: tokens.spacing.xl, paddingHorizontal: tokens.spacing.lg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, gap: 8 }}
                >
                  <Text variant="heading1" style={{ color: '#FCD34D', fontWeight: '900', fontSize: 32, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>{restaurantData?.name || 'Restaurant Menu'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, flexWrap: 'wrap', marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCD34D', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 }}>
                      <Text style={{ color: '#134E4A', fontSize: 13, fontWeight: '900' }}>★ {restaurantData?.avgRating?.toFixed(1) || '4.5'}</Text>
                    </View>
                    <Text variant="label" style={{ color: '#FFFFFF', fontWeight: '800' }}>•</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                      <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '800' }}>⏱️ {distanceInfo}</Text>
                    </View>
                    <Text variant="label" style={{ color: '#FFFFFF', fontWeight: '800' }}>•</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                      <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '800' }}>📍 {restaurantData?.city || 'Bengaluru'}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm }}>
                <Pressable onPress={() => setActiveFilter('all')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === 'all' ? '#14532D' : '#E5E7EB', borderWidth: 1, borderColor: activeFilter === 'all' ? '#14532D' : '#D1D5DB' }}>
                  <Text variant="label" style={{ color: activeFilter === 'all' ? '#F59E0B' : '#4B5563', fontWeight: activeFilter === 'all' ? '800' : '600' }}>🍽️ All</Text>
                </Pressable>
                <Pressable onPress={() => setActiveFilter('veg')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === 'veg' ? '#14532D' : '#FFFFFF', borderWidth: 1, borderColor: activeFilter === 'veg' ? '#14532D' : '#D1D5DB' }}>
                  <Text variant="label" style={{ color: activeFilter === 'veg' ? '#F59E0B' : '#059669', fontWeight: activeFilter === 'veg' ? '800' : '600' }}>🟢 Veg Only</Text>
                </Pressable>
                <Pressable onPress={() => setActiveFilter('non-veg')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === 'non-veg' ? '#14532D' : '#FFFFFF', borderWidth: 1, borderColor: activeFilter === 'non-veg' ? '#14532D' : '#D1D5DB' }}>
                  <Text variant="label" style={{ color: activeFilter === 'non-veg' ? '#F59E0B' : '#DC2626', fontWeight: activeFilter === 'non-veg' ? '800' : '600' }}>🔴 Non-Veg</Text>
                </Pressable>
                <Pressable onPress={() => setActiveFilter('egg')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === 'egg' ? '#14532D' : '#FFFFFF', borderWidth: 1, borderColor: activeFilter === 'egg' ? '#14532D' : '#D1D5DB' }}>
                  <Text variant="label" style={{ color: activeFilter === 'egg' ? '#F59E0B' : '#4B5563', fontWeight: activeFilter === 'egg' ? '800' : '600' }}>🍳 Egg Special</Text>
                </Pressable>
                <Pressable onPress={() => setActiveFilter('recommended')} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeFilter === 'recommended' ? '#14532D' : '#FFFFFF', borderWidth: 1, borderColor: activeFilter === 'recommended' ? '#14532D' : '#D1D5DB' }}>
                  <Text variant="label" style={{ color: activeFilter === 'recommended' ? '#F59E0B' : '#4B5563', fontWeight: activeFilter === 'recommended' ? '800' : '600' }}>🔥 Highly Reordered</Text>
                </Pressable>
              </ScrollView>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={{ backgroundColor: tokens.color.background, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.xs, borderBottomWidth: 2, borderBottomColor: '#F59E0B', marginBottom: tokens.spacing.md, alignSelf: 'flex-start' }}>
              <Text variant="heading2" color="#14532D" style={{ fontWeight: '900', letterSpacing: 0.5, fontSize: 20, textTransform: 'uppercase' }}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const rowTotalQty = cartItems.filter((i: any) => i.menuItemId === item.menuItemId).reduce((sum: number, c: any) => sum + c.quantity, 0);
            return (
              <MenuItemRow
                item={item}
                quantity={rowTotalQty}
                onAdd={() => handleAddOrVariant(item)}
                onIncrement={() => handleAddOrVariant(item)}
                onDecrement={() => handleDecrement(item)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: tokens.color.border, marginVertical: tokens.spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              title="No items"
              description="No menu items for this filter."
              accessibilityLabel="Menu filter empty state"
            />
          }
        />
        {cartItemsCount > 0 && Number(cartSubtotal) > 0 ? (
          <GlobalCartBanner />
        ) : null}
      </View>

      <Modal
        visible={!!openItem && !conflictVisible}
        onRequestClose={closePicker}
        title="Customize Item"
        accessibilityLabel="Customize variants modal"
      >
        {openItem ? (
          <View style={{ gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm }}>
            <VariantPicker
              variants={openItem.variants}
              selectedVariantId={variantId}
              onSelect={(vid) => setVariantId(vid)}
              basePrice={openItem.basePrice}
            />

            <TextInput
              label="Extra Instructions"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Extra spicy, no onions"
              accessibilityLabel="Order customization instructions"
              containerStyle={{ marginTop: tokens.spacing.sm }}
            />

            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
              <Button
                label="Cancel"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={closePicker}
                accessibilityLabel="Cancel customizing"
              />
              <Button
                label="Add Option"
                loading={addState.isLoading}
                onPress={onConfirmAdd}
                style={{ flex: 1, backgroundColor: '#14532D' }}
                accessibilityLabel="Add customized option"
              />
            </View>
          </View>
        ) : <View />}
      </Modal>

      <Modal
        visible={conflictVisible}
        onRequestClose={() => setConflictVisible(false)}
        title="Start new cart?"
        accessibilityLabel="Cart restaurant mismatch warning"
      >
        <Text color={tokens.color.textSecondary}>
          Your cart contains items from a different restaurant. Clear the cart to add items from this restaurant?
        </Text>
        <View style={{ flexDirection: 'row', gap: tokens.spacing.md, marginTop: tokens.spacing.xl, paddingBottom: tokens.spacing.md }}>
          <Button
            label="Cancel"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => { setConflictVisible(false); setPendingReadd(null); }}
            accessibilityLabel="Cancel replacement"
          />
          <Button
            label="Clear & Add"
            loading={clearState.isLoading || addState.isLoading}
            onPress={() => void onConfirmClearAndReadd()}
            style={{ flex: 1, backgroundColor: '#14532D' }}
            accessibilityLabel="Confirm replace items"
          />
        </View>
      </Modal>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        onDismiss={() => setToast(null)}
        accessibilityLabel="Menu screen notifications"
      />
    </SafeAreaView>
  );
}
