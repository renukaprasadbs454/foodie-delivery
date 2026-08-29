import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View, Image } from 'react-native';
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
import { MOCK_RESTAURANTS } from '../mockData';

type Props = NativeStackScreenProps<BrowseStackParamList, 'RestaurantDetails'>;

const FALLBACK_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600', // Burger & Fries
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600', // Pizza
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600', // Bowls / Curries
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600', // Specialty Dessert
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600', // Salad
];

function getRestaurantImage(name: string, remoteUrl?: string | null): string {
  if (remoteUrl && remoteUrl.startsWith('http')) return remoteUrl;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_FOOD_IMAGES.length;
  return FALLBACK_FOOD_IMAGES[index]!;
}

export function RestaurantDetailsScreen({ navigation, route }: Props) {
  const { restaurantId } = route.params;
  const { tokens } = useTheme();
  const validId = isRestaurantId(restaurantId);
  const isMock = restaurantId.startsWith('mock-resto-');

  const restaurantQuery = useGetRestaurantQuery(restaurantId, {
    skip: !validId || isMock,
  });
  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId, page: 0, size: 20, sort: 'createdAt' },
    { skip: !validId || isMock },
  );

  useEffect(() => {
    trackAnalyticsEvent('customer_restaurant_details_viewed', {
      restaurantId,
    });
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantQuery.isSuccess || isMock) {
      trackAnalyticsEvent('restaurant_viewed', { restaurantId });
    }
  }, [restaurantId, restaurantQuery.isSuccess, isMock]);

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

  const mockRestaurant = isMock
    ? MOCK_RESTAURANTS.find((r) => r.id === restaurantId)
    : null;

  if (!isMock && restaurantQuery.isError) {
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

  if (
    isMock
      ? !mockRestaurant
      : restaurantQuery.isLoading || !restaurantQuery.data
  ) {
    return (
      <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.md }}>
        <Skeleton.Block width="80%" height={28} />
        <Skeleton.Block width="100%" height={80} />
        <Skeleton.Block width="60%" height={20} />
      </View>
    );
  }

  const restaurant = isMock ? mockRestaurant! : restaurantQuery.data!;
  const safeRestaurant = { ...restaurant };
  delete (safeRestaurant as { commissionPct?: unknown }).commissionPct;

  const cuisine = safeRestaurant.cuisineTypes?.join(' · ');
  const rating =
    safeRestaurant.avgRating !== null && safeRestaurant.avgRating !== undefined
      ? safeRestaurant.avgRating.toFixed(1)
      : null;

  const imageUrl = getRestaurantImage(
    safeRestaurant.name,
    safeRestaurant.imageUrl,
  );


  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      contentContainerStyle={{
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
      {/* Banner Cover Image */}
      <View style={{ height: 220, width: '100%', backgroundColor: '#F0ECE4' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Subtle shadow overlay at bottom */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(25,23,20,0.3)' }} />
      </View>

      {/* Floating Info Section */}
      <View style={{
        marginTop: -30,
        backgroundColor: tokens.color.surface,
        borderTopLeftRadius: tokens.radius.lg,
        borderTopRightRadius: tokens.radius.lg,
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: tokens.spacing.xl,
        gap: tokens.spacing.md,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: tokens.spacing.md }}>
            <Text variant="heading1" style={{ fontWeight: '800', color: tokens.color.textPrimary }}>
              {safeRestaurant.name}
            </Text>
            {cuisine ? (
              <Text variant="bodySmall" color={tokens.color.textSecondary} style={{ fontWeight: '500', marginTop: 3 }}>
                {cuisine}
              </Text>
            ) : null}
          </View>

          {rating ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FEF3C7',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: tokens.radius.md,
            }}>
              <Text style={{ color: tokens.color.accentMuted, fontWeight: 'bold', fontSize: 13, marginRight: 2 }}>★</Text>
              <Text variant="heading3" style={{ color: '#92400E', fontWeight: '900', fontSize: 16 }}>
                {rating}
              </Text>
            </View>
          ) : null}
        </View>

        {safeRestaurant.description ? (
          <Text variant="bodySmall" color={tokens.color.textSecondary} style={{ lineHeight: 20 }}>
            {safeRestaurant.description}
          </Text>
        ) : null}

        {safeRestaurant.addressLine ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderColor: tokens.color.border,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            paddingVertical: tokens.spacing.md,
            marginVertical: tokens.spacing.xs,
          }}>
            <Text style={{ marginRight: 6, fontSize: 14 }}>📍</Text>
            <Text variant="caption" color={tokens.color.textSecondary} style={{ flex: 1, fontWeight: '500' }}>
              {safeRestaurant.addressLine}{safeRestaurant.city ? `, ${safeRestaurant.city}` : ''}
            </Text>
          </View>
        ) : null}

        {/* View Menu Primary Brand Button */}
        <Button
          label="Browse Full Menu & Order"
          accessibilityLabel="View menu"
          onPress={() => {
            trackAnalyticsEvent('view_menu_tapped', { restaurantId });
            navigation.navigate('Menu', { restaurantId });
          }}
          style={{
            height: 54,
            borderRadius: tokens.radius.lg,
            backgroundColor: tokens.color.accent, // Dark Green
            shadowColor: tokens.color.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        />

        {/* Reviews section */}
        <View style={{ marginTop: tokens.spacing.lg, gap: tokens.spacing.md }}>
          <Text variant="heading2" style={{ fontWeight: '800', color: tokens.color.textPrimary }}>
            Customer Reviews
          </Text>
          {reviewsQuery.isLoading ? (
            <Skeleton.Block width="100%" height={60} />
          ) : (reviewsQuery.data ?? []).length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description="Be the first to review after an order."
              accessibilityLabel="Reviews empty"
            />
          ) : (
            <View style={{ gap: tokens.spacing.md }}>
              {(reviewsQuery.data ?? []).slice(0, 3).map((item, index) => (
                <View
                  key={`${item.createdAt ?? 'r'}-${item.restaurantRating}-${index}`}
                  style={{
                    backgroundColor: tokens.color.background,
                    padding: tokens.spacing.md,
                    borderRadius: tokens.radius.md,
                    borderWidth: 1,
                    borderColor: tokens.color.border,
                    gap: tokens.spacing.xs,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#F59E0B', marginRight: 4, fontSize: 12 }}>★</Text>
                    <Text variant="label" style={{ fontWeight: '800', color: tokens.color.textPrimary }}>
                      {item.restaurantRating} / 5
                    </Text>
                  </View>
                  {item.comment ? (
                    <Text variant="bodySmall" color={tokens.color.textSecondary} style={{ lineHeight: 18 }}>
                      "{item.comment}"
                    </Text>
                  ) : null}
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
            style={{
              height: 48,
              borderRadius: tokens.radius.md,
              borderColor: tokens.color.border,
              backgroundColor: 'transparent',
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

