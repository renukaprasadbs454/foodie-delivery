import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal as RNModal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';

import {
  useCreateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetMenuQuery,
  useUpdateItemAvailabilityMutation,
  useUpdateMenuItemMutation,
  useUploadMenuItemImageMutation,
} from '../../../api/endpoints/menuApi';
import { useGetRestaurantProfileQuery } from '../../../api/endpoints/restaurantsApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectRestaurantId,
  setRestaurantCreated,
} from '../../onboarding/restaurantOnboardingSlice';
import { FoodImage } from '../../../components/FoodImage';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { MenuManageSkeleton } from '../components/MenuManageSkeleton';
import {
  formatMoney,
  normalizeMenuItem,
  parseMoney,
  type FoodType,
  type MenuVariant,
  type NormalizedMenuItem,
} from '../types';
import type { MenuStackParamList } from '../../../navigation/types';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import { MOCK_CATEGORIES } from '../../../mock/menuData';

type Props = NativeStackScreenProps<MenuStackParamList, 'MenuItems'>;

const BRAND_PRIMARY = '#145A32'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Warm Amber / Gold Highlight

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

interface CategoryPill {
  id: string;
  name: string;
  icon: string;
}

const DEFAULT_CATEGORIES: CategoryPill[] = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'biryani', name: 'Biryani', icon: '🍛' },
  { id: 'starters', name: 'Starters', icon: '🥗' },
  { id: 'main_course', name: 'Main Course', icon: '🍲' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
];

const PREPARATION_TIMES = ['10 min', '15 min', '20 min', '30 min', '45 min', '60 min'];

function generateMockUuid(): string {
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${hex()}${hex()}-${hex()}-4${hex().substring(1)}-8${hex().substring(1)}-${hex()}${hex()}${hex()}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();
}

function isItemInCategory(item: NormalizedMenuItem, categoryId: string): boolean {
  if (categoryId === 'all') return true;
  const target = categoryId.toLowerCase();
  const itemCatName = item.categoryName.toLowerCase();
  const itemCatId = item.categoryId.toLowerCase();

  if (target === 'biryani') {
    return itemCatName.includes('biryani') || itemCatId.includes('biryani');
  }
  if (target === 'starters') {
    return (
      itemCatName.includes('starter') ||
      itemCatName.includes('appetizer') ||
      itemCatName.includes('tikka') ||
      itemCatName.includes('kebab') ||
      itemCatId.includes('starter')
    );
  }
  if (target === 'main_course') {
    return (
      itemCatName.includes('main') ||
      itemCatName.includes('curry') ||
      itemCatName.includes('gravy') ||
      itemCatName.includes('bread') ||
      itemCatId.includes('main')
    );
  }
  if (target === 'desserts') {
    return (
      itemCatName.includes('dessert') ||
      itemCatName.includes('sweet') ||
      itemCatName.includes('halwa') ||
      itemCatName.includes('ice') ||
      itemCatId.includes('dessert')
    );
  }
  if (target === 'beverages') {
    return (
      itemCatName.includes('beverage') ||
      itemCatName.includes('drink') ||
      itemCatName.includes('lassi') ||
      itemCatName.includes('chai') ||
      itemCatName.includes('juice') ||
      itemCatId.includes('beverage')
    );
  }

  return itemCatId === target || itemCatName === target || slugify(itemCatName) === target;
}

export function MenuItemsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const storedRestaurantId = useAppSelector(selectRestaurantId);

  const profileQuery = useGetRestaurantProfileQuery(undefined, {
    skip: Boolean(storedRestaurantId),
  });

  useEffect(() => {
    if (profileQuery.data?.restaurantId && !storedRestaurantId) {
      dispatch(
        setRestaurantCreated({
          restaurantId: profileQuery.data.restaurantId,
          status: profileQuery.data.status ?? 'APPROVED',
        }),
      );
    }
  }, [dispatch, profileQuery.data, storedRestaurantId]);

  const restaurantId =
    storedRestaurantId ??
    profileQuery.data?.restaurantId ??
    (MOCK_CONFIG.ENABLE_MOCK_FALLBACK ? MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID : undefined);

  // CATEGORY STATE - STRICT REQUIREMENT: Defaults to 'all' and only changes on user click!
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Local state array for normalized menu items (Single Source of Truth)
  const [menuItems, setMenuItems] = useState<NormalizedMenuItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<NormalizedMenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<NormalizedMenuItem | null>(null);

  // Form Field States
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formFoodType, setFormFoodType] = useState<FoodType>('VEG');
  const [formCategoryId, setFormCategoryId] = useState<string>('main_course');
  const [formCategoryName, setFormCategoryName] = useState<string>('Main Course');
  const [formPrepTime, setFormPrepTime] = useState<string>('15 min');
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formVariants, setFormVariants] = useState<MenuVariant[]>([]);

  // Variant input sub-state
  const [newVariantName, setNewVariantName] = useState<string>('');
  const [newVariantPriceDelta, setNewVariantPriceDelta] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  // API Queries & Mutations
  const menuQuery = useGetMenuQuery(restaurantId ?? '', {
    skip: !restaurantId,
    refetchOnFocus: true,
  });

  const [createItem, createItemState] = useCreateMenuItemMutation();
  const [updateItem, updateItemState] = useUpdateMenuItemMutation();
  const [deleteItem] = useDeleteMenuItemMutation();
  const [updateAvailability] = useUpdateItemAvailabilityMutation();
  const [uploadImage] = useUploadMenuItemImageMutation();

  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected || menuQuery.isError || !menuQuery.data?.categories?.length);

  // Synchronize initial menu items from API or Mock into single source of truth without resetting selectedCategoryId
  useEffect(() => {
    if (isInitialized && menuItems.length > 0) return;

    if (menuQuery.data?.categories && menuQuery.data.categories.length > 0) {
      const itemsList: NormalizedMenuItem[] = [];
      for (const cat of menuQuery.data.categories) {
        for (const item of cat.items) {
          itemsList.push(normalizeMenuItem(item, cat.name, cat.categoryId));
        }
      }
      if (itemsList.length > 0) {
        setMenuItems(itemsList);
        setIsInitialized(true);
        return;
      }
    }

    if (isUsingMock || (!menuQuery.isLoading && menuItems.length === 0)) {
      const mockItems: NormalizedMenuItem[] = [];
      for (const cat of MOCK_CATEGORIES) {
        for (const item of cat.items) {
          mockItems.push(normalizeMenuItem(item, cat.name, cat.categoryId));
        }
      }
      setMenuItems(mockItems);
      setIsInitialized(true);
    }
  }, [menuQuery.data, isUsingMock, menuQuery.isLoading, isInitialized, menuItems.length]);

  useEffect(() => {
    trackAnalyticsEvent('restaurant_menu_management_viewed');
  }, []);

  // Category counts derived directly from menuItems array
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: menuItems.length,
      biryani: 0,
      starters: 0,
      main_course: 0,
      desserts: 0,
      beverages: 0,
    };

    for (const item of menuItems) {
      if (isItemInCategory(item, 'biryani')) counts.biryani++;
      if (isItemInCategory(item, 'starters')) counts.starters++;
      if (isItemInCategory(item, 'main_course')) counts.main_course++;
      if (isItemInCategory(item, 'desserts')) counts.desserts++;
      if (isItemInCategory(item, 'beverages')) counts.beverages++;
    }

    return counts;
  }, [menuItems]);

  // Menu Summary Metrics
  const summaryStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((i) => i.isAvailable).length;
    const outOfStock = total - available;
    const totalRating = menuItems.reduce((acc, i) => acc + (i.rating || 4.5), 0);
    const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '4.5';

    return { total, available, outOfStock, avgRating };
  }, [menuItems]);

  // Derived filtered & sorted items list
  const filteredAndSortedItems = useMemo(() => {
    let result = menuItems.filter((item) => isItemInCategory(item, selectedCategoryId));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q),
      );
    }

    const sorted = [...result];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return sorted;
  }, [menuItems, selectedCategoryId, searchQuery, sortBy]);

  // Image Picker Handler
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setToast({ message: 'Gallery permission required to select dish photo.', variant: 'warning' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.[0]) {
        setFormImageUrl(result.assets[0].uri);
      }
    } catch {
      setToast({ message: 'Unable to select image.', variant: 'error' });
    }
  };

  // Open Modal for Creating Item
  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormFoodType('VEG');
    setFormCategoryId(selectedCategoryId !== 'all' ? selectedCategoryId : 'main_course');
    setFormCategoryName(
      DEFAULT_CATEGORIES.find((c) => c.id === selectedCategoryId)?.name ?? 'Main Course',
    );
    setFormPrepTime('15 min');
    setFormIsAvailable(true);
    setFormImageUrl(null);
    setFormVariants([]);
    setNewVariantName('');
    setNewVariantPriceDelta('');
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open Modal for Editing Item
  const openEditModal = (item: NormalizedMenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(String(item.basePrice));
    setFormFoodType(item.foodType);
    setFormCategoryId(item.categoryId);
    setFormCategoryName(item.categoryName);
    setFormPrepTime(item.preparationTime);
    setFormIsAvailable(item.isAvailable);
    setFormImageUrl(item.imageUrl ?? null);
    setFormVariants(item.variants ? [...item.variants] : []);
    setNewVariantName('');
    setNewVariantPriceDelta('');
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Add Variant Handler
  const handleAddVariant = () => {
    if (!newVariantName.trim()) {
      setFormError('Enter a variant name (e.g. Full, Half, Jumbo).');
      return;
    }
    const delta = Number(newVariantPriceDelta);
    if (!Number.isFinite(delta)) {
      setFormError('Enter a valid price delta for variant.');
      return;
    }
    const newVariant: MenuVariant = {
      variantId: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newVariantName.trim(),
      priceDelta: delta,
    };
    setFormVariants((prev) => [...prev, newVariant]);
    setNewVariantName('');
    setNewVariantPriceDelta('');
    setFormError('');
  };

  // Remove Variant Handler
  const handleRemoveVariant = (variantId: string) => {
    setFormVariants((prev) => prev.filter((v) => v.variantId !== variantId));
  };

  // Save Item (Create or Edit)
  const handleSaveItem = async () => {
    const trimmedName = formName.trim();
    if (trimmedName.length < 2) {
      setFormError('Food name must be at least 2 characters.');
      return;
    }
    const priceNum = Number(formPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price greater than ₹0.');
      return;
    }

    setFormError('');

    const targetCatObj = DEFAULT_CATEGORIES.find((c) => c.id === formCategoryId);
    const catName = targetCatObj ? targetCatObj.name : formCategoryName || 'Main Course';
    const catId = formCategoryId.includes('-')
      ? formCategoryId
      : targetCatObj
      ? targetCatObj.id
      : 'c3333333-3333-4333-8333-333333333333';

    if (editingItem) {
      // EDIT ITEM
      const updated: NormalizedMenuItem = {
        ...editingItem,
        name: trimmedName,
        description: formDescription.trim(),
        basePrice: priceNum,
        foodType: formFoodType,
        isVeg: formFoodType === 'VEG',
        categoryId: catId,
        categoryName: catName,
        preparationTime: formPrepTime,
        isAvailable: formIsAvailable,
        imageUrl: formImageUrl,
        variants: formVariants,
      };

      setMenuItems((prev) =>
        prev.map((item) => (item.menuItemId === editingItem.menuItemId ? updated : item)),
      );
      setIsFormModalOpen(false);
      setToast({ message: `"${updated.name}" updated successfully.`, variant: 'success' });

      // Call API asynchronously if connected
      if (isConnected && !isUsingMock && editingItem.menuItemId.includes('-')) {
        try {
          await updateItem({
            menuItemId: editingItem.menuItemId,
            categoryId: catId,
            name: trimmedName,
            description: formDescription.trim(),
            basePrice: priceNum,
            isVeg: formFoodType === 'VEG',
          }).unwrap();

          if (formImageUrl && !formImageUrl.startsWith('http')) {
            await uploadImage({
              menuItemId: editingItem.menuItemId,
              uri: formImageUrl,
              mimeType: 'image/jpeg',
              fileName: 'dish.jpg',
            }).unwrap();
          }
        } catch {
          // Gracefully fallback
        }
      }
    } else {
      // CREATE ITEM
      const newItemId = generateMockUuid();
      const newItem: NormalizedMenuItem = {
        menuItemId: newItemId,
        name: trimmedName,
        description: formDescription.trim(),
        basePrice: priceNum,
        foodType: formFoodType,
        isVeg: formFoodType === 'VEG',
        categoryId: catId,
        categoryName: catName,
        preparationTime: formPrepTime,
        isAvailable: formIsAvailable,
        imageUrl:
          formImageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        rating: 5.0,
        variants: formVariants,
        createdAt: Date.now(),
      };

      setMenuItems((prev) => [newItem, ...prev]);
      setIsFormModalOpen(false);
      setToast({ message: `"${newItem.name}" added to menu successfully.`, variant: 'success' });

      // Call API asynchronously if connected
      if (isConnected && !isUsingMock) {
        try {
          const res = await createItem({
            categoryId: catId,
            name: trimmedName,
            description: formDescription.trim(),
            basePrice: priceNum,
            isVeg: formFoodType === 'VEG',
          }).unwrap();

          if (res?.menuItemId && formImageUrl && !formImageUrl.startsWith('http')) {
            await uploadImage({
              menuItemId: res.menuItemId,
              uri: formImageUrl,
              mimeType: 'image/jpeg',
              fileName: 'dish.jpg',
            }).unwrap();
          }
        } catch {
          // Gracefully fallback
        }
      }
    }
  };

  // Delete Item Handler
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    const targetItem = deletingItem;

    setMenuItems((prev) => prev.filter((i) => i.menuItemId !== targetItem.menuItemId));
    setDeletingItem(null);
    setToast({ message: `"${targetItem.name}" deleted successfully.`, variant: 'success' });

    if (isConnected && !isUsingMock && targetItem.menuItemId.includes('-')) {
      try {
        await deleteItem(targetItem.menuItemId).unwrap();
      } catch {
        // Fallback handled
      }
    }
  };

  // Toggle Availability Handler
  const handleToggleAvailability = async (item: NormalizedMenuItem) => {
    const updatedStatus = !item.isAvailable;

    setMenuItems((prev) =>
      prev.map((i) => (i.menuItemId === item.menuItemId ? { ...i, isAvailable: updatedStatus } : i)),
    );

    setToast({
      message: `${item.name} set to ${updatedStatus ? 'In Stock' : 'Out of Stock'}.`,
      variant: 'info',
    });

    if (isConnected && !isUsingMock && restaurantId) {
      try {
        await updateAvailability({
          menuItemId: item.menuItemId,
          isAvailable: updatedStatus,
          restaurantId,
        }).unwrap();
      } catch {
        // Fallback handled
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.md,
          paddingTop: tokens.spacing.md,
          paddingBottom: 110,
          gap: tokens.spacing.md,
          maxWidth: isDesktop ? 1200 : undefined,
          alignSelf: isDesktop ? 'center' : undefined,
          width: '100%',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* DEMO MODE INDICATOR */}
        {isUsingMock ? <DemoModeIndicator isMockActive={true} /> : null}

        {/* 1. PAGE HEADER */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: tokens.spacing.sm,
          }}
        >
          <View style={{ gap: 2 }}>
            <Text variant="heading1" style={{ color: BRAND_PRIMARY }} accessibilityRole="header">
              Menu Management
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Manage dishes, prices, photos & availability
            </Text>
          </View>

          <Pressable
            onPress={openAddModal}
            accessibilityRole="button"
            accessibilityLabel="Add new food item"
            style={({ pressed }) => [
              styles.addItemButton,
              pressed && styles.addItemButtonPressed,
            ]}
          >
            <Text variant="label" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              + Add Item
            </Text>
          </Pressable>
        </View>

        {/* 2. HORIZONTAL CATEGORY FILTER BAR */}
        <View style={styles.categoryBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const count = categoryCounts[cat.id] ?? 0;

              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.name} category`}
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.categoryPill,
                    isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                    pressed && styles.categoryPillPressed,
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected ? styles.categoryTextActive : styles.categoryTextInactive,
                    ]}
                  >
                    {cat.name}
                  </Text>

                  <View
                    style={[
                      styles.countBadge,
                      isSelected ? styles.countBadgeActive : styles.countBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        isSelected ? styles.countTextActive : styles.countTextInactive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. MENU SUMMARY SECTION */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderLeftColor: BRAND_PRIMARY }]}>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Total Items
            </Text>
            <Text variant="label" style={{ fontSize: 18, color: BRAND_PRIMARY, fontWeight: 'bold' }}>
              {summaryStats.total}
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderLeftColor: '#16A34A' }]}>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Available
            </Text>
            <Text variant="label" style={{ fontSize: 18, color: '#16A34A', fontWeight: 'bold' }}>
              {summaryStats.available}
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderLeftColor: '#DC2626' }]}>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Out of Stock
            </Text>
            <Text variant="label" style={{ fontSize: 18, color: '#DC2626', fontWeight: 'bold' }}>
              {summaryStats.outOfStock}
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderLeftColor: BRAND_ACCENT }]}>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Avg Rating
            </Text>
            <Text variant="label" style={{ fontSize: 18, color: '#92400E', fontWeight: 'bold' }}>
              {summaryStats.avgRating} ⭐
            </Text>
          </View>
        </View>

        {/* 4. SEARCH AND SORT CONTROLS */}
        <View
          style={{
            flexDirection: isDesktop ? 'row' : 'column',
            gap: tokens.spacing.sm,
            alignItems: isDesktop ? 'center' : 'stretch',
          }}
        >
          <View style={{ flex: 1 }}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search menu items..."
              accessibilityLabel="Search menu items"
            />
          </View>

          {/* Sort Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, alignItems: 'center' }}
          >
            <Text variant="caption" color={tokens.color.textSecondary} style={{ marginRight: 4 }}>
              Sort:
            </Text>

            {(
              [
                { id: 'name', label: 'Name' },
                { id: 'price-asc', label: 'Price: Low-High' },
                { id: 'price-desc', label: 'Price: High-Low' },
                { id: 'rating', label: 'Rating' },
                { id: 'newest', label: 'Newest' },
              ] as { id: SortOption; label: string }[]
            ).map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setSortBy(opt.id)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: sortBy === opt.id ? BRAND_PRIMARY : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: sortBy === opt.id ? BRAND_PRIMARY : '#CBD5E1',
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    color: sortBy === opt.id ? '#FFFFFF' : '#334155',
                    fontWeight: sortBy === opt.id ? 'bold' : 'normal',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 5. MENU ITEM CARDS LIST */}
        {menuQuery.isLoading && !menuItems.length ? (
          <MenuManageSkeleton />
        ) : filteredAndSortedItems.length === 0 ? (
          <EmptyState
            title={
              selectedCategoryId === 'all'
                ? 'No menu items yet'
                : `No ${
                    DEFAULT_CATEGORIES.find((c) => c.id === selectedCategoryId)?.name ?? ''
                  } items yet`
            }
            description={
              selectedCategoryId === 'all'
                ? 'Add your first dish to start building your menu.'
                : 'No dishes have been added to this category yet.'
            }
            actionLabel="+ Add Item"
            onAction={openAddModal}
            accessibilityLabel="Empty menu items list"
          />
        ) : (
          <FlatList
            data={filteredAndSortedItems}
            keyExtractor={(item) => item.menuItemId}
            scrollEnabled={false}
            contentContainerStyle={{ gap: tokens.spacing.md }}
            refreshControl={
              <RefreshControl
                refreshing={menuQuery.isFetching}
                onRefresh={() => {
                  void menuQuery.refetch();
                }}
              />
            }
            renderItem={({ item }) => (
              <Card
                style={{
                  padding: tokens.spacing.md,
                  gap: tokens.spacing.sm,
                  borderRadius: 14,
                  opacity: item.isAvailable ? 1 : 0.7,
                  borderColor: tokens.color.border,
                  borderLeftWidth: 4,
                  borderLeftColor: item.isVeg ? '#16A34A' : '#DC2626',
                }}
              >
                <View
                  style={{
                    flexDirection: isDesktop ? 'row' : 'column',
                    gap: tokens.spacing.md,
                    alignItems: isDesktop ? 'center' : 'flex-start',
                  }}
                >
                  {/* LEFT: Dish Thumbnail & Change Photo */}
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <FoodImage url={item.imageUrl} name={item.name} size={80} />
                    <Pressable
                      onPress={() => openEditModal(item)}
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        backgroundColor: '#FEF3C7',
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Change photo for ${item.name}`}
                    >
                      <Text variant="caption" style={{ color: '#92400E', fontSize: 10, fontWeight: 'bold' }}>
                        📷 Change
                      </Text>
                    </Pressable>
                  </View>

                  {/* CENTER: Dish Details */}
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text variant="label" style={{ fontSize: 17, color: tokens.color.textPrimary, fontWeight: 'bold', flex: 1 }}>
                        {item.name}
                      </Text>

                      {/* Food Type Badge */}
                      <Badge
                        tone={item.foodType === 'VEG' ? 'success' : 'error'}
                        label={item.foodType === 'VEG' ? '🟢 VEG' : '🔴 NON-VEG'}
                        accessibilityLabel={`Food type ${item.foodType}`}
                      />
                    </View>

                    {item.description ? (
                      <Text variant="caption" color={tokens.color.textSecondary} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}

                    {/* Metadata: Category, Rating, Prep Time, Price */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: tokens.spacing.sm,
                        marginTop: 4,
                      }}
                    >
                      <Text variant="label" style={{ color: BRAND_ACCENT, fontSize: 18, fontWeight: 'bold' }}>
                        {formatMoney(item.basePrice)}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 }}>
                        <Text style={{ fontSize: 12 }}>⭐</Text>
                        <Text variant="caption" style={{ fontWeight: 'bold', fontSize: 11 }}>
                          {item.rating}
                        </Text>
                      </View>

                      <Text variant="caption" color={tokens.color.textSecondary} style={{ fontSize: 11 }}>
                        ⏱ {item.preparationTime}
                      </Text>

                      <Text variant="caption" color={tokens.color.textSecondary} style={{ fontSize: 11 }}>
                        • {item.categoryName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* BOTTOM / RIGHT ACTIONS BAR */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: tokens.spacing.xs,
                    paddingTop: tokens.spacing.xs,
                    borderTopWidth: 1,
                    borderTopColor: tokens.color.border,
                  }}
                >
                  {/* Availability Toggle */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={() => void handleToggleAvailability(item)}
                      trackColor={{ false: '#CBD5E1', true: BRAND_PRIMARY }}
                      accessibilityLabel={`Availability for ${item.name}`}
                    />
                    <Text
                      variant="caption"
                      style={{
                        color: item.isAvailable ? BRAND_PRIMARY : tokens.color.textSecondary,
                        fontWeight: 'bold',
                      }}
                    >
                      {item.isAvailable ? '● In Stock' : '○ Out of Stock'}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
                    <Pressable
                      onPress={() => navigation.navigate('Variants', { menuItemId: item.menuItemId })}
                      style={styles.actionButtonOutline}
                      accessibilityRole="button"
                      accessibilityLabel={`Variants for ${item.name}`}
                    >
                      <Text variant="caption" style={{ fontWeight: '600' }}>
                        Variants ({item.variants?.length ?? 0})
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => openEditModal(item)}
                      style={styles.actionButtonEdit}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${item.name}`}
                    >
                      <Text variant="caption" color="#1D4ED8" style={{ fontWeight: 'bold' }}>
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setDeletingItem(item)}
                      style={styles.actionButtonDelete}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${item.name}`}
                    >
                      <Text variant="caption" color="#DC2626" style={{ fontWeight: 'bold' }}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </ScrollView>

      {/* 6. ADD / EDIT ITEM MODAL FORM */}
      <RNModal
        visible={isFormModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFormModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>

              <Pressable
                onPress={() => setIsFormModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close form"
              >
                <Text style={{ fontSize: 20, color: '#64748B' }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: tokens.spacing.md, paddingVertical: tokens.spacing.xs }}>
              {/* Image Selection & Preview */}
              <View style={{ gap: tokens.spacing.xs }}>
                <Text variant="label">Food Image</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md }}>
                  <FoodImage url={formImageUrl} name={formName || 'Dish'} size={70} />

                  <View style={{ gap: 6, flex: 1 }}>
                    <Pressable
                      onPress={() => void handlePickImage()}
                      style={styles.imagePickButton}
                      accessibilityRole="button"
                      accessibilityLabel="Upload image"
                    >
                      <Text variant="caption" style={{ fontWeight: 'bold', color: '#1E293B' }}>
                        {formImageUrl ? '📷 Change Photo' : '📷 Upload Photo'}
                      </Text>
                    </Pressable>

                    {formImageUrl ? (
                      <Pressable
                        onPress={() => setFormImageUrl(null)}
                        accessibilityRole="button"
                        accessibilityLabel="Remove photo"
                      >
                        <Text variant="caption" color="#DC2626">
                          Remove Photo
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Food Name * */}
              <TextInput
                label="Food Name *"
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Chicken Dum Biryani"
                accessibilityLabel="Food Name"
              />

              {/* Description */}
              <TextInput
                label="Description"
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Brief description of ingredients, spices, or serving"
                multiline
                accessibilityLabel="Food Description"
              />

              {/* Food Type Selector * */}
              <View style={{ gap: tokens.spacing.xs }}>
                <Text variant="label">Food Type *</Text>
                <View style={{ flexDirection: 'row', gap: tokens.spacing.xs }}>
                  {(
                    [
                      { id: 'VEG', label: '🟢 Veg' },
                      { id: 'NON_VEG', label: '🔴 Non-Veg' },
                    ] as { id: FoodType; label: string }[]
                  ).map((typeObj) => {
                    const isSelected = formFoodType === typeObj.id;
                    return (
                      <Pressable
                        key={typeObj.id}
                        onPress={() => setFormFoodType(typeObj.id)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          alignItems: 'center',
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isSelected ? BRAND_PRIMARY : '#CBD5E1',
                          backgroundColor: isSelected ? BRAND_PRIMARY : '#F8FAFC',
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{
                            color: isSelected ? '#FFFFFF' : '#334155',
                            fontWeight: 'bold',
                          }}
                        >
                          {typeObj.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Category Selector * */}
              <View style={{ gap: tokens.spacing.xs }}>
                <Text variant="label">Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {DEFAULT_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const isSelected = formCategoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          setFormCategoryId(cat.id);
                          setFormCategoryName(cat.name);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isSelected ? BRAND_PRIMARY : '#CBD5E1',
                          backgroundColor: isSelected ? BRAND_PRIMARY : '#F8FAFC',
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{
                            color: isSelected ? '#FFFFFF' : '#334155',
                            fontWeight: isSelected ? 'bold' : 'normal',
                          }}
                        >
                          {cat.icon} {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Base Price (₹) * */}
              <TextInput
                label="Base Price (₹) *"
                value={formPrice}
                onChangeText={setFormPrice}
                placeholder="e.g. 299"
                keyboardType="decimal-pad"
                accessibilityLabel="Base Price"
              />

              {/* Preparation Time */}
              <View style={{ gap: tokens.spacing.xs }}>
                <Text variant="label">Preparation Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {PREPARATION_TIMES.map((time) => {
                    const isSelected = formPrepTime === time;
                    return (
                      <Pressable
                        key={time}
                        onPress={() => setFormPrepTime(time)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? BRAND_PRIMARY : '#CBD5E1',
                          backgroundColor: isSelected ? '#DCFCE7' : '#F8FAFC',
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{
                            color: isSelected ? BRAND_PRIMARY : '#334155',
                            fontWeight: isSelected ? 'bold' : 'normal',
                          }}
                        >
                          ⏱ {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Availability Switch */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="label">Availability Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Switch
                    value={formIsAvailable}
                    onValueChange={setFormIsAvailable}
                    trackColor={{ false: '#CBD5E1', true: BRAND_PRIMARY }}
                    accessibilityLabel="Form availability switch"
                  />
                  <Text variant="caption" style={{ fontWeight: 'bold' }}>
                    {formIsAvailable ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
              </View>

              {/* Variants Builder */}
              <View style={{ gap: tokens.spacing.xs, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: tokens.spacing.sm }}>
                <Text variant="label">Variants (Optional)</Text>

                {formVariants.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    {formVariants.map((v) => (
                      <View
                        key={v.variantId}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#F1F5F9',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text variant="caption" style={{ fontWeight: 'bold' }}>
                          {v.name}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text variant="caption" style={{ color: BRAND_ACCENT, fontWeight: 'bold' }}>
                            +{formatMoney(v.priceDelta)}
                          </Text>

                          <Pressable
                            onPress={() => handleRemoveVariant(v.variantId)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove variant ${v.name}`}
                          >
                            <Text variant="caption" color="#DC2626" style={{ fontWeight: 'bold' }}>
                              ✕
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      value={newVariantName}
                      onChangeText={setNewVariantName}
                      placeholder="Variant (e.g. Large)"
                      accessibilityLabel="Variant name"
                    />
                  </View>

                  <View style={{ flex: 1.5 }}>
                    <TextInput
                      value={newVariantPriceDelta}
                      onChangeText={setNewVariantPriceDelta}
                      placeholder="+₹ Delta"
                      keyboardType="decimal-pad"
                      accessibilityLabel="Variant price delta"
                    />
                  </View>

                  <Button
                    label="+ Add"
                    accessibilityLabel="Add variant"
                    style={{ backgroundColor: BRAND_PRIMARY, justifyContent: 'center' }}
                    onPress={handleAddVariant}
                  />
                </View>
              </View>

              {/* Inline Form Error */}
              {formError ? (
                <Text variant="caption" color="#DC2626" style={{ fontWeight: 'bold' }}>
                  ⚠️ {formError}
                </Text>
              ) : null}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, marginTop: tokens.spacing.xs }}>
              <Button
                label="Cancel"
                accessibilityLabel="Cancel form"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => setIsFormModalOpen(false)}
              />
              <Button
                label={editingItem ? 'Save Changes' : 'Save Item'}
                accessibilityLabel="Save dish"
                loading={createItemState.isLoading || updateItemState.isLoading}
                style={{ flex: 1, backgroundColor: BRAND_PRIMARY }}
                onPress={() => void handleSaveItem()}
              />
            </View>
          </Card>
        </View>
      </RNModal>

      {/* 7. DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        visible={Boolean(deletingItem)}
        title={`Delete ${deletingItem?.name ?? 'Menu Item'}?`}
        message={`Are you sure you want to remove "${deletingItem?.name}" from your menu?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeletingItem(null)}
      />

      {/* TOAST FEEDBACK */}
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast notification'}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addItemButton: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
  },
  addItemButtonPressed: {
    opacity: 0.85,
  },
  categoryBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    height: 40,
  },
  categoryPillActive: {
    backgroundColor: BRAND_PRIMARY,
  },
  categoryPillInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillPressed: {
    opacity: 0.85,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoryTextInactive: {
    color: '#334155',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  countTextInactive: {
    color: '#475569',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    gap: 2,
  },
  actionButtonOutline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  actionButtonEdit: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionButtonDelete: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    padding: 20,
    gap: 12,
    maxHeight: '92%',
    borderRadius: 16,
  },
  imagePickButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
});
