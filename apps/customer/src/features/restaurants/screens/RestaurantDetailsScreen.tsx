import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Badge,
  Button,
  EmptyState,
  Text,
  Skeleton,
  trackAnalyticsEvent,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetRestaurantQuery,
  useGetRestaurantReviewsQuery,
} from '../../../api/endpoints/restaurantsApi';
import type { BrowseStackParamList } from '../../../navigation/types';
import { isRestaurantId } from '../types';

type Props = NativeStackScreenProps<BrowseStackParamList, 'RestaurantDetails'>;

/**
 * P2-CUS-01 Restaurant Details — public profile + reviews.
 * Never renders commissionPct. Menu navigation → P2-CUS-02 Menu.
 */
export function RestaurantDetailsScreen({ navigation, route }: Props) {
  const { restaurantId } = route.params;
  const { tokens } = useTheme();
  const validId = isRestaurantId(restaurantId);

  const restaurantQuery = useGetRestaurantQuery(restaurantId, {
    skip: !validId,
  });
  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId, page: 0, size: 20, sort: 'createdAt' },
    { skip: !validId },
  );

  useEffect(() => {
    trackAnalyticsEvent('customer_restaurant_details_viewed', {
      restaurantId,
    });
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantQuery.isSuccess) {
      trackAnalyticsEvent('restaurant_viewed', { restaurantId });
    }
  }, [restaurantId, restaurantQuery.isSuccess]);

  if (!validId) {
    return (
      <EmptyState
        title="Invalid restaurant"
        description="The restaurant link is not valid."
        accessibilityLabel="Invalid restaurant id"
        actionLabel="Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  if (restaurantQuery.isError) {
    return (
      <EmptyState
        title="Restaurant not found"
        description="This restaurant is unavailable."
        accessibilityLabel="Restaurant not found"
        actionLabel="Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  if (restaurantQuery.isLoading || !restaurantQuery.data) {
    return (
      <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.md }}>
        <Skeleton.Block width="80%" height={28} />
        <Skeleton.Block width="100%" height={80} />
        <Skeleton.Block width="60%" height={20} />
      </View>
    );
  }

  const restaurant = restaurantQuery.data;
  // Defense: never surface commission if a buggy payload includes it.
  const safeRestaurant = { ...restaurant };
  delete (safeRestaurant as { commissionPct?: unknown }).commissionPct;

  const cuisine = safeRestaurant.cuisineTypes?.join(' · ');
  const rating =
    safeRestaurant.avgRating !== null && safeRestaurant.avgRating !== undefined
      ? safeRestaurant.avgRating.toFixed(1)
      : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      contentContainerStyle={{
        padding: tokens.spacing.lg,
        gap: tokens.spacing.md,
        paddingBottom: 48,
      }}
      refreshControl={
        <RefreshControl
          refreshing={restaurantQuery.isFetching}
          onRefresh={() => {
            void restaurantQuery.refetch();
            void reviewsQuery.refetch();
          }}
        />
      }
    >
      <Text variant="heading1" accessibilityRole="header">
        {safeRestaurant.name}
      </Text>
      {cuisine ? (
        <Text variant="body" color={tokens.color.textSecondary}>
          {cuisine}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
        {rating ? (
          <Badge
            label={`★ ${rating}`}
            tone="accent"
            accessibilityLabel={`Rating ${rating}`}
          />
        ) : null}
        {safeRestaurant.city ? (
          <Badge
            label={safeRestaurant.city}
            tone="neutral"
            accessibilityLabel={`City ${safeRestaurant.city}`}
          />
        ) : null}
      </View>
      {safeRestaurant.description ? (
        <Text variant="body">{safeRestaurant.description}</Text>
      ) : null}
      {safeRestaurant.addressLine ? (
        <Text variant="bodySmall" color={tokens.color.textSecondary}>
          {safeRestaurant.addressLine}
        </Text>
      ) : null}
      <Button
        label="View menu"
        accessibilityLabel="View menu"
        onPress={() => {
          trackAnalyticsEvent('view_menu_tapped', { restaurantId });
          navigation.navigate('Menu', { restaurantId });
        }}
      />
      <Text variant="heading2">Reviews</Text>
      {reviewsQuery.isLoading ? (
        <Skeleton.Block width="100%" height={60} />
      ) : (reviewsQuery.data ?? []).length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Be the first to review after an order."
          accessibilityLabel="Reviews empty"
        />
      ) : (
        <View style={{ gap: tokens.spacing.sm }}>
          {(reviewsQuery.data ?? []).slice(0, 3).map((item, index) => (
            <View
              key={`${item.createdAt ?? 'r'}-${item.restaurantRating}-${index}`}
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: tokens.color.border,
                gap: tokens.spacing.xs,
              }}
            >
              <Text variant="label">★ {item.restaurantRating}</Text>
              {item.comment ? <Text variant="body">{item.comment}</Text> : null}
            </View>
          ))}
        </View>
      )}
      <Button
        label="See all reviews"
        accessibilityLabel="See all reviews"
        variant="secondary"
        onPress={() => {
          trackAnalyticsEvent('view_reviews_tapped', { restaurantId });
          navigation.navigate('Reviews', {
            mode: 'list',
            restaurantId,
          });
        }}
      />
    </ScrollView>
  );
}
