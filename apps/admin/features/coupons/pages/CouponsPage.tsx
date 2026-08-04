'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import {
  useCreateCouponMutation,
  useDeactivateCouponMutation,
} from '@/api/endpoints/couponsApi';
import {
  COUPON_LIST_GAP_MESSAGE,
  GAP_API_19_COUPON_LIST,
} from '@/constants/gaps';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import { canManageCoupons } from '@/lib/routeGuards';
import { PermissionDenied } from '@/features/analytics/components/PermissionDenied';
import { toUnwrappedApiError } from '@/features/restaurants/lib/apiError';
import {
  DISCOUNT_TYPES,
  isCouponUuid,
  validateCreateCoupon,
  type CreateCouponFormInput,
} from '../types';

const EMPTY_FORM: CreateCouponFormInput = {
  code: '',
  discountType: 'FLAT',
  value: '',
  minOrderAmount: '0',
  maxDiscountAmount: '',
  expiryDate: '',
  usageLimitTotal: '',
  usageLimitPerUser: '1',
  restaurantId: '',
};

/**
 * P2-ADM-05 AdminCoupons — GAP-API-19 Partial shell + create/deactivate.
 */
export function CouponsPage() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const canManage = canManageCoupons(role);

  const [form, setForm] = useState<CreateCouponFormInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();
  const [deactivateId, setDeactivateId] = useState('');
  const [deactivateError, setDeactivateError] = useState<string | undefined>();
  const [lastCreated, setLastCreated] = useState<string | null>(null);
  const [lastDeactivated, setLastDeactivated] = useState<string | null>(null);

  const [createCoupon, createState] = useCreateCouponMutation();
  const [deactivateCoupon, deactivateState] = useDeactivateCouponMutation();
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
    trackAnalyticsEvent('admin_coupons_viewed', {
      gapId: GAP_API_19_COUPON_LIST,
    });
  }, []);

  const setField = <K extends keyof CreateCouponFormInput>(
    key: K,
    value: CreateCouponFormInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onCreate = async () => {
    const validated = validateCreateCoupon(form);
    if (!validated.ok) {
      setFormError(validated.message);
      return;
    }
    setFormError(undefined);
    if (!canManage) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to create a coupon.',
        variant: 'warning',
      });
      return;
    }
    try {
      const created = await createCoupon(validated.body).unwrap();
      trackAnalyticsEvent('coupon_created', {
        couponId: created.couponId,
        code: created.code,
      });
      setLastCreated(`${created.code} · ${created.couponId}`);
      setToast({ message: 'Coupon created.', variant: 'success' });
      setForm(EMPTY_FORM);
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onDeactivate = async () => {
    const id = deactivateId.trim();
    if (!isCouponUuid(id)) {
      setDeactivateError('Enter a valid coupon UUID.');
      return;
    }
    setDeactivateError(undefined);
    if (!canManage) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to deactivate a coupon.',
        variant: 'warning',
      });
      return;
    }
    try {
      const result = await deactivateCoupon(id).unwrap();
      trackAnalyticsEvent('coupon_deactivated', { couponId: result.couponId });
      setLastDeactivated(
        `${result.couponId} · active=${String(result.isActive)}`,
      );
      setToast({ message: 'Coupon deactivated.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  if (!canManage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
        <Text as="h1" variant="heading1">
          Coupons
        </Text>
        <PermissionDenied description="OPS, FINANCE, or SUPER_ADMIN required to manage coupons." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Coupons
      </Text>

      <EmptyState
        title="Coupon list unavailable"
        description={COUPON_LIST_GAP_MESSAGE}
        aria-label="Coupon list gap"
      />

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — create/deactivate blocked.
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
          Create coupon
        </Text>
        <TextInput
          label="Code"
          name="code"
          value={form.code}
          onChange={(e) => setField('code', e.target.value.toUpperCase())}
          aria-label="Coupon code"
          placeholder="SAVE10"
        />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text as="span" variant="label">
            Discount type
          </Text>
          <select
            aria-label="Discount type"
            value={form.discountType}
            onChange={(e) => setField('discountType', e.target.value)}
            style={{
              minHeight: 44,
              padding: `0 ${tokens.spacing.md}px`,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
            }}
          >
            {DISCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Value"
          name="value"
          type="number"
          inputMode="decimal"
          min={0.01}
          step="0.01"
          value={form.value}
          onChange={(e) => setField('value', e.target.value)}
          aria-label="Discount value"
        />
        <TextInput
          label="Min order amount"
          name="minOrderAmount"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={form.minOrderAmount}
          onChange={(e) => setField('minOrderAmount', e.target.value)}
          aria-label="Minimum order amount"
        />
        <TextInput
          label="Max discount amount"
          name="maxDiscountAmount"
          type="number"
          inputMode="decimal"
          min={0.01}
          step="0.01"
          value={form.maxDiscountAmount}
          onChange={(e) => setField('maxDiscountAmount', e.target.value)}
          aria-label="Max discount amount"
        />
        <TextInput
          label="Expiry date"
          name="expiryDate"
          type="date"
          value={form.expiryDate}
          onChange={(e) => setField('expiryDate', e.target.value)}
          aria-label="Expiry date"
        />
        <TextInput
          label="Usage limit total (optional)"
          name="usageLimitTotal"
          type="number"
          inputMode="numeric"
          min={1}
          value={form.usageLimitTotal}
          onChange={(e) => setField('usageLimitTotal', e.target.value)}
          aria-label="Usage limit total"
        />
        <TextInput
          label="Usage limit per user"
          name="usageLimitPerUser"
          type="number"
          inputMode="numeric"
          min={1}
          value={form.usageLimitPerUser}
          onChange={(e) => setField('usageLimitPerUser', e.target.value)}
          aria-label="Usage limit per user"
          errorText={formError}
        />
        <TextInput
          label="Restaurant ID (optional)"
          name="restaurantId"
          value={form.restaurantId}
          onChange={(e) => setField('restaurantId', e.target.value)}
          aria-label="Restaurant UUID optional"
        />
        <Button
          label="Create coupon"
          aria-label="Create coupon"
          loading={createState.isLoading}
          disabled={!isConnected || createState.isLoading}
          onClick={() => {
            void onCreate();
          }}
        />
        {lastCreated ? (
          <Text as="p" variant="body">
            Last created: {lastCreated}
          </Text>
        ) : null}
      </div>

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
          Deactivate by UUID
        </Text>
        <TextInput
          label="Coupon ID"
          name="couponId"
          value={deactivateId}
          onChange={(e) => setDeactivateId(e.target.value)}
          errorText={deactivateError}
          aria-label="Coupon UUID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Button
          label="Deactivate coupon"
          aria-label="Deactivate coupon"
          variant="danger"
          loading={deactivateState.isLoading}
          disabled={!isConnected || deactivateState.isLoading}
          onClick={() => {
            void onDeactivate();
          }}
        />
        {lastDeactivated ? (
          <Text as="p" variant="body">
            Last deactivated: {lastDeactivated}
          </Text>
        ) : null}
      </div>

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
