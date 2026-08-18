import React, { useEffect, useState, useRef } from 'react';
import { FlatList, View, StatusBar, Animated, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  TextInput,
  trackAnalyticsEvent,
  useDebouncedValue,
  useTheme,
} from 'foodie-shared-rn';
import type { BrowseStackParamList } from '../../../navigation/types';
import { RestaurantCard } from '../components/RestaurantCard';
import { RestaurantListSkeleton } from '../components/RestaurantListSkeleton';
import { useRestaurantFeed } from '../hooks/useRestaurantFeed';
import { GlobalCartBanner } from '../../cart/components/GlobalCartBanner';

const ALL_FOODS_SUGGESTIONS = [
  { name: 'Biriyani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&q=80' },
  { name: 'Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=120&q=80' },
  { name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&q=80' },
  { name: 'Chicken', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=120&q=80' },
  { name: 'North Indian', image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=120&q=80' },
  { name: 'South Indian', image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=120&q=80' },
  { name: 'Rice', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&q=80' },
  { name: 'Sweets', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=120&q=80' },
];

type Props = NativeStackScreenProps<BrowseStackParamList, 'Search'>;

export function SearchScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const debounced = useDebouncedValue(query.trim(), 350);
  const feed = useRestaurantFeed({
    search: debounced.length > 0 ? debounced : undefined,
    sort: 'avgRating',
  });

  const matchingFoods = query.trim().length > 0
    ? ALL_FOODS_SUGGESTIONS.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : ALL_FOODS_SUGGESTIONS;

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackAnalyticsEvent('customer_search_viewed');
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

  useEffect(() => {
    if (debounced.length > 0) {
      trackAnalyticsEvent('restaurant_search_performed', {
        queryLength: debounced.length,
      });
    }
  }, [debounced]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          opacity: fadeValue,
          transform: [{ scale: scaleValue }],
        }}
      >
        {/* Curved Header */}
        <View style={{
          paddingTop: 36,
          paddingBottom: 24,
          paddingHorizontal: 20,
          backgroundColor: '#14532D',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          shadowColor: '#14532D',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
          gap: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#FCD34D', letterSpacing: -0.5 }}>
              Search
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Home')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Cancel</Text>
            </Pressable>
          </View>

          <TextInput
            label=""
            accessibilityLabel="Search restaurants"
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            placeholder="Search restaurants by name..."
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() =>
              trackAnalyticsEvent('search_submitted', {
                queryLength: query.trim().length,
              })
            }
            containerStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              height: 48,
              borderWidth: 1.5,
              borderColor: '#FCD34D',
            }}
          />
        </View>

        <View style={{ flex: 1, paddingHorizontal: tokens.spacing.md, paddingTop: 16 }}>
          {feed.isLoading ? (
            <RestaurantListSkeleton />
          ) : (
            <FlatList
              data={feed.items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
              onEndReached={() => feed.onLoadMore()}
              onEndReachedThreshold={0.4}
              ListHeaderComponent={
                <View style={{ marginBottom: tokens.spacing.md }}>
                  {debounced.length === 0 ? (
                    <View style={{ marginBottom: tokens.spacing.sm }}>
                      <Text variant="heading2" style={{ fontWeight: '800', color: '#14532D', fontSize: 18 }}>
                        What's on your mind?
                      </Text>
                      <Text variant="caption" style={{ color: tokens.color.textSecondary, marginBottom: 8, fontWeight: '600' }}>
                        Explore popular items before you search
                      </Text>
                    </View>
                  ) : (
                    matchingFoods.length > 0 ? (
                      <View style={{ marginBottom: tokens.spacing.xs }}>
                        <Text variant="label" style={{ fontWeight: '800', color: '#14532D', fontSize: 14 }}>
                          Matching Foods & Cuisines
                        </Text>
                      </View>
                    ) : null
                  )}

                  {matchingFoods.length > 0 ? (
                    <View style={{ marginBottom: 20, gap: 12 }}>
                      {/* Row 1 */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                        {matchingFoods.slice(0, Math.ceil(matchingFoods.length / 2)).map((food) => (
                          <Pressable
                            key={food.name}
                            onPress={() => {
                              setQuery(food.name);
                              trackAnalyticsEvent('search_suggestion_tapped', { food: food.name });
                            }}
                            style={{ alignItems: 'center', width: 84 }}
                          >
                            <View style={{
                              width: 76,
                              height: 76,
                              borderRadius: 38,
                              borderWidth: 2,
                              borderColor: '#FCD34D',
                              overflow: 'hidden',
                              backgroundColor: '#FFFFFF',
                              shadowColor: '#14532D',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                              elevation: 2
                            }}>
                              <Image
                                source={{ uri: food.image }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </View>
                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#14532D', marginTop: 4 }}>
                              {food.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                      {/* Row 2 */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                        {matchingFoods.slice(Math.ceil(matchingFoods.length / 2)).map((food) => (
                          <Pressable
                            key={food.name}
                            onPress={() => {
                              setQuery(food.name);
                              trackAnalyticsEvent('search_suggestion_tapped', { food: food.name });
                            }}
                            style={{ alignItems: 'center', width: 84 }}
                          >
                            <View style={{
                              width: 76,
                              height: 76,
                              borderRadius: 38,
                              borderWidth: 2,
                              borderColor: '#FCD34D',
                              overflow: 'hidden',
                              backgroundColor: '#FFFFFF',
                              shadowColor: '#14532D',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                              elevation: 2
                            }}>
                              <Image
                                source={{ uri: food.image }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </View>
                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#14532D', marginTop: 4 }}>
                              {food.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  {debounced.length === 0 ? (
                    <View style={{ marginTop: 8, marginBottom: 4 }}>
                      <Text variant="heading2" style={{ fontWeight: '800', color: '#14532D', fontSize: 18 }}>
                        Recommended For You
                      </Text>
                      <Text variant="caption" style={{ color: tokens.color.textSecondary, fontWeight: '600' }}>
                        Premium dining spots around your location
                      </Text>
                    </View>
                  ) : (
                    feed.items.length > 0 ? (
                      <View style={{ marginTop: 8, marginBottom: 4 }}>
                        <Text variant="heading2" style={{ fontWeight: '800', color: '#14532D', fontSize: 18 }}>
                          Matching Restaurants
                        </Text>
                      </View>
                    ) : null
                  )}
                </View>
              }
              ListEmptyComponent={
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532D', marginBottom: 4 }}>No Results Found</Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginHorizontal: 32 }}>
                    Try checking spelling or type another restaurant name.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => {
                    trackAnalyticsEvent('result_tapped', {
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
        </View>
        <GlobalCartBanner />
      </Animated.View>
    </SafeAreaView>
  );
}
