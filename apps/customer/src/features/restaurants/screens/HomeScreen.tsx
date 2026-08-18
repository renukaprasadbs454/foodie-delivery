import React, { useEffect, useState, useRef } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
  Image,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BrowseStackParamList } from '../../../navigation/types';
import { RestaurantCard } from '../components/RestaurantCard';
import { RestaurantListSkeleton } from '../components/RestaurantListSkeleton';
import { useRestaurantFeed } from '../hooks/useRestaurantFeed';
import type { RestaurantSort } from '../types';
import { RESTAURANT_SORT_WHITELIST } from '../types';
import { useGetCartQuery } from '../../../api/endpoints/cartApi';
import { CATEGORY_ITEMS } from '../mockData';
import { GlobalCartBanner } from '../../cart/components/GlobalCartBanner';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Home'>;

/**
 * P2-CUS-01 Home — location-optional APPROVED restaurant feed (UI-API Home).
 * No COD UI. Geo bias omitted until a location module is approved (feed without lat/lng).
 */
export function HomeScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const [cuisineType, setCuisineType] = useState<string | undefined>();
  const [sort, setSort] = useState<RestaurantSort>('avgRating');
  const [cuisineDraft, setCuisineDraft] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const feed = useRestaurantFeed({
    cuisineType,
    sort,
    userLatitude: userCoords?.latitude,
    userLongitude: userCoords?.longitude,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    trackAnalyticsEvent('customer_home_viewed');
  }, []);

  useEffect(() => {
    if (feed.items.length > 0) {
      trackAnalyticsEvent('restaurant_feed_loaded', {
        count: feed.items.length,
      });
    }
  }, [feed.items.length]);

  const [currentAddress, setCurrentAddress] = useState('Fetching location...');

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentAddress('Location Permission Denied');
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setUserCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          setCurrentAddress(`${addr.name ? addr.name + ', ' : ''}${addr.city || addr.subregion || addr.region}`);
        } else {
          setCurrentAddress('Unknown Location');
        }
      } catch (err) {
        setCurrentAddress('Unable to fetch location');
      }
    })();
  }, []);

  const applyCuisine = () => {
    const next = cuisineDraft.trim() || undefined;
    setCuisineType(next);
    trackAnalyticsEvent('filter_applied', { cuisineType: next ?? 'all' });
  };

  const cartQuery = useGetCartQuery();
  const cartItemsCount = cartQuery?.data?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0;


  const renderHeader = () => (
    <View style={{ gap: tokens.spacing.lg, paddingBottom: tokens.spacing.sm }}>
      {/* Curved iOS Premium Dark Header */}
      <View style={{
        backgroundColor: '#14532D', // Re-applied brand dark green
        marginHorizontal: 0,
        marginTop: 0,
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: 12,
        paddingBottom: tokens.spacing.md,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
      }}>
        {/* Top Row: Brand & Cart */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#FCD34D', fontWeight: '900', letterSpacing: -0.5, fontSize: 34 }}>
            Foodie
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Help Button */}
            <Pressable
              onPress={() => {
                setToast({
                  message: 'Help Center: Reach us at support@foodie.com or call +91 9686753394.',
                  variant: 'info'
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Get support help"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? '#1B6A3A' : 'rgba(255, 255, 255, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.25)',
              })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>❓ Help</Text>
            </Pressable>

            {/* Cart Button */}
            <Pressable
              onPress={() => navigation.navigate('Cart')}
              accessibilityRole="button"
              accessibilityLabel={`Open Cart, ${cartItemsCount} items`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? '#1B6A3A' : 'rgba(255, 255, 255, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.25)',
              })}
            >
              <Text style={{ marginRight: 6, fontSize: 18 }}>🛒</Text>
              {cartItemsCount > 0 ? (
                <View style={{
                  backgroundColor: '#FCD34D',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}>
                  <Text style={{ color: '#14532D', fontWeight: '800', fontSize: 13 }}>
                    {cartItemsCount}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Empty</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Second Row: Location Button (Subtle) */}
        <Pressable
          onPress={() => navigation.navigate('Addresses', {})}
          accessibilityRole="button"
          accessibilityLabel="Change delivery address"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '800', letterSpacing: 0.5 }}>DELIVERING TO  </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
            {currentAddress.length > 28 ? currentAddress.substring(0, 28) + '...' : currentAddress}
          </Text>
          <Text style={{ color: '#FCD34D', fontSize: 16, marginLeft: 6, fontWeight: '900' }}>›</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: tokens.spacing.md, gap: tokens.spacing.lg }}>

        {/* Styled Search Button */}
        <Pressable
          onPressIn={() => navigation.navigate('Search')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: pressed ? '#F3ECE0' : '#FFFFFF',
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.lg,
            borderWidth: 1,
            borderColor: tokens.color.border,
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            marginTop: -tokens.spacing.xs,
          })}
        >
          <Text style={{ marginRight: tokens.spacing.sm, fontSize: 16 }}>🔍</Text>
          <Text variant="bodySmall" color={tokens.color.textSecondary} style={{ flex: 1, fontWeight: '500' }}>
            Search dishes, cuisines, restaurants...
          </Text>
        </Pressable>

        {/* Scrollable Visual Categories */}
        <View style={{ gap: tokens.spacing.sm }}>
          <Text variant="heading2" style={{ fontWeight: '800', color: tokens.color.textPrimary }}>
            What's on your mind?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: tokens.spacing.xs,
              gap: tokens.spacing.md,
            }}
          >
            {CATEGORY_ITEMS.map((cat) => {
              const active = cuisineType === cat.cuisine;
              return (
                <Pressable
                  key={cat.name}
                  onPress={() => {
                    setCuisineType(cat.cuisine);
                    trackAnalyticsEvent('category_tapped', { category: cat.name });
                  }}
                  style={{
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: active ? '#FEF3C7' : '#F3F4F6', // active: gold background
                    borderWidth: 2,
                    borderColor: active ? '#FCD34D' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    shadowColor: '#14532D',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: active ? 0.3 : 0.1,
                    shadowRadius: 6,
                    elevation: active ? 4 : 2,
                  }}>
                    {/* Real Image replacement for cartoony emojis */}
                    {(cat as any).image ? (
                      <Image source={{ uri: (cat as any).image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 32 }}>{(cat as any).icon}</Text>
                    )}
                  </View>
                  <Text variant="caption" style={{
                    color: active ? '#14532D' : tokens.color.textPrimary,
                    fontWeight: active ? '800' : '600',
                    fontSize: 12,
                  }}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Top Restaurants Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: tokens.spacing.xs,
        }}>
          <View>
            <Text variant="heading2" style={{ fontWeight: '800', color: tokens.color.textPrimary }}>
              Top Restaurants
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Chef-crafted meals curated for you
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('RestaurantListing', { sort: 'avgRating' })}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text variant="label" color={tokens.color.accentMuted} style={{ fontWeight: '700' }}>
              View All →
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: tokens.spacing.md,
            gap: tokens.spacing.sm,
          }}
          style={{ marginHorizontal: -tokens.spacing.md }}
        >
          {RESTAURANT_SORT_WHITELIST.map((option) => {
            const active = sort === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setSort(option);
                  trackAnalyticsEvent('filter_applied', { sort: option });
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: tokens.spacing.lg,
                  paddingVertical: tokens.spacing.sm,
                  borderRadius: tokens.radius.full,
                  backgroundColor: active ? tokens.color.accent : tokens.color.surface,
                  borderWidth: 1,
                  borderColor: active ? tokens.color.accent : tokens.color.border,
                  elevation: active ? 3 : 0,
                  shadowColor: '#14532D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: active ? 0.2 : 0,
                  shadowRadius: 4,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text variant="caption" style={{
                  color: active ? '#FFFFFF' : tokens.color.textPrimary,
                  fontWeight: active ? '700' : '500',
                }}>
                  {option === 'createdAt' ? '🆕 New Arrivals' : option === 'avgRating' ? '★ Top Rated' : '📍 Nearby Restaurants'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!isConnected && (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached results.
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <Animated.View style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        paddingHorizontal: 0,
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        }],
      }}>
        {feed.isLoading ? (
          <RestaurantListSkeleton />
        ) : (
          <FlatList
            data={feed.items}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ paddingHorizontal: tokens.spacing.md - 4 }}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: tokens.spacing.xl, paddingTop: 0, gap: tokens.spacing.md }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={feed.isFetching && feed.items.length > 0}
                onRefresh={() => {
                  void feed.refetch();
                }}
                tintColor={tokens.color.accent}
              />
            }
            onEndReached={() => {
              feed.onLoadMore();
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              feed.isError ? (
                <EmptyState
                  title="Could not load restaurants"
                  description="Pull to retry. Check your connection."
                  accessibilityLabel="Restaurant feed error"
                />
              ) : (
                <EmptyState
                  title="No restaurants found"
                  description="Broaden filters or try search."
                  accessibilityLabel="Restaurant feed empty"
                />
              )
            }
            renderItem={({ item }) => (
              <RestaurantCard
                restaurant={item}
                columnMode={true}
                onPress={() => {
                  trackAnalyticsEvent('restaurant_card_tapped', {
                    restaurantId: item.id,
                  });
                  navigation.navigate('Menu', {
                    restaurantId: item.id,
                  });
                }}
              />
            )}
          />
        )}
        <GlobalCartBanner />
        <Toast
          visible={Boolean(toast)}
          message={toast?.message ?? ''}
          variant={toast?.variant ?? 'info'}
          accessibilityLabel={toast?.message ?? 'Toast'}
          onDismiss={() => setToast(null)}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
