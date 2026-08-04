'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  DataTableShell,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import {
  useApproveRestaurantMutation,
  useGetRestaurantQuery,
  useGetRestaurantReviewsQuery,
  useSuspendRestaurantMutation,
} from '@/api/endpoints/restaurantsApi';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import { canManageRestaurants } from '@/lib/routeGuards';
import { PermissionDenied } from '@/features/analytics/components/PermissionDenied';
import { RestaurantDetailSkeleton } from '../components/RestaurantDetailSkeleton';
import { SuspendReasonModal } from '../components/SuspendReasonModal';
import { formatCommissionPct } from '../types';
import { toUnwrappedApiError } from '../lib/apiError';

type Props = {
  restaurantId: string;
};

/**
 * P2-ADM-03 AdminRestaurantDetails — GET detail + reviews + approve/suspend.
 */
export function RestaurantDetailsPage({ restaurantId }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const canManage = canManageRestaurants(role);

  const detailQuery = useGetRestaurantQuery(restaurantId, {
    skip: !restaurantId,
    refetchOnFocus: true,
  });
  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId, page: 0, size: 20 },
    { skip: !restaurantId, refetchOnFocus: true },
  );
  const [approve, approveState] = useApproveRestaurantMutation();
  const [suspend, suspendState] = useSuspendRestaurantMutation();

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('admin_restaurant_details_viewed', { restaurantId });
  }, [restaurantId]);

  const onApprove = async () => {
    if (!canManage) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to approve.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('approve_tapped', { restaurantId });
    try {
      await approve(restaurantId).unwrap();
      trackAnalyticsEvent('restaurant_approved', { restaurantId });
      setToast({ message: 'Restaurant approved.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onSuspend = async (reason: string) => {
    if (!canManage) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to suspend.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('suspend_tapped', { restaurantId });
    try {
      await suspend({ restaurantId, body: { reason } }).unwrap();
      trackAnalyticsEvent('restaurant_suspended', { restaurantId });
      setSuspendOpen(false);
      setToast({ message: 'Restaurant suspended.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const data = detailQuery.data;
  const address = data?.address;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Restaurant details
      </Text>

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — showing cached detail when available. Mutations blocked.
        </Text>
      ) : null}

      {!canManage ? (
        <PermissionDenied description="OPS or SUPER_ADMIN required to approve or suspend." />
      ) : null}

      {detailQuery.isLoading && !data ? (
        <RestaurantDetailSkeleton />
      ) : detailQuery.isError && !data ? (
        <EmptyState
          title="Restaurant not found"
          description="Check the UUID or retry."
          aria-label="Restaurant detail error"
          actionLabel="Retry"
          onAction={() => {
            void detailQuery.refetch();
          }}
        />
      ) : data ? (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing.sm,
              padding: tokens.spacing.md,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
            }}
          >
            <Text as="h2" variant="heading2">
              {data.name}
            </Text>
            <Text as="p" variant="body" color={tokens.color.textSecondary}>
              Status: {data.status ?? '—'} · Rating: {data.avgRating ?? '—'}
            </Text>
            <Text as="p" variant="body">
              Commission: {formatCommissionPct(data.commissionPct)}
            </Text>
            <Text as="p" variant="caption" color={tokens.color.textSecondary}>
              ID {data.restaurantId}
            </Text>
            {data.description ? (
              <Text as="p" variant="body">
                {data.description}
              </Text>
            ) : null}
            {address ? (
              <Text as="p" variant="caption" color={tokens.color.textSecondary}>
                {[address.line1, address.line2, address.city, address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            ) : null}
            {data.cuisineTypes?.length ? (
              <Text as="p" variant="caption" color={tokens.color.textSecondary}>
                Cuisines: {data.cuisineTypes.join(', ')}
              </Text>
            ) : null}
          </div>

          {canManage ? (
            <div style={{ display: 'flex', gap: tokens.spacing.md, flexWrap: 'wrap' }}>
              <Button
                label="Approve"
                aria-label="Approve restaurant"
                loading={approveState.isLoading}
                disabled={!isConnected || approveState.isLoading}
                onClick={() => {
                  void onApprove();
                }}
              />
              <Button
                label="Suspend"
                aria-label="Suspend restaurant"
                variant="danger"
                disabled={!isConnected || suspendState.isLoading}
                onClick={() => setSuspendOpen(true)}
              />
            </div>
          ) : null}

          <div>
            {reviewsQuery.isLoading && !reviewsQuery.data ? (
              <RestaurantDetailSkeleton />
            ) : (
              <DataTableShell
                caption="Reviews"
                headers={['Restaurant', 'Delivery', 'Comment', 'Created']}
              >
                {(reviewsQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: tokens.spacing.md }}
                    >
                      <Text as="span" variant="caption" color={tokens.color.textSecondary}>
                        No reviews yet.
                      </Text>
                    </td>
                  </tr>
                ) : (
                  (reviewsQuery.data ?? []).map((row, index) => (
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
            )}
          </div>
        </>
      ) : null}

      <SuspendReasonModal
        open={suspendOpen}
        loading={suspendState.isLoading}
        onClose={() => setSuspendOpen(false)}
        onConfirm={(reason) => {
          void onSuspend(reason);
        }}
      />

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        aria-label={toast?.message ?? 'Toast'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
