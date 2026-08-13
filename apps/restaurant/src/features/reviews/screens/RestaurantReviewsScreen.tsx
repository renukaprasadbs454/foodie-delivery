import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetRestaurantReviewsQuery } from '../../../api/endpoints/restaurantsApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewDetailsModal } from '../components/ReviewDetailsModal';
import { ReviewEmptyState } from '../components/ReviewEmptyState';
import { ReviewListSkeleton } from '../components/ReviewListSkeleton';
import { ReviewSummaryCards } from '../components/ReviewSummaryCards';
import type { RestaurantReview, ReviewSort } from '../types';
import type { ReviewsStackParamList } from '../../../navigation/types';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import { getMockReviews, MOCK_REVIEWS, type ExtendedRestaurantReview } from '../../../mock';

type Props = NativeStackScreenProps<ReviewsStackParamList, 'RestaurantReviews'>;

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

export function RestaurantReviewsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const storedRestaurantId = useAppSelector(selectRestaurantId);
  const restaurantId =
    storedRestaurantId ??
    (MOCK_CONFIG.ENABLE_MOCK_FALLBACK ? MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID : undefined);

  // States for search, rating filter, sort order, selected detail modal
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<
    'newest' | 'oldest' | 'highest' | 'lowest'
  >('newest');
  const [dateRange, setDateRange] = useState<'30days' | 'all'>('30days');
  const [activeReview, setActiveReview] = useState<RestaurantReview | null>(
    null,
  );

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const apiSort: ReviewSort =
    sortOption === 'highest' || sortOption === 'lowest'
      ? 'restaurantRating'
      : 'createdAt';

  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId: restaurantId ?? '', sort: apiSort },
    { skip: !restaurantId, refetchOnFocus: true },
  );

  useEffect(() => {
    trackAnalyticsEvent('restaurant_reviews_viewed');
  }, []);

  const apiReviews = reviewsQuery.data;
  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected || reviewsQuery.isError || !apiReviews || apiReviews.length === 0);

  const rawReviews: RestaurantReview[] = useMemo(() => {
    if (apiReviews && apiReviews.length > 0) {
      return apiReviews;
    }
    return MOCK_REVIEWS;
  }, [apiReviews]);

  // Compute rating filter counts
  const ratingCounts = useMemo(() => {
    const counts = { all: rawReviews.length, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rawReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.restaurantRating)));
      if (star >= 1 && star <= 5) {
        counts[star as 1 | 2 | 3 | 4 | 5]++;
      }
    });
    return counts;
  }, [rawReviews]);

  // Filter & Search & Sort
  const processedReviews = useMemo(() => {
    let result = [...rawReviews];

    if (selectedRating !== null) {
      result = result.filter(
        (r) => Math.round(r.restaurantRating) === selectedRating,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => {
        const ext = r as ExtendedRestaurantReview;
        return (
          (r.comment && r.comment.toLowerCase().includes(q)) ||
          (ext.customerName && ext.customerName.toLowerCase().includes(q)) ||
          (ext.itemInfo && ext.itemInfo.toLowerCase().includes(q)) ||
          (r.createdAt && r.createdAt.toLowerCase().includes(q))
        );
      });
    }

    result.sort((a, b) => {
      if (sortOption === 'newest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOption === 'oldest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortOption === 'highest') {
        return b.restaurantRating - a.restaurantRating;
      }
      if (sortOption === 'lowest') {
        return a.restaurantRating - b.restaurantRating;
      }
      return 0;
    });

    return result;
  }, [rawReviews, selectedRating, searchQuery, sortOption]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.md,
          paddingTop: tokens.spacing.md,
          paddingBottom: 80,
          gap: tokens.spacing.md,
          maxWidth: isWide ? 1200 : undefined,
          alignSelf: isWide ? 'center' : undefined,
          width: '100%',
        }}
        refreshControl={
          <RefreshControl
            refreshing={reviewsQuery.isFetching}
            onRefresh={() => {
              void reviewsQuery.refetch();
            }}
          />
        }
      >
        {/* DEMO MODE INDICATOR */}
        {isUsingMock ? <DemoModeIndicator isMockActive={true} /> : null}

        {/* HEADER SECTION */}
        <View style={{ gap: tokens.spacing.xs }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ gap: 2 }}>
              <Text
                variant="heading1"
                style={{ color: BRAND_PRIMARY }}
                accessibilityRole="header"
              >
                Customer Reviews
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                Verified customer feedback and dining ratings
              </Text>
            </View>

            <Button
              label={dateRange === '30days' ? '📅 Last 30 Days ▼' : '📅 All Time ▼'}
              accessibilityLabel="Toggle date range filter"
              variant="secondary"
              onPress={() =>
                setDateRange((prev) => (prev === '30days' ? 'all' : '30days'))
              }
              style={{ height: 38 }}
            />
          </View>
        </View>

        {/* REVIEW SUMMARY METRICS CARDS */}
        <ReviewSummaryCards reviews={rawReviews} />

        {/* RATING FILTER BAR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 2,
          }}
        >
          {/* ALL REVIEWS CHIP */}
          <Pressable
            onPress={() => {
              setSelectedRating(null);
              trackAnalyticsEvent('rating_filter_changed', { rating: 'all' });
            }}
            accessibilityRole="button"
            accessibilityLabel={`All reviews (${ratingCounts.all})`}
            style={({ pressed }) => [{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 14,
              gap: 8,
              height: 40,
              backgroundColor: selectedRating === null ? BRAND_PRIMARY : tokens.color.surface,
              borderWidth: 1,
              borderColor: selectedRating === null ? BRAND_PRIMARY : tokens.color.border,
              opacity: pressed ? 0.85 : 1,
              shadowColor: selectedRating === null ? '#000000' : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 4,
              elevation: selectedRating === null ? 3 : 0,
            }]}
          >
            <Text
              variant="label"
              style={{
                color: selectedRating === null ? '#FFFFFF' : tokens.color.textPrimary,
                fontWeight: selectedRating === null ? 'bold' : 'normal',
                fontSize: 13,
              }}
            >
              All Reviews
            </Text>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: selectedRating === null ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                minWidth: 20,
                alignItems: 'center',
              }}
            >
              <Text
                variant="caption"
                style={{
                  color: selectedRating === null ? '#FFFFFF' : '#475569',
                  fontWeight: 'bold',
                  fontSize: 11,
                }}
              >
                {ratingCounts.all}
              </Text>
            </View>
          </Pressable>

          {/* 5 STARS TO 1 STAR CHIPS */}
          {[5, 4, 3, 2, 1].map((star) => {
            const isSelected = selectedRating === star;
            const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5];

            return (
              <Pressable
                key={star}
                onPress={() => {
                  setSelectedRating(star);
                  trackAnalyticsEvent('rating_filter_changed', { rating: star });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${star} stars reviews (${count})`}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  gap: 8,
                  height: 40,
                  backgroundColor: isSelected ? BRAND_PRIMARY : tokens.color.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? BRAND_PRIMARY : tokens.color.border,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: isSelected ? '#000000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: isSelected ? 3 : 0,
                }]}
              >
                <Text
                  variant="label"
                  style={{
                    color: isSelected ? '#FFFFFF' : tokens.color.textPrimary,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: 13,
                  }}
                >
                  ★ {star} Stars
                </Text>
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 10,
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                    minWidth: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontWeight: 'bold',
                      fontSize: 11,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* SEARCH & SORT CONTROLS */}
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="🔍 Search reviews..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search reviews"
            />
          </View>

          <Button
            label={
              sortOption === 'newest'
                ? 'Sort: Newest ▼'
                : sortOption === 'oldest'
                  ? 'Sort: Oldest ▼'
                  : sortOption === 'highest'
                    ? 'Sort: Highest ★ ▼'
                    : 'Sort: Lowest ★ ▼'
            }
            accessibilityLabel="Toggle sort option"
            variant="secondary"
            onPress={() => {
              const next: Record<string, 'newest' | 'oldest' | 'highest' | 'lowest'> = {
                newest: 'oldest',
                oldest: 'highest',
                highest: 'lowest',
                lowest: 'newest',
              };
              setSortOption(next[sortOption]);
            }}
            style={{ height: 42 }}
          />
        </View>

        {/* REVIEWS LIST & STATES */}
        {reviewsQuery.isLoading && !isUsingMock ? (
          <ReviewListSkeleton />
        ) : processedReviews.length === 0 ? (
          <ReviewEmptyState
            ratingFilter={selectedRating}
            isFetching={reviewsQuery.isFetching}
            onRefresh={() => void reviewsQuery.refetch()}
          />
        ) : (
          <View style={{ gap: tokens.spacing.md }}>
            {processedReviews.map((review, index) => (
              <ReviewCard
                key={`${review.createdAt ?? 'rev'}-${index}`}
                review={review}
                onPress={(item) => setActiveReview(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* REVIEW DETAILS MODAL */}
      <ReviewDetailsModal
        visible={Boolean(activeReview)}
        review={activeReview}
        onClose={() => setActiveReview(null)}
      />

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
