import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetRestaurantReviewsQuery } from '../../../api/endpoints/restaurantsApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { ReviewListItem } from '../components/ReviewListItem';
import { ReviewListSkeleton } from '../components/ReviewListSkeleton';
import {
  REVIEW_SORT_WHITELIST,
  isReviewSort,
  type ReviewSort,
} from '../types';
import type { ReviewsStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ReviewsStackParamList, 'RestaurantReviews'>;

/**
 * P2-RES-04 Restaurant Reviews — read-only public list. No reply/submit.
 */
export function RestaurantReviewsScreen(_props: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const [sort, setSort] = useState<ReviewSort>('createdAt');

  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId: restaurantId ?? '', sort },
    { skip: !restaurantId, refetchOnFocus: true },
  );

  useEffect(() => {
    trackAnalyticsEvent('restaurant_reviews_viewed');
    trackAnalyticsEvent('reviews_list_loaded');
  }, []);

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
          description="Cannot load reviews without a stored restaurant id (GAP-API-03)."
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
        Reviews
      </Text>
      <Text variant="caption" color={tokens.color.textSecondary}>
        Read-only. Customer identity is not shown.
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached reviews when available.
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: tokens.spacing.sm,
        }}
      >
        {REVIEW_SORT_WHITELIST.map((option) => {
          const active = sort === option;
          return (
            <Pressable
              key={option}
              onPress={() => {
                if (!isReviewSort(option)) return;
                setSort(option);
                trackAnalyticsEvent('sort_changed', { sort: option });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${option}`}
              style={{
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                borderRadius: tokens.radius.md,
                backgroundColor: active
                  ? tokens.color.accent
                  : tokens.color.surface,
                borderWidth: 1,
                borderColor: tokens.color.border,
              }}
            >
              <Text
                variant="label"
                color={
                  active ? tokens.color.textInverse : tokens.color.textPrimary
                }
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {reviewsQuery.isLoading && !reviewsQuery.data ? (
        <ReviewListSkeleton />
      ) : (
        <FlatList
          data={reviewsQuery.data ?? []}
          keyExtractor={(item, index) =>
            `${item.createdAt ?? 'review'}-${index}`
          }
          contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={reviewsQuery.isFetching}
              onRefresh={() => {
                void reviewsQuery.refetch();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No reviews yet"
              description="Customer reviews for your restaurant will appear here."
              accessibilityLabel="Reviews empty"
            />
          }
          renderItem={({ item }) => <ReviewListItem review={item} />}
        />
      )}
    </View>
  );
}
