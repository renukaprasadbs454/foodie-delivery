import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useAddVariantMutation,
  useGetMenuQuery,
} from '../../../api/endpoints/menuApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { toUnwrappedApiError } from '../../auth/apiError';
import { VariantListSkeleton } from '../components/VariantListSkeleton';
import {
  findMenuItem,
  formatMoney,
  isUuid,
  validateVariantForm,
} from '../types';
import type { MenuStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MenuStackParamList, 'Variants'>;

/**
 * P2-RES-03 Variants — add only. Update/delete = GAP-API-07.
 */
export function VariantsScreen({ route }: Props) {
  const { menuItemId } = route.params;
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const [name, setName] = useState('');
  const [priceDelta, setPriceDelta] = useState('0');
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const menuQuery = useGetMenuQuery(restaurantId ?? '', {
    skip: !restaurantId,
    refetchOnFocus: true,
  });
  const [addVariant, addState] = useAddVariantMutation();

  const found = useMemo(
    () => findMenuItem(menuQuery.data, menuItemId),
    [menuQuery.data, menuItemId],
  );

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
    trackAnalyticsEvent('restaurant_variants_viewed', { menuItemId });
  }, [menuItemId]);

  const onAdd = async () => {
    if (!found) {
      setToast({ message: 'Menu item not found.', variant: 'error' });
      return;
    }
    const validated = validateVariantForm({
      name,
      priceDelta,
      basePrice: found.item.basePrice,
    });
    if (!validated.ok) {
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to add a variant.',
        variant: 'warning',
      });
      return;
    }
    try {
      await addVariant({
        menuItemId,
        ...validated.value,
      }).unwrap();
      trackAnalyticsEvent('variant_added', { menuItemId });
      trackAnalyticsEvent('menu_variant_created', { menuItemId });
      setName('');
      setPriceDelta('0');
      setToast({ message: 'Variant added.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  if (!restaurantId) {
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
          title="Restaurant id unavailable"
          description="Menu requires a stored restaurant id (GAP-API-03)."
          accessibilityLabel="Restaurant id gap"
        />
      </View>
    );
  }

  if (!isUuid(menuItemId)) {
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
          title="Invalid menu item"
          description="menuItemId must be a valid UUID."
          accessibilityLabel="Invalid menu item id"
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.md,
        gap: tokens.spacing.md,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text variant="heading1" style={{ color: '#14532D' }} accessibilityRole="header">
          Dish Variants
        </Text>
        {found ? (
          <Text variant="body" color={tokens.color.textSecondary}>
            {found.item.name} · Base Price {formatMoney(found.item.basePrice)}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: tokens.spacing.sm }}>
        <TextInput
          label="Variant name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Half Portion, Large Size"
          accessibilityLabel="Variant name"
        />
        <TextInput
          label="Price delta (₹)"
          value={priceDelta}
          onChangeText={setPriceDelta}
          accessibilityLabel="Price delta"
          keyboardType="decimal-pad"
        />
        <Button
          label="+ Add Variant"
          accessibilityLabel="Add variant"
          loading={addState.isLoading}
          style={{ backgroundColor: '#14532D' }}
          onPress={() => {
            void onAdd();
          }}
        />
      </View>

      {menuQuery.isLoading && !menuQuery.data ? (
        <VariantListSkeleton />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={found?.item.variants ?? []}
          keyExtractor={(item) => item.variantId}
          contentContainerStyle={{ gap: tokens.spacing.sm, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={menuQuery.isFetching}
              onRefresh={() => {
                void menuQuery.refetch();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No variants yet"
              description="Optional sizes or options can be added here."
              accessibilityLabel="Variants empty"
            />
          }
          renderItem={({ item }) => (
            <View
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: tokens.color.border,
                backgroundColor: tokens.color.surface,
              }}
            >
              <Text variant="label">{item.name}</Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                Delta {formatMoney(item.priceDelta)}
              </Text>
            </View>
          )}
        />
      )}
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
