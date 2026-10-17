import React, { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { formatMoneyInr } from '@/utils/money';
import { trackAnalyticsEvent } from '@/utils/analytics';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useTheme } from '@/hooks/useTheme';
import { useGetWalletBalanceQuery } from '@/api/endpoints/walletApi';
import { useGetEarningsSummaryQuery } from '@/api/endpoints/incentivesApi';
import { WalletSkeleton } from '@/features/wallet/components/WalletSkeleton';
import { parseMoneyAmount } from '../types';
import type { MainStackParamList } from '@/navigation/types';
import { BottomNav } from '@/navigation/BottomNav';

type Props = NativeStackScreenProps<MainStackParamList, 'Wallet'>;

/**
 * P2-DEL-04 — GET /wallet/balance + Delivery & Incentive Earnings Breakdown.
 */
export function WalletScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const balanceQuery = useGetWalletBalanceQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const summaryQuery = useGetEarningsSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { refetch: refetchBalance } = balanceQuery;
  const { refetch: refetchSummary } = summaryQuery;
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      void refetchBalance();
      void refetchSummary();
    }, [refetchBalance, refetchSummary]),
  );

  useEffect(() => {
    trackAnalyticsEvent('delivery_wallet_viewed');
    trackAnalyticsEvent('wallet_balance_viewed');
  }, []);

  const amount = parseMoneyAmount(balanceQuery.data?.balance);
  const processingAmount = parseMoneyAmount(balanceQuery.data?.processingWithdrawals);
  const loading = balanceQuery.isLoading && !balanceQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* Decorative Dark Top Background Gradient */}
      <LinearGradient
        colors={['#0F3E22', '#14532D', '#1B6A3A']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 280,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 40, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={balanceQuery.isFetching || summaryQuery.isFetching}
            onRefresh={() => {
              void Promise.all([balanceQuery.refetch(), summaryQuery.refetch()]);
            }}
            tintColor="#FFF"
            colors={['#FCD34D']}
          />
        }
      >
        <View style={{ paddingTop: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </Pressable>
          <View>
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5, marginBottom: 2 }}>Earnings</Text>
            <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '600' }}>Manage deliveries, incentives & payouts</Text>
          </View>
        </View>

        {!isConnected ? (
          <View style={{
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(251, 191, 36, 0.3)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}>
            <Text style={{ color: '#FCD34D', fontSize: 13, fontWeight: '700' }}>
              Offline — showing cached balance. Reconnect for live money updates.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={{ marginTop: 24 }}><WalletSkeleton /></View>
        ) : null}

        {!loading ? (
          <LinearGradient
            colors={['#0F3E22', '#1B6A3A']}
            style={{
              borderRadius: 24,
              padding: 24,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: '#FCD34D',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(252, 211, 77, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Feather name="credit-card" size={18} color="#FCD34D" />
              </View>
              <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                Withdrawable Balance
              </Text>
            </View>

            <Text
              style={{ fontSize: 44, lineHeight: 52, paddingTop: 8, fontWeight: '900', color: '#FCD34D', marginBottom: processingAmount && processingAmount > 0 ? 8 : 12, includeFontPadding: true }}
              accessibilityLabel={amount === null ? 'Balance unavailable' : formatMoneyInr(amount)}
            >
              {amount === null ? '—' : formatMoneyInr(amount)}
            </Text>

            {processingAmount && processingAmount > 0 ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(252, 211, 77, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                alignSelf: 'flex-start',
                marginBottom: 8,
                borderWidth: 1,
                borderColor: 'rgba(252, 211, 77, 0.3)',
              }}>
                <Feather name="clock" size={13} color="#FCD34D" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FCD34D', fontSize: 13, fontWeight: '700' }}>
                  Processing Withdrawal: {formatMoneyInr(processingAmount)}
                </Text>
              </View>
            ) : null}

            {balanceQuery.isError ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' }}>
                <Feather name="alert-circle" size={13} color="#FCA5A5" />
                <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                  Could not refresh. Pull down to retry.
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        ) : null}

        {/* ── Separate Earnings Breakdown Section ── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="pie-chart" size={18} color="#14532D" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>Earnings Breakdown</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>Database Synced</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Regular Delivery Earnings */}
            <View style={{
              flex: 1,
              backgroundColor: '#F8FAFC',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 4 }}>Trip Earnings</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E293B' }}>
                ₹{Number(summaryQuery.data?.regularDeliveryEarnings ?? 0).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>From fulfilled deliveries</Text>
            </View>

            {/* Eligible Incentive Earnings */}
            <View style={{
              flex: 1,
              backgroundColor: '#F0FDF4',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: '#BBF7D0',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803D', marginBottom: 4 }}>Incentive Bonus</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#166534' }}>
                ₹{Number(summaryQuery.data?.incentiveEarnings ?? 0).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>Rewards & milestones</Text>
            </View>
          </View>
        </View>

        {/* ── Incentive Status Matrix ── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="award" size={18} color="#F59E0B" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>Incentive Status Matrix</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Incentives')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D' }}>View Offers</Text>
              <Feather name="chevron-right" size={14} color="#15803D" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#DCFCE7' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#166534' }}>Earned</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#15803D', marginTop: 2 }}>
                ₹{Number(summaryQuery.data?.earnedIncentives ?? 0).toFixed(2)}
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#92400E' }}>Pending</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#B45309', marginTop: 2 }}>
                ₹{Number(summaryQuery.data?.pendingIncentives ?? 0).toFixed(2)}
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center', padding: 10, backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>Paid Out</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#334155', marginTop: 2 }}>
                ₹{Number(summaryQuery.data?.paidOutIncentives ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 85,
              backgroundColor: '#1E1B4B',
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FCD34D',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
              opacity: pressed ? 0.9 : 1,
            })}
            onPress={() => {
              trackAnalyticsEvent('open_payout_tapped');
              navigation.navigate('PayoutRequests');
            }}
          >
            <Feather name="arrow-up-circle" size={22} color="#FCD34D" style={{ marginBottom: 6 }} />
            <Text style={{ color: '#FCD34D', fontSize: 14, fontWeight: '800' }}>Withdraw</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 85,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
              opacity: pressed ? 0.9 : 1,
            })}
            onPress={() => {
              trackAnalyticsEvent('open_offers_tapped');
              navigation.navigate('Incentives');
            }}
          >
            <Feather name="gift" size={22} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={{ color: '#1E293B', fontSize: 14, fontWeight: '800' }}>Offers</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 85,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
              opacity: pressed ? 0.9 : 1,
            })}
            onPress={() => {
              trackAnalyticsEvent('open_ledger_tapped');
              navigation.navigate('Ledger');
            }}
          >
            <Feather name="file-text" size={22} color="#14532D" style={{ marginBottom: 6 }} />
            <Text style={{ color: '#14532D', fontSize: 14, fontWeight: '800' }}>Ledger</Text>
          </Pressable>
        </View>

        {/* ── Recent Incentive Transactions ── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="list" size={18} color="#14532D" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>Incentive History</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Ledger')}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>Full Ledger</Text>
            </Pressable>
          </View>

          {summaryQuery.data?.recentIncentiveTransactions && summaryQuery.data.recentIncentiveTransactions.length > 0 ? (
            summaryQuery.data.recentIncentiveTransactions.slice(0, 5).map((tx) => (
              <View
                key={tx.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F1F5F9',
                }}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{tx.ruleTitle}</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {tx.periodDate} • {tx.referenceType}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
                  +₹{Number(tx.amount || 0).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Feather name="gift" size={24} color="#CBD5E1" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                Complete orders or reach daily milestones to earn extra bonuses!
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
      <BottomNav />
    </View>
  );
}
