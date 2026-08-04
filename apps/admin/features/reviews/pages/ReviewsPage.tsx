'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  DataTableShell,
  EmptyState,
  Text,
  TextInput,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import { useGetRestaurantReviewsQuery } from '@/api/endpoints/restaurantsApi';
import {
  GAP_API_20_GLOBAL_REVIEWS,
  GLOBAL_REVIEWS_GAP_MESSAGE,
} from '@/constants/gaps';
import {
  REVIEW_SORT_WHITELIST,
  isRestaurantUuid,
  isReviewSort,
  type ReviewSort,
} from '../types';

/**
 * P2-ADM-05 AdminReviews — public reviews by restaurantId only.
 * GAP-API-20: no global list / hide-delete moderation.
 */
export function ReviewsPage() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('restaurantId') ?? '';

  const [draftId, setDraftId] = useState(initialId);
  const [restaurantId, setRestaurantId] = useState(
    isRestaurantUuid(initialId) ? initialId.trim() : '',
  );
  const [sort, setSort] = useState<ReviewSort>('-createdAt');
  const [idError, setIdError] = useState<string | undefined>();

  const skip = !restaurantId;
  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId, page: 0, size: 20, sort },
    { skip, refetchOnFocus: true },
  );

  useEffect(() => {
    trackAnalyticsEvent('admin_reviews_viewed', {
      gapId: GAP_API_20_GLOBAL_REVIEWS,
    });
  }, []);

  useEffect(() => {
    if (reviewsQuery.isSuccess && restaurantId) {
      trackAnalyticsEvent('reviews_list_loaded', {
        restaurantId,
        count: reviewsQuery.data?.length ?? 0,
      });
    }
  }, [reviewsQuery.isSuccess, reviewsQuery.data, restaurantId]);

  const applyFilter = () => {
    const id = draftId.trim();
    if (!isRestaurantUuid(id)) {
      setIdError('Enter a valid restaurant UUID.');
      return;
    }
    setIdError(undefined);
    setRestaurantId(id);
    trackAnalyticsEvent('restaurant_filter_changed', { restaurantId: id });
  };

  const rows = useMemo(() => reviewsQuery.data ?? [], [reviewsQuery.data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Reviews
      </Text>

      <EmptyState
        title="Global reviews unavailable"
        description={GLOBAL_REVIEWS_GAP_MESSAGE}
        aria-label="Global reviews gap"
      />

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — showing cached reviews when available.
        </Text>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.md,
          maxWidth: 560,
          padding: tokens.spacing.md,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
        }}
      >
        <Text as="h2" variant="heading3">
          Load by restaurant UUID
        </Text>
        <TextInput
          label="Restaurant ID"
          name="restaurantId"
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          errorText={idError}
          aria-label="Restaurant UUID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text as="span" variant="label">
            Sort
          </Text>
          <select
            aria-label="Review sort"
            value={sort}
            onChange={(e) => {
              if (isReviewSort(e.target.value)) setSort(e.target.value);
            }}
            style={{
              minHeight: 44,
              padding: `0 ${tokens.spacing.md}px`,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
            }}
          >
            {REVIEW_SORT_WHITELIST.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Button
          label="Load reviews"
          aria-label="Load restaurant reviews"
          onClick={applyFilter}
        />
        {restaurantId ? (
          <Text as="p" variant="caption" color={tokens.color.textSecondary}>
            Viewing{' '}
            <Link href={`/restaurants/${restaurantId}`}>
              restaurant {restaurantId}
            </Link>
          </Text>
        ) : null}
      </div>

      {restaurantId ? (
        reviewsQuery.isLoading && !reviewsQuery.data ? (
          <Text as="p" variant="body">
            Loading reviews…
          </Text>
        ) : reviewsQuery.isError ? (
          <EmptyState
            title="Could not load reviews"
            description="Check the restaurant UUID or retry."
            aria-label="Reviews load error"
            actionLabel="Retry"
            onAction={() => {
              void reviewsQuery.refetch();
            }}
          />
        ) : (
          <DataTableShell
            caption="Restaurant reviews (public shape)"
            headers={['Restaurant', 'Delivery', 'Comment', 'Created']}
          >
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: tokens.spacing.md }}>
                  <Text as="span" variant="caption" color={tokens.color.textSecondary}>
                    No reviews for this restaurant.
                  </Text>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${row.createdAt ?? 'r'}-${index}`}>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {row.restaurantRating}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {row.deliveryRating ?? '—'}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {row.comment ?? '—'}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </DataTableShell>
        )
      ) : null}
    </div>
  );
}
