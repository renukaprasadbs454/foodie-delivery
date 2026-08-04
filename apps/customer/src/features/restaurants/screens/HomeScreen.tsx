import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  TextInput,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import type { BrowseStackParamList } from '../../../navigation/types';
import { RestaurantCard } from '../components/RestaurantCard';
import { RestaurantListSkeleton } from '../components/RestaurantListSkeleton';
import { useRestaurantFeed } from '../hooks/useRestaurantFeed';
import type { RestaurantSort } from '../types';
import { RESTAURANT_SORT_WHITELIST } from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'Home'>;

/**
 * P2-CUS-01 Home — location-optional APPROVED restaurant feed (UI-API Home).
 * No COD UI. Geo bias omitted until a location module is approved (feed without lat/lng).
 */
export function HomeScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [cuisineType, setCuisineType] = useState<string | undefined>();
  const [sort, setSort] = useState<RestaurantSort>('avgRating');
  const [cuisineDraft, setCuisineDraft] = useState('');

  const feed = useRestaurantFeed({ cuisineType, sort });

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

  const applyCuisine = () => {
    const next = cuisineDraft.trim() || undefined;
    setCuisineType(next);
    trackAnalyticsEvent('filter_applied', { cuisineType: next ?? 'all' });
  };

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
        Restaurants
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached results when available.
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Cuisine filter"
            accessibilityLabel="Cuisine filter"
            value={cuisineDraft}
            onChangeText={setCuisineDraft}
            placeholder="e.g. Indian"
            onSubmitEditing={applyCuisine}
            returnKeyType="done"
          />
        </View>
        <Pressable
          onPress={applyCuisine}
          accessibilityRole="button"
          accessibilityLabel="Apply cuisine filter"
          style={{
            alignSelf: 'flex-end',
            minHeight: 48,
            justifyContent: 'center',
            paddingHorizontal: tokens.spacing.md,
          }}
        >
          <Text variant="label" color={tokens.color.accent}>
            Apply
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        {RESTAURANT_SORT_WHITELIST.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              setSort(option);
              trackAnalyticsEvent('filter_applied', { sort: option });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${option}`}
            style={{
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor:
                sort === option ? tokens.color.accent : tokens.color.surface,
              borderWidth: 1,
              borderColor: tokens.color.border,
            }}
          >
            <Text
              variant="label"
              color={
                sort === option
                  ? tokens.color.textInverse
                  : tokens.color.textPrimary
              }
            >
              {option}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => navigation.navigate('Search')}
          accessibilityRole="button"
          accessibilityLabel="Open search"
          style={{
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            borderRadius: tokens.radius.md,
            backgroundColor: tokens.color.surface,
            borderWidth: 1,
            borderColor: tokens.color.border,
          }}
        >
          <Text variant="label">Search</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate('RestaurantListing', {
              cuisineType,
              sort,
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Open full listing"
          style={{
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            borderRadius: tokens.radius.md,
            backgroundColor: tokens.color.surface,
            borderWidth: 1,
            borderColor: tokens.color.border,
          }}
        >
          <Text variant="label">Listing</Text>
        </Pressable>
      </View>
      {feed.isLoading ? (
        <RestaurantListSkeleton />
      ) : (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={feed.isFetching && feed.items.length > 0}
              onRefresh={() => {
                void feed.refetch();
              }}
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
              onPress={() => {
                trackAnalyticsEvent('restaurant_card_tapped', {
                  restaurantId: item.id,
                });
                navigation.navigate('RestaurantDetails', {
                  restaurantId: item.id,
                });
              }}
            />
          )}
        />
      )}
    </View>
  );
}
