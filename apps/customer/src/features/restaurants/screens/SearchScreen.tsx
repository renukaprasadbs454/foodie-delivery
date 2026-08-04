import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
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

type Props = NativeStackScreenProps<BrowseStackParamList, 'Search'>;

/** P2-CUS-01 Search — §3.1 `search` only (no dish-level search). */
export function SearchScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const debounced = useDebouncedValue(query.trim(), 350);
  const feed = useRestaurantFeed({
    search: debounced.length > 0 ? debounced : undefined,
    sort: 'avgRating',
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_search_viewed');
  }, []);

  useEffect(() => {
    if (debounced.length > 0) {
      trackAnalyticsEvent('restaurant_search_performed', {
        queryLength: debounced.length,
      });
    }
  }, [debounced]);

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
        Search
      </Text>
      <TextInput
        label="Search restaurants"
        accessibilityLabel="Search restaurants"
        value={query}
        onChangeText={setQuery}
        placeholder="Restaurant name"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() =>
          trackAnalyticsEvent('search_submitted', {
            queryLength: query.trim().length,
          })
        }
      />
      {debounced.length === 0 ? (
        <EmptyState
          title="Search restaurants"
          description="No dish-level search in V1. Type a restaurant name."
          accessibilityLabel="Search idle"
        />
      ) : feed.isLoading ? (
        <RestaurantListSkeleton />
      ) : (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
          onEndReached={() => feed.onLoadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              title="No results"
              description="Try another restaurant name."
              accessibilityLabel="Search empty"
            />
          }
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => {
                trackAnalyticsEvent('result_tapped', {
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
