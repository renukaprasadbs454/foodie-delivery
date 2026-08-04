import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  Toast,
  createIdempotencyKey,
  formatMoneyInr,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetWalletBalanceQuery,
  useRequestPayoutMutation,
} from '../../../api/endpoints/walletApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { parseMoneyAmount, validatePayoutAmount } from '../types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'PayoutRequests'>;

/**
 * P2-DEL-04 — POST /wallet/payout-requests + balance.
 * History list is GAP-API-11 — create + balance only (Partial shell).
 * Offline payout blocked. Idempotency-Key per attempt.
 */
export function PayoutRequestsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const balanceQuery = useGetWalletBalanceQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { refetch: refetchBalance } = balanceQuery;
  const [requestPayout, payoutState] = useRequestPayoutMutation();
  const [amountText, setAmountText] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const attemptKey = useRef<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => {
      setFieldError(error.message);
      setToast({ message: error.message, variant: 'error' });
    },
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useFocusEffect(
    useCallback(() => {
      void refetchBalance();
    }, [refetchBalance]),
  );

  useEffect(() => {
    trackAnalyticsEvent('delivery_payout_requests_viewed');
  }, []);

  const balance = parseMoneyAmount(balanceQuery.data?.balance);

  const onSubmit = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to request a payout.',
        variant: 'warning',
      });
      return;
    }
    const validated = validatePayoutAmount(amountText, balance);
    if (!validated.ok) {
      setFieldError(validated.message);
      return;
    }
    setFieldError(undefined);
    if (!attemptKey.current) {
      attemptKey.current = createIdempotencyKey();
    }
    trackAnalyticsEvent('payout_submitted');
    try {
      const result = await requestPayout({
        amount: validated.amount,
        idempotencyKey: attemptKey.current,
      }).unwrap();
      trackAnalyticsEvent('payout_requested', {
        payoutId: result.payoutId,
        status: result.status,
      });
      setToast({
        message: `Payout ${result.status}. Balance is not debited until processing completes.`,
        variant: 'success',
      });
      setAmountText('');
      attemptKey.current = null;
      void balanceQuery.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={balanceQuery.isFetching}
            onRefresh={() => {
              void balanceQuery.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Payout requests
        </Text>
        <Text variant="body" color={tokens.color.textSecondary}>
          Balance:{' '}
          {balance === null ? '—' : formatMoneyInr(balance)}. REQUESTED does not
          debit yet.
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — payout submit is blocked.
          </Text>
        ) : null}
        <TextInput
          label="Amount (INR)"
          accessibilityLabel="Payout amount"
          value={amountText}
          onChangeText={(value) => {
            setAmountText(value);
            attemptKey.current = null;
          }}
          keyboardType="decimal-pad"
          errorText={fieldError}
          editable={isConnected && !payoutState.isLoading}
        />
        <Button
          label="Submit payout request"
          accessibilityLabel="Submit payout request"
          loading={payoutState.isLoading}
          disabled={!isConnected}
          onPress={() => {
            void onSubmit();
          }}
          style={{ minHeight: 48 }}
        />
        <EmptyState
          title="Payout history unavailable"
          description="GET payout request history is an API gap (GAP-API-11). This screen supports create + balance only."
          accessibilityLabel="Payout history gap"
        />
        <Button
          label="Back to wallet"
          accessibilityLabel="Back to wallet"
          variant="secondary"
          onPress={() => navigation.navigate('Wallet')}
          style={{ minHeight: 48 }}
        />
        <Button
          label="Ledger"
          accessibilityLabel="Open ledger"
          variant="secondary"
          onPress={() => navigation.navigate('Ledger')}
          style={{ minHeight: 48 }}
        />
      </ScrollView>
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
