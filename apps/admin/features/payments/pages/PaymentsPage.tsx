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
import { useRefundPaymentMutation } from '@/api/endpoints/paymentsApi';
import {
  GAP_API_17_PAYMENT_LIST,
  PAYMENT_LIST_GAP_MESSAGE,
} from '@/constants/gaps';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import { canRefundPayment } from '@/lib/routeGuards';
import { PermissionDenied } from '@/features/analytics/components/PermissionDenied';
import { toUnwrappedApiError } from '@/features/restaurants/lib/apiError';
import { validateRefundForm } from '../types';

/**
 * P2-ADM-04 AdminPayments — GAP-API-17 Partial shell + refund-by-UUID.
 * Never call payment webhooks from the Admin UI.
 */
export function PaymentsPage() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const canRefund = canRefundPayment(role);

  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | undefined>();
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [refund, refundState] = useRefundPaymentMutation();
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
    trackAnalyticsEvent('admin_payments_viewed', {
      gapId: GAP_API_17_PAYMENT_LIST,
    });
  }, []);

  const onRefund = async () => {
    const validated = validateRefundForm(paymentId, amount, reason);
    if (!validated.ok) {
      setFormError(validated.message);
      return;
    }
    setFormError(undefined);
    if (!canRefund) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to submit a refund.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('refund_submitted', {
      paymentId: validated.paymentId,
    });
    try {
      const result = await refund({
        paymentId: validated.paymentId,
        body: validated.body,
      }).unwrap();
      trackAnalyticsEvent('refund_initiated', {
        paymentId: validated.paymentId,
        refundRequestId: result.refundRequestId,
        status: result.status,
      });
      setLastResult(
        `${result.refundRequestId} · ${result.status ?? 'INITIATED'}`,
      );
      setToast({
        message: 'Refund initiated (HTTP 202).',
        variant: 'success',
      });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Payments
      </Text>

      <EmptyState
        title="Payments list unavailable"
        description={PAYMENT_LIST_GAP_MESSAGE}
        aria-label="Payments list gap"
      />

      {!canRefund ? (
        <PermissionDenied description="FINANCE, OPS, or SUPER_ADMIN required to refund." />
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
            Refund by payment UUID
          </Text>
          <Text as="p" variant="caption" color={tokens.color.textSecondary}>
            No admin payment GET in V1. Order DTO has no paymentId — enter the
            payment UUID directly. Webhooks are never called from this UI.
          </Text>
          {!isConnected ? (
            <Text as="p" variant="caption" color={tokens.color.warning}>
              Offline — refund blocked.
            </Text>
          ) : null}
          <TextInput
            label="Payment ID"
            name="paymentId"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            aria-label="Payment UUID"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
          <TextInput
            label="Amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Refund amount"
          />
          <TextInput
            label="Reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            errorText={formError}
            aria-label="Refund reason"
          />
          <Button
            label="Submit refund"
            aria-label="Submit payment refund"
            loading={refundState.isLoading}
            disabled={!isConnected || refundState.isLoading}
            onClick={() => {
              void onRefund();
            }}
          />
          {lastResult ? (
            <Text as="p" variant="body">
              Last refund: {lastResult}
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
