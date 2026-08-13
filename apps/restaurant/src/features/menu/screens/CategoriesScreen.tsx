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
  Card,
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

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

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
          title="Restaurant ID Unavailable"
          description="Menu requires a stored restaurant id."
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
      <View style={{ gap: 4 }}>
        <Text variant="heading1" style={{ color: BRAND_PRIMARY }} accessibilityRole="header">
          Menu Categories
        </Text>
        <Text variant="caption" color={tokens.color.textSecondary}>
          Organize your dishes into Biryani, Starters, Main Course, etc.
        </Text>
      </View>

      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached menu; create blocked.
        </Text>
      ) : null}

      <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: 14 }}>
        <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 16 }}>
          Add New Category
        </Text>
        <TextInput
          label="Category Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Biryani, Starters, Beverages"
          accessibilityLabel="Category name"
        />
        <TextInput
          label="Display Order (Priority)"
          value={displayOrder}
          onChangeText={setDisplayOrder}
          accessibilityLabel="Display order"
          keyboardType="number-pad"
        />
        <Button
          label="+ Create Category"
          accessibilityLabel="Create category"
          loading={createState.isLoading}
          style={{ backgroundColor: BRAND_PRIMARY }}
          onPress={() => {
            void onCreate();
          }}
        />
      </Card>

      {menuQuery.isLoading && !menuQuery.data ? (
        <CategoryListSkeleton />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={categories}
          keyExtractor={(item) => item.categoryId}
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
              title="No Categories Yet"
              description="Create your first category above (e.g. Biryani, Starters)."
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
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.color.border,
                borderLeftWidth: 4,
                borderLeftColor: BRAND_PRIMARY,
                backgroundColor: tokens.color.surface,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ gap: 2 }}>
                <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 16, fontWeight: 'bold' }}>
                  {item.name}
                </Text>
                <Text variant="caption" color={tokens.color.textSecondary}>
                  Display Priority: {item.displayOrder}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: BRAND_ACCENT,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text variant="caption" style={{ color: '#000000', fontWeight: 'bold' }}>
                  {item.items.length} items
                </Text>
              </View>
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

