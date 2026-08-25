import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
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
  useGetPayoutHistoryQuery,
} from '../../../api/endpoints/walletApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { parseMoneyAmount, validatePayoutAmount } from '../types';
import type { PayoutInfo, PayoutStatus } from '../types';
import type { MainStackParamList } from '../../../navigation/types';
import { BottomNav } from '../../../navigation/BottomNav';

type Props = NativeStackScreenProps<MainStackParamList, 'PayoutRequests'>;

/**
 * P2-DEL-04 — POST /wallet/payout-requests + balance.
 * History list is GAP-API-11 — create + balance only (Partial shell).
 * Offline payout blocked. Idempotency-Key per attempt.
 */
function formatDate(isoString?: string): string {
  if (!isoString) return 'Pending';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getStatusColor(status: PayoutStatus) {
  switch (status) {
    case 'SUCCESS':
      return { text: '#10B981', bg: '#D1FAE5', icon: 'check-circle' };
    case 'FAILED':
      return { text: '#EF4444', bg: '#FEE2E2', icon: 'x-circle' };
    case 'PROCESSING':
      return { text: '#F59E0B', bg: '#FEF3C7', icon: 'clock' };
    case 'REQUESTED':
    default:
      return { text: '#3B82F6', bg: '#DBEAFE', icon: 'arrow-up-circle' };
  }
}

export function PayoutRequestsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const balanceQuery = useGetWalletBalanceQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const historyQuery = useGetPayoutHistoryQuery(undefined, {
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
      void historyQuery.refetch();
    }, [refetchBalance, historyQuery.refetch]),
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
        accountHolderName: 'Saved in Profile',
        accountNumber: '****',
        ifscCode: '****',
        bankName: 'Saved in Profile',
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
      void historyQuery.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 80, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={balanceQuery.isFetching || historyQuery.isFetching}
            onRefresh={() => {
              void balanceQuery.refetch();
              void historyQuery.refetch();
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
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5, marginBottom: 2 }}>Withdraw</Text>
            <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '600' }}>Transfer earnings</Text>
          </View>
        </View>

        {!isConnected && (
          <View style={{
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#F87171',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}>
            <Text style={{ color: '#B91C1C', fontSize: 14, fontWeight: '700', lineHeight: 20 }}>
              Offline — payout submit is blocked.
            </Text>
          </View>
        )}

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
          <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Available Balance
          </Text>
          <Text style={{ fontSize: 44, lineHeight: 52, paddingTop: 8, fontWeight: '900', color: '#FCD34D', marginBottom: 12, includeFontPadding: true }}>
            {balance === null ? '—' : formatMoneyInr(balance)}
          </Text>
          <Text style={{ fontSize: 12, color: '#A7F3D0', opacity: 0.8, fontWeight: '500' }}>
            Note: Requested amount does not debit until processed.
          </Text>
        </LinearGradient>

        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          padding: 24,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}>

          <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532D', marginBottom: 16 }}>Amount to Withdraw</Text>
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

          <Pressable
            disabled={!isConnected || payoutState.isLoading}
            onPress={() => {
              if (isConnected && !payoutState.isLoading) void onSubmit();
            }}
            style={({ pressed }) => [
              {
                borderRadius: 16,
                height: 56,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 24,
                overflow: 'hidden',
                opacity: pressed ? 0.9 : 1,
              },
              (!isConnected || payoutState.isLoading) && { opacity: 0.6 }
            ]}
          >
            <LinearGradient
              colors={(!isConnected || payoutState.isLoading) ? ['#CBD5E0', '#CBD5E0'] : ['#FCD34D', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: (!isConnected || payoutState.isLoading) ? '#718096' : '#0F3E22', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                {payoutState.isLoading ? 'Processing...' : 'Submit Request'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 16 }}>Recent Payouts</Text>

        {historyQuery.isLoading ? (
          <Text style={{ color: '#718096', marginBottom: 24, textAlign: 'center' }}>Loading payouts...</Text>
        ) : historyQuery.data && historyQuery.data.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            {historyQuery.data.slice(0, 5).map((entry: PayoutInfo) => {
              const statusInfo = getStatusColor(entry.status);
              const displayDate = entry.requestedDate || entry.date || new Date().toISOString();
              return (
                <Pressable
                  key={entry.payoutId}
                  style={({ pressed }) => ([
                    {
                      flexDirection: 'row',
                      backgroundColor: '#FFF',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    },
                    pressed && { opacity: 0.8 }
                  ])}
                  onPress={() => navigation.navigate('PayoutDetail', { payoutId: entry.payoutId })}
                >
                  <View style={[{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 }, { backgroundColor: statusInfo.bg }]}>
                    <Feather name={statusInfo.icon as any} size={20} color={statusInfo.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 4 }}>{formatMoneyInr(Number(entry.amount) || 0)}</Text>
                    <Text style={{ fontSize: 13, color: '#718096', marginBottom: 4 }}>
                      {formatDate(displayDate)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#A0AEC0' }}>
                      ID: {entry.payoutId.slice(-8).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }, { color: statusInfo.text }]}>
                        {entry.status}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#A0AEC0" style={{ marginTop: 8 }} />
                  </View>
                </Pressable>
              );
            })}
            {historyQuery.data.length > 5 && (
              <Pressable onPress={() => navigation.navigate('PayoutHistory')} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: '#10B981', fontWeight: '700' }}>View All Payouts</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Feather name="file-minus" size={32} color="#CBD5E0" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#4A5568', fontWeight: '600' }}>No Payouts Yet</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 16,
              height: 52,
              gap: 8,
              opacity: pressed ? 0.9 : 1,
            })}
            onPress={() => navigation.navigate('Ledger')}
          >
            <Feather name="file-text" size={18} color="#14532D" />
            <Text style={{ color: '#14532D', fontSize: 14, fontWeight: '700' }}>View Ledger</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 16,
              height: 52,
              gap: 8,
              opacity: pressed ? 0.9 : 1,
            })}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Feather name="arrow-left" size={18} color="#14532D" />
            <Text style={{ color: '#14532D', fontSize: 14, fontWeight: '700' }}>Back to Wallet</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
      <BottomNav />
    </View>
  );
}
