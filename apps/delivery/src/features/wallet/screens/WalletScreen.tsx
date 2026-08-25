import React, { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
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
import { BottomNav } from '../../../navigation/BottomNav';

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
  const insets = useSafeAreaInsets();

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
            refreshing={balanceQuery.isFetching}
            onRefresh={() => {
              void balanceQuery.refetch();
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
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5, marginBottom: 2 }}>Payouts</Text>
            <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '600' }}>Manage your earnings securely</Text>
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
              marginBottom: 24,
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
                Available Balance
              </Text>
            </View>

            <Text
              style={{ fontSize: 44, lineHeight: 52, paddingTop: 8, fontWeight: '900', color: '#FCD34D', marginBottom: 12, includeFontPadding: true }}
              accessibilityLabel={amount === null ? 'Balance unavailable' : formatMoneyInr(amount)}
            >
              {amount === null ? '—' : formatMoneyInr(amount)}
            </Text>

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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 90,
              backgroundColor: '#1E1B4B',
              borderRadius: 20,
              paddingVertical: 20,
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
            <Feather name="arrow-up-circle" size={24} color="#FCD34D" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#FCD34D', fontSize: 15, fontWeight: '800' }}>Withdraw</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 90,
              backgroundColor: '#FFFBEB',
              borderRadius: 20,
              paddingVertical: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#FDE68A',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
              opacity: pressed ? 0.9 : 1,
            })}
            onPress={() => {
              trackAnalyticsEvent('open_cod_deposit_tapped');
              navigation.navigate('CashDeposit' as any);
            }}
          >
            <Feather name="package" size={24} color="#D97706" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#D97706', fontSize: 15, fontWeight: '800' }}>COD Deposit</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 90,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              paddingVertical: 20,
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
            <Feather name="file-text" size={24} color="#14532D" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#14532D', fontSize: 15, fontWeight: '800' }}>Ledger</Text>
          </Pressable>
        </View>

      </ScrollView>
      <BottomNav />
    </View>
  );
}
