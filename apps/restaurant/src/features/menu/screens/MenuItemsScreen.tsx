import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Switch,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Button,
  EmptyState,
  IMAGE_ALLOWED_MIME_TYPES,
  isImageWithinSizeLimit,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useCreateMenuItemMutation,
  useGetMenuQuery,
  useUpdateItemAvailabilityMutation,
  useUploadMenuItemImageMutation,
} from '../../../api/endpoints/menuApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { toUnwrappedApiError } from '../../auth/apiError';
import { MenuManageSkeleton } from '../components/MenuManageSkeleton';
import {
  formatMoney,
  sortCategories,
  validateMenuItemForm,
  type MenuItem,
} from '../types';
import type { MenuStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MenuStackParamList, 'MenuItems'>;

/**
 * P2-RES-03 Menu Items — create, availability (optimistic), image upload.
 * Edit/delete item = GAP-API-06.
 */
export function MenuItemsScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const initialCategoryId = route.params?.categoryId ?? '';

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const menuQuery = useGetMenuQuery(restaurantId ?? '', {
    skip: !restaurantId,
    refetchOnFocus: true,
  });
  const [createItem, createState] = useCreateMenuItemMutation();
  const [updateAvailability] = useUpdateItemAvailabilityMutation();
  const [uploadImage, uploadState] = useUploadMenuItemImageMutation();

  const categories = useMemo(
    () => sortCategories(menuQuery.data?.categories ?? []),
    [menuQuery.data?.categories],
  );

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].categoryId);
    }
  }, [categories, categoryId]);

  const items: MenuItem[] = useMemo(() => {
    const cat = categories.find((c) => c.categoryId === categoryId);
    return cat?.items ?? [];
  }, [categories, categoryId]);

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
    trackAnalyticsEvent('restaurant_menu_items_viewed');
  }, []);

  const onCreate = async () => {
    const validated = validateMenuItemForm({
      categoryId,
      name,
      description,
      basePrice,
      isVeg,
    });
    if (!validated.ok) {
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to create a menu item.',
        variant: 'warning',
      });
      return;
    }
    try {
      await createItem(validated.value).unwrap();
      trackAnalyticsEvent('item_created');
      trackAnalyticsEvent('menu_item_created');
      setName('');
      setDescription('');
      setBasePrice('');
      setToast({ message: 'Item created.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onToggleAvailability = async (item: MenuItem) => {
    if (!restaurantId) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to change availability.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('availability_toggled', {
      menuItemId: item.menuItemId,
    });
    try {
      await updateAvailability({
        menuItemId: item.menuItemId,
        isAvailable: !item.isAvailable,
        restaurantId,
      }).unwrap();
      trackAnalyticsEvent('menu_availability_changed', {
        menuItemId: item.menuItemId,
      });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onUploadImage = async (menuItemId: string) => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to upload an image.',
        variant: 'warning',
      });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setToast({
        message: 'Gallery permission denied.',
        variant: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!(IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      setToast({
        message: 'Use a JPEG, PNG, or WebP image.',
        variant: 'error',
      });
      return;
    }
    if (
      typeof asset.fileSize === 'number' &&
      !isImageWithinSizeLimit(asset.fileSize)
    ) {
      setToast({
        message: 'Image must be 5 MB or smaller.',
        variant: 'error',
      });
      return;
    }
    try {
      await uploadImage({
        menuItemId,
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? 'menu-item.jpg',
      }).unwrap();
      trackAnalyticsEvent('image_uploaded', { menuItemId });
      setToast({
        message: 'Image uploaded. Refreshing menu for URL.',
        variant: 'success',
      });
      void menuQuery.refetch();
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
        gap: tokens.spacing.sm,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Menu items
      </Text>
      <Text variant="caption" color={tokens.color.textSecondary}>
        Edit/delete item is not available (API Gap). Availability and image are
        supported.
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: tokens.spacing.xs,
        }}
      >
        {categories.map((cat) => {
          const selected = cat.categoryId === categoryId;
          return (
            <Pressable
              key={cat.categoryId}
              onPress={() => setCategoryId(cat.categoryId)}
              accessibilityRole="button"
              accessibilityLabel={`Category ${cat.name}`}
              style={{
                paddingHorizontal: tokens.spacing.sm,
                paddingVertical: tokens.spacing.xs,
                borderRadius: tokens.radius.sm,
                borderWidth: 1,
                borderColor: tokens.color.border,
                backgroundColor: selected
                  ? tokens.color.accent
                  : tokens.color.surface,
              }}
            >
              <Text
                variant="caption"
                color={
                  selected
                    ? tokens.color.textInverse
                    : tokens.color.textPrimary
                }
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Item name"
      />
      <TextInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        accessibilityLabel="Item description"
      />
      <TextInput
        label="Base price"
        value={basePrice}
        onChangeText={setBasePrice}
        accessibilityLabel="Base price"
        keyboardType="decimal-pad"
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text variant="label">Vegetarian</Text>
        <Switch
          value={isVeg}
          onValueChange={setIsVeg}
          accessibilityLabel="Vegetarian"
        />
      </View>
      <Button
        label="Create item"
        accessibilityLabel="Create item"
        loading={createState.isLoading}
        onPress={() => {
          void onCreate();
        }}
      />

      {menuQuery.isLoading && !menuQuery.data ? (
        <MenuManageSkeleton />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(item) => item.menuItemId}
          contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
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
              title="No items in this category"
              description="Create an item or pick another category."
              accessibilityLabel="Menu items empty"
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
                gap: tokens.spacing.sm,
                opacity: item.isAvailable ? 1 : 0.7,
              }}
            >
              <Text variant="label">{item.name}</Text>
              <Text variant="body" color={tokens.color.textSecondary}>
                {formatMoney(item.basePrice)} ·{' '}
                {item.isVeg ? 'Veg' : 'Non-veg'} · {item.variants.length}{' '}
                variants
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="label">Available</Text>
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => {
                    void onToggleAvailability(item);
                  }}
                  accessibilityLabel={`Availability for ${item.name}`}
                />
              </View>
              <Button
                label="Upload image"
                accessibilityLabel={`Upload image for ${item.name}`}
                variant="secondary"
                loading={uploadState.isLoading}
                onPress={() => {
                  void onUploadImage(item.menuItemId);
                }}
              />
              <Button
                label="Manage variants"
                accessibilityLabel={`Manage variants for ${item.name}`}
                variant="secondary"
                onPress={() =>
                  navigation.navigate('Variants', {
                    menuItemId: item.menuItemId,
                  })
                }
              />
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
