import React, { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, View, Pressable } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      {/* Decorative Dark Top Background */}
      <View style={[styles.topArch, { height: 160 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={balanceQuery.isFetching}
            onRefresh={() => {
              void balanceQuery.refetch();
            }}
            tintColor="#FFF"
            colors={['#F59E0B']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payouts</Text>
          <Text style={styles.headerSubtitle}>Manage your earnings securely</Text>
        </View>

        {!isConnected ? (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Offline — showing cached balance. Reconnect for live money updates.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={{ marginTop: 24 }}><WalletSkeleton /></View>
        ) : null}

        {!loading ? (
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.walletIconCircle}>
                <Feather name="briefcase" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text
              style={styles.balanceAmount}
              accessibilityLabel={
                amount === null ? 'Balance unavailable' : formatMoneyInr(amount)
              }
            >
              {amount === null ? '—' : formatMoneyInr(amount)}
            </Text>
            {balanceQuery.isError ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#E23744" />
                <Text style={styles.errorText}>
                  Could not refresh. Pull down to retry.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actionGrid}>
          <Pressable
            style={styles.actionButtonPrimary}
            onPress={() => {
              trackAnalyticsEvent('open_payout_tapped');
              navigation.navigate('PayoutRequests');
            }}
          >
            <Feather name="arrow-up-circle" size={24} color="#FFF" style={{ marginBottom: 8 }} />
            <Text style={styles.actionButtonPrimaryText}>Withdraw</Text>
          </Pressable>

          <Pressable
            style={styles.actionButtonSecondary}
            onPress={() => {
              trackAnalyticsEvent('open_ledger_tapped');
              navigation.navigate('Ledger');
            }}
          >
            <Feather name="file-text" size={24} color="#1A202C" style={{ marginBottom: 8 }} />
            <Text style={styles.actionButtonSecondaryText}>Ledger</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#14532D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#eab308',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#14532D',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#323438',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F59E0B',
    lineHeight: 40,
    marginBottom: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(226, 55, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  errorText: {
    color: '#E23744',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonSecondaryText: {
    color: '#1A202C',
    fontSize: 16,
    fontWeight: '700',
  },
});
