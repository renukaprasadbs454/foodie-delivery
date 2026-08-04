import React, { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
  Text,
  formatMoneyInr,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetWalletBalanceQuery } from '../../../api/endpoints/walletApi';
import { WalletSkeleton } from '../components/WalletSkeleton';
import { parseMoneyAmount } from '../types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Wallet'>;

/**
 * P2-DEL-04 — GET /wallet/balance (staleTime 0; always refetch on focus).
 */
export function WalletScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const balanceQuery = useGetWalletBalanceQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { refetch: refetchBalance } = balanceQuery;

  useFocusEffect(
    useCallback(() => {
      void refetchBalance();
    }, [refetchBalance]),
  );

  useEffect(() => {
    trackAnalyticsEvent('delivery_wallet_viewed');
    trackAnalyticsEvent('wallet_balance_viewed');
  }, []);

  const amount = parseMoneyAmount(balanceQuery.data?.balance);
  const loading = balanceQuery.isLoading && !balanceQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
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
          Wallet
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached balance. Do not treat as live money until
            reconnected.
          </Text>
        ) : null}
        {loading ? <WalletSkeleton /> : null}
        {!loading ? (
          <View
            style={{
              padding: tokens.spacing.md,
              borderWidth: 1,
              borderColor: tokens.color.border,
              borderRadius: tokens.radius.sm,
              backgroundColor: tokens.color.surface,
              gap: tokens.spacing.sm,
            }}
          >
            <Text variant="label" color={tokens.color.textSecondary}>
              Available balance
            </Text>
            <Text
              variant="heading1"
              accessibilityLabel={
                amount === null ? 'Balance unavailable' : formatMoneyInr(amount)
              }
            >
              {amount === null ? '—' : formatMoneyInr(amount)}
            </Text>
            {balanceQuery.isError ? (
              <Text variant="caption" color={tokens.color.error}>
                Could not refresh balance. Pull to retry.
              </Text>
            ) : null}
          </View>
        ) : null}
        <Button
          label="Ledger"
          accessibilityLabel="Open ledger"
          onPress={() => {
            trackAnalyticsEvent('open_ledger_tapped');
            navigation.navigate('Ledger');
          }}
          style={{ minHeight: 48 }}
        />
        <Button
          label="Request payout"
          accessibilityLabel="Open payout requests"
          variant="secondary"
          onPress={() => {
            trackAnalyticsEvent('open_payout_tapped');
            navigation.navigate('PayoutRequests');
          }}
          style={{ minHeight: 48 }}
        />
      </ScrollView>
    </View>
  );
}
