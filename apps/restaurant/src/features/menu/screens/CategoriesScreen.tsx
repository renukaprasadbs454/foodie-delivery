import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
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
  useCreateCategoryMutation,
  useGetMenuQuery,
} from '../../../api/endpoints/menuApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { toUnwrappedApiError } from '../../auth/apiError';
import { CategoryListSkeleton } from '../components/CategoryListSkeleton';
import { sortCategories, validateCategoryName } from '../types';
import type { MenuStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MenuStackParamList, 'Categories'>;

/**
 * P2-RES-03 Categories — create + list via full menu.
 * Update/delete = GAP-API-05 (not invented).
 */
export function CategoriesScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const menuQuery = useGetMenuQuery(restaurantId ?? '', {
    skip: !restaurantId,
    refetchOnFocus: true,
  });
  const [createCategory, createState] = useCreateCategoryMutation();

  const categories = useMemo(
    () => sortCategories(menuQuery.data?.categories ?? []),
    [menuQuery.data?.categories],
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
    trackAnalyticsEvent('restaurant_categories_viewed');
  }, []);

  const onCreate = async () => {
    const validated = validateCategoryName(name);
    if (!validated.ok) {
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to create a category.',
        variant: 'warning',
      });
      return;
    }
    const order = Number.parseInt(displayOrder, 10);
    try {
      await createCategory({
        name: validated.name,
        displayOrder: Number.isFinite(order) ? order : 0,
      }).unwrap();
      trackAnalyticsEvent('category_created');
      trackAnalyticsEvent('menu_category_created');
      setName('');
      setToast({ message: 'Category created.', variant: 'success' });
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.md,
        gap: tokens.spacing.md,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Categories
      </Text>
      <Text variant="caption" color={tokens.color.textSecondary}>
        Update/delete category is not available (API Gap).
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached menu; create blocked.
        </Text>
      ) : null}

      <TextInput
        label="Category name"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Category name"
      />
      <TextInput
        label="Display order"
        value={displayOrder}
        onChangeText={setDisplayOrder}
        accessibilityLabel="Display order"
        keyboardType="number-pad"
      />
      <Button
        label="Create category"
        accessibilityLabel="Create category"
        loading={createState.isLoading}
        onPress={() => {
          void onCreate();
        }}
      />

      {menuQuery.isLoading && !menuQuery.data ? (
        <CategoryListSkeleton />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={categories}
          keyExtractor={(item) => item.categoryId}
          contentContainerStyle={{ gap: tokens.spacing.sm, paddingBottom: 48 }}
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
              title="No categories yet"
              description="Create your first category to start building the menu."
              accessibilityLabel="Categories empty"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('MenuItems', {
                  categoryId: item.categoryId,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Category ${item.name}`}
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: tokens.color.border,
                backgroundColor: tokens.color.surface,
                gap: tokens.spacing.xs,
              }}
            >
              <Text variant="label">{item.name}</Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                Order {item.displayOrder} · {item.items.length} items
              </Text>
            </Pressable>
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
