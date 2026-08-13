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
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
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
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      setFieldError('Please fill in all bank details.');
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
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
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
      setAccountHolderName('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
      attemptKey.current = null;
      void balanceQuery.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topArch, { height: 180 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <Text style={styles.headerSubtitle}>Transfer earnings to your bank</Text>
        </View>

        {!isConnected && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Offline — payout submit is blocked.
            </Text>
          </View>
        )}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {balance === null ? '—' : formatMoneyInr(balance)}
          </Text>
          <Text style={styles.balanceSubtext}>
            Note: Requested amount does not debit until processed.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>Bank Details</Text>
          <View style={{ marginBottom: 12 }}>
            <TextInput
              label="Account Holder Name"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              editable={isConnected && !payoutState.isLoading}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <TextInput
              label="Account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              editable={isConnected && !payoutState.isLoading}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <TextInput
              label="IFSC Code"
              value={ifscCode}
              onChangeText={setIfscCode}
              autoCapitalize="characters"
              editable={isConnected && !payoutState.isLoading}
            />
          </View>
          <View style={{ marginBottom: 20 }}>
            <TextInput
              label="Bank Name"
              value={bankName}
              onChangeText={setBankName}
              editable={isConnected && !payoutState.isLoading}
            />
          </View>

          <Text style={styles.inputCardTitle}>Amount to Withdraw</Text>
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
            style={[styles.submitButton, (!isConnected || payoutState.isLoading) && styles.submitButtonDisabled]}
            onPress={() => {
              if (isConnected && !payoutState.isLoading) void onSubmit();
            }}
          >
            <Text style={styles.submitButtonText}>
              {payoutState.isLoading ? 'Processing...' : 'Submit Request'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Feather name="info" size={20} color="#F59E0B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payout history unavailable</Text>
            <Text style={styles.infoDesc}>
              GET payout request history is an API gap (GAP-API-11). This screen supports create + balance only.
            </Text>
          </View>
        </View>

        <View style={styles.bottomNavGroup}>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Ledger')}>
            <Feather name="file-text" size={18} color="#1A202C" />
            <Text style={styles.secondaryButtonText}>View Ledger</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Wallet')}>
            <Feather name="arrow-left" size={18} color="#1A202C" />
            <Text style={styles.secondaryButtonText}>Back to Wallet</Text>
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
    </SafeAreaView>
  );
}

import { StyleSheet, Pressable } from 'react-native';
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
    marginBottom: 24,
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  balanceCard: {
    backgroundColor: '#14532D',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#323438',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F59E0B',
    lineHeight: 40,
    marginBottom: 12,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 20,
  },
  bottomNavGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 52,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '700',
  },
});
