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
import { useApproveDeliveryPartnerKycMutation } from '@/api/endpoints/deliveryPartnersApi';
import {
  GAP_API_15_PARTNER_LIST,
  PARTNER_LIST_GAP_MESSAGE,
} from '@/constants/gaps';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import { canApproveDeliveryKyc } from '@/lib/routeGuards';
import { PermissionDenied } from '@/features/analytics/components/PermissionDenied';
import { toUnwrappedApiError } from '@/features/restaurants/lib/apiError';
import { isPartnerUuid } from '../types';

/**
 * P2-ADM-03 AdminDeliveryPartners — GAP-API-15 Partial shell + KYC mutation.
 * No invent partner list or detail GET.
 */
export function DeliveryPartnersPage() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const canApprove = canApproveDeliveryKyc(role);
  const [partnerId, setPartnerId] = useState('');
  const [idError, setIdError] = useState<string | undefined>();
  const [approveKyc, approveState] = useApproveDeliveryPartnerKycMutation();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

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
    trackAnalyticsEvent('admin_delivery_partners_viewed', {
      gapId: GAP_API_15_PARTNER_LIST,
    });
  }, []);

  const onApprove = async () => {
    const id = partnerId.trim();
    if (!isPartnerUuid(id)) {
      setIdError('Enter a valid partner UUID.');
      return;
    }
    setIdError(undefined);
    if (!canApprove) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to approve KYC.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('kyc_approve_tapped', { partnerId: id });
    try {
      const result = await approveKyc(id).unwrap();
      trackAnalyticsEvent('delivery_kyc_approved', { partnerId: id });
      setLastResult(
        `${result.fullName ?? id} · KYC ${result.kycStatus ?? 'VERIFIED'}`,
      );
      setToast({ message: 'Delivery partner KYC approved.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Delivery partners
      </Text>

      <EmptyState
        title="Partner list unavailable"
        description={PARTNER_LIST_GAP_MESSAGE}
        aria-label="Delivery partner list gap"
      />

      {!canApprove ? (
        <PermissionDenied description="OPS or SUPER_ADMIN required to approve KYC." />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing.md,
            maxWidth: 480,
            padding: tokens.spacing.md,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
          }}
        >
          <Text as="h2" variant="heading3">
            KYC approve by UUID
          </Text>
          <Text as="p" variant="caption" color={tokens.color.textSecondary}>
            No admin partner profile GET in V1. Mutation only (GAP-API-15 Partial).
          </Text>
          {!isConnected ? (
            <Text as="p" variant="caption" color={tokens.color.warning}>
              Offline — KYC approve blocked.
            </Text>
          ) : null}
          <TextInput
            label="Partner ID"
            name="partnerId"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            errorText={idError}
            aria-label="Delivery partner UUID"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
          <Button
            label="Approve KYC"
            aria-label="Approve delivery partner KYC"
            loading={approveState.isLoading}
            disabled={!isConnected || approveState.isLoading}
            onClick={() => {
              void onApprove();
            }}
          />
          {lastResult ? (
            <Text as="p" variant="body">
              Last result: {lastResult}
            </Text>
          ) : null}
        </div>
      )}

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
