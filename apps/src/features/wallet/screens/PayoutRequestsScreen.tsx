import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Toast } from '@/components/Toast';
import { createIdempotencyKey } from '@/utils/uuid';
import { formatMoneyInr } from '@/utils/money';
import { trackAnalyticsEvent } from '@/utils/analytics';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useTheme } from '@/hooks/useTheme';
import { useGetWalletBalanceQuery, useRequestPayoutMutation, useGetPayoutHistoryQuery } from '@/api/endpoints/walletApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { parseMoneyAmount, validatePayoutAmount, hasConfiguredBankDetails, getWithdrawalStatusInfo } from '../types';
import type { PayoutInfo, PayoutStatus } from '../types';
import type { MainStackParamList } from '@/navigation/types';
import { BottomNav } from '@/navigation/BottomNav';
import { useGetDeliveryBankDetailsQuery, useUpdateDeliveryBankDetailsMutation } from '@/api/endpoints/deliveryApi';

type Props = NativeStackScreenProps<MainStackParamList, 'PayoutRequests'>;

function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function maskAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return '•••• ----';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return `•••• ${clean}`;
  return `•••• ${clean.slice(-4)}`;
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
    pollingInterval: 10000,
  });
  const { data: savedBankDetails, refetch: refetchBankDetails } = useGetDeliveryBankDetailsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateBankDetails, { isLoading: isSavingBank }] = useUpdateDeliveryBankDetailsMutation();

  const isBankConfigured = hasConfiguredBankDetails(savedBankDetails);

  const { refetch: refetchBalance } = balanceQuery;
  const [requestPayout, payoutState] = useRequestPayoutMutation();
  const [amountText, setAmountText] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [bankError, setBankError] = useState<string | null>(null);
  const attemptKey = useRef<string | null>(null);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  // Bank Form State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankFormError, setBankFormError] = useState<string | null>(null);

  const openBankModal = () => {
    setBankHolderName(savedBankDetails?.accountHolderName || '');
    setBankName(savedBankDetails?.bankName || '');
    setBankAccountNumber(savedBankDetails?.accountNumber || '');
    setBankIfscCode(savedBankDetails?.ifscCode || '');
    setBankFormError(null);
    setBankError(null);
    setShowBankModal(true);
  };

  const handleSaveBankDetails = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to save bank details.',
        variant: 'warning',
      });
      return;
    }
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankIfscCode.trim()) {
      setBankFormError('Please fill in Bank Name, Account Number, and IFSC Code.');
      return;
    }
    setBankFormError(null);
    try {
      await updateBankDetails({
        accountHolderName: bankHolderName.trim() || savedBankDetails?.accountHolderName || 'Delivery Partner',
        bankName: bankName.trim(),
        accountNumber: bankAccountNumber.trim(),
        ifscCode: bankIfscCode.trim().toUpperCase(),
      }).unwrap();
      setShowBankModal(false);
      setBankError(null);
      setToast({
        message: 'Bank details updated successfully.',
        variant: 'success',
      });
      void refetchBankDetails();
    } catch (err: any) {
      setBankFormError(err?.data?.message || err?.message || 'Failed to save bank details.');
    }
  };

  const handleManualRefreshHistory = async () => {
    setIsRefreshingHistory(true);
    try {
      await historyQuery.refetch().unwrap();
    } catch {
      // handled by RTK
    } finally {
      setIsRefreshingHistory(false);
    }
  };

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
      void refetchBankDetails();
    }, [refetchBalance, historyQuery.refetch, refetchBankDetails]),
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

    if (!isBankConfigured) {
      setBankError('Please enter your bank details before requesting a withdrawal.');
      setToast({
        message: 'Please enter your bank details before requesting a withdrawal.',
        variant: 'error',
      });
      return;
    }
    setBankError(null);

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
        accountHolderName: savedBankDetails?.accountHolderName || '',
        accountNumber: savedBankDetails?.accountNumber || '',
        ifscCode: savedBankDetails?.ifscCode || '',
        bankName: savedBankDetails?.bankName || '',
        idempotencyKey: attemptKey.current,
      }).unwrap();
      trackAnalyticsEvent('payout_requested', {
        payoutId: result.payoutId,
        status: result.status,
      });
      setToast({
        message: `Withdrawal request for ${formatMoneyInr(validated.amount)} submitted successfully. Status: Pending.`,
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

  const historyList = historyQuery.data || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 90 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={balanceQuery.isFetching || historyQuery.isFetching}
            onRefresh={() => {
              void balanceQuery.refetch();
              void historyQuery.refetch();
              void refetchBankDetails();
            }}
            tintColor="#FFF"
            colors={['#FCD34D']}
          />
        }
      >
        {/* Decorative Dark Top Background Gradient placed inside ScrollView for full page unified scroll */}
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

        <View style={{ paddingTop: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}
          >
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

        {/* Missing Bank Details Warning Banner */}
        {bankError && !isBankConfigured && (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#F87171',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name="alert-circle" size={20} color="#DC2626" />
              <Text style={{ color: '#B91C1C', fontSize: 13, fontWeight: '700', flex: 1 }}>
                Please enter your bank details before requesting a withdrawal.
              </Text>
            </View>
            <Pressable
              onPress={openBankModal}
              accessibilityLabel="Add Bank Details"
              style={({ pressed }) => ({
                backgroundColor: '#DC2626',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>
                Add Bank Details
              </Text>
            </Pressable>
          </View>
        )}

        {/* Receiving Bank Details & Change / Add Bank Account */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 20,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
          borderWidth: 1,
          borderColor: bankError && !isBankConfigured ? '#F87171' : '#E2E8F0',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isBankConfigured ? 'rgba(20, 83, 45, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Feather name="credit-card" size={22} color={isBankConfigured ? '#14532D' : '#DC2626'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#718096', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Receiving Bank
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: isBankConfigured ? '#14532D' : '#DC2626', marginTop: 2 }} numberOfLines={1}>
                  {isBankConfigured ? savedBankDetails?.bankName : 'No Bank Configured'}
                </Text>
                {isBankConfigured ? (
                  <Text style={{ fontSize: 13, color: '#4A5568', fontWeight: '600', marginTop: 2 }}>
                    A/C: •••• {savedBankDetails?.accountNumber?.slice(-4)} {savedBankDetails?.ifscCode ? `(${savedBankDetails.ifscCode})` : ''}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600', marginTop: 2 }}>
                    Tap button to configure bank details
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={openBankModal}
              accessibilityLabel={isBankConfigured ? "Change Bank Account" : "Add Bank Details"}
              style={({ pressed }) => ({
                backgroundColor: isBankConfigured ? '#ECFDF5' : '#FEF2F2',
                borderWidth: 1,
                borderColor: isBankConfigured ? '#10B981' : '#EF4444',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: isBankConfigured ? '#047857' : '#DC2626', fontSize: 13, fontWeight: '800' }}>
                {isBankConfigured ? 'Change Bank Account' : 'Add Bank Details'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Amount to Withdraw Card */}
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
            accessibilityLabel="Submit withdrawal request"
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
                {payoutState.isLoading ? 'Submitting Request...' : 'Submit Request'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ---------------------------------------------------- */}
        {/* NEW CARD: Withdrawal History Card                    */}
        {/* ---------------------------------------------------- */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          padding: 22,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(20, 83, 45, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Feather name="clock" size={17} color="#14532D" />
                </View>
                <Text style={{ fontSize: 19, fontWeight: '900', color: '#14532D', letterSpacing: 0.2 }}>
                  Withdrawal History
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#718096', fontWeight: '500', marginTop: 3, marginLeft: 40 }}>
                Live status of all your submitted payout requests
              </Text>
            </View>

            <Pressable
              onPress={handleManualRefreshHistory}
              disabled={historyQuery.isFetching || isRefreshingHistory}
              accessibilityLabel="Refresh withdrawal history"
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pressed || historyQuery.isFetching ? 0.6 : 1,
              })}
            >
              {historyQuery.isFetching || isRefreshingHistory ? (
                <ActivityIndicator size="small" color="#14532D" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#14532D" />
              )}
            </Pressable>
          </View>

          {/* Body Content */}
          {historyQuery.isLoading ? (
            <View style={{ paddingVertical: 36, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color="#14532D" />
              <Text style={{ color: '#718096', fontSize: 14, fontWeight: '600' }}>
                Fetching withdrawal history...
              </Text>
            </View>
          ) : historyQuery.isError ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#FCA5A5',
              gap: 10,
            }}>
              <Feather name="alert-triangle" size={28} color="#DC2626" />
              <Text style={{ color: '#991B1B', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Failed to load withdrawal history.
              </Text>
              <Pressable
                onPress={handleManualRefreshHistory}
                style={{
                  backgroundColor: '#DC2626',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Retry</Text>
              </Pressable>
            </View>
          ) : historyList.length === 0 ? (
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              paddingVertical: 36,
              paddingHorizontal: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderStyle: 'dashed',
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#EDF2F7',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Feather name="file-minus" size={28} color="#A0AEC0" />
              </View>
              <Text style={{ color: '#2D3748', fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
                No withdrawal history available yet.
              </Text>
              <Text style={{ color: '#718096', fontSize: 12, textAlign: 'center', fontWeight: '500' }}>
                When you submit a withdrawal request, its details and live status will appear here.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {historyList.map((entry: PayoutInfo) => {
                const statusInfo = getWithdrawalStatusInfo(entry.status);
                const reqDate = entry.requestedDate || entry.date || (entry as any).createdAt;
                const updDate = entry.updatedAt || entry.processedDate || reqDate;
                const formattedReqDate = formatDateTime(reqDate);
                const formattedUpdDate = formatDateTime(updDate);
                const accountDisplay = entry.accountNumber
                  ? `${entry.bankName ? entry.bankName + ' • ' : ''}${maskAccountNumber(entry.accountNumber)}`
                  : isBankConfigured
                  ? `${savedBankDetails?.bankName ? savedBankDetails.bankName + ' • ' : ''}${maskAccountNumber(savedBankDetails?.accountNumber)}`
                  : 'Bank Account';
                const ifscDisplay = entry.ifscCode || savedBankDetails?.ifscCode;

                return (
                  <Pressable
                    key={entry.payoutId}
                    onPress={() => navigation.navigate('PayoutDetail', { payoutId: entry.payoutId })}
                    accessibilityLabel={`Withdrawal request ${entry.payoutId}`}
                    style={({ pressed }) => ({
                      backgroundColor: '#F8FAFC',
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    {/* Top Row: Amount + Status Badge */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#14532D', letterSpacing: 0.2 }}>
                        {formatMoneyInr(Number(entry.amount) || 0)}
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: statusInfo.bg,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: statusInfo.border,
                      }}>
                        <Feather name={statusInfo.icon} size={13} color={statusInfo.text} />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: statusInfo.text }}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    {/* Metadata Grid */}
                    <View style={{ gap: 6 }}>
                      {/* Request ID */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="hash" size={13} color="#718096" />
                        <Text style={{ fontSize: 12, color: '#718096', fontWeight: '600' }}>
                          Request ID:
                        </Text>
                        <Text style={{ fontSize: 12, color: '#2D3748', fontWeight: '700', flex: 1 }} numberOfLines={1}>
                          {entry.payoutId}
                        </Text>
                      </View>

                      {/* Bank Account */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="credit-card" size={13} color="#718096" />
                        <Text style={{ fontSize: 12, color: '#718096', fontWeight: '600' }}>
                          Bank:
                        </Text>
                        <Text style={{ fontSize: 12, color: '#2D3748', fontWeight: '700', flex: 1 }} numberOfLines={1}>
                          {accountDisplay} {ifscDisplay ? `(${ifscDisplay})` : ''}
                        </Text>
                      </View>

                      {/* Request Date & Time */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="calendar" size={13} color="#718096" />
                        <Text style={{ fontSize: 12, color: '#718096', fontWeight: '600' }}>
                          Requested:
                        </Text>
                        <Text style={{ fontSize: 12, color: '#4A5568', fontWeight: '600' }}>
                          {formattedReqDate}
                        </Text>
                      </View>

                      {/* Last Updated Date & Time */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="check-square" size={13} color="#718096" />
                        <Text style={{ fontSize: 12, color: '#718096', fontWeight: '600' }}>
                          Last Updated:
                        </Text>
                        <Text style={{ fontSize: 12, color: '#4A5568', fontWeight: '600' }}>
                          {formattedUpdDate}
                        </Text>
                      </View>
                    </View>

                    {/* Admin Rejection Remarks (if available) */}
                    {Boolean(entry.failureReason && (String(entry.status).toUpperCase() === 'REJECTED' || String(entry.status).toUpperCase() === 'FAILED')) && (
                      <View style={{
                        marginTop: 10,
                        backgroundColor: '#FEF2F2',
                        borderWidth: 1,
                        borderColor: '#FCA5A5',
                        borderRadius: 10,
                        padding: 10,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}>
                        <Feather name="alert-circle" size={15} color="#DC2626" style={{ marginTop: 1 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#991B1B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Rejection Reason
                          </Text>
                          <Text style={{ fontSize: 12, color: '#B91C1C', fontWeight: '600', marginTop: 2 }}>
                            {entry.failureReason}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* View Details Hint */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 4 }}>
                      <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>
                        View Receipt
                      </Text>
                      <Feather name="chevron-right" size={14} color="#10B981" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Navigation Buttons */}
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
            accessibilityLabel="View Ledger"
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
            accessibilityLabel="Back to Wallet"
          >
            <Feather name="arrow-left" size={18} color="#14532D" />
            <Text style={{ color: '#14532D', fontSize: 14, fontWeight: '700' }}>Back to Wallet</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Change Bank Account Modal Form */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSavingBank) setShowBankModal(false);
        }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => {
            if (!isSavingBank) setShowBankModal(false);
          }}
        >
          <Pressable
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 440,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#14532D' }}>
                Bank Account Details
              </Text>
              <Pressable
                onPress={() => setShowBankModal(false)}
                disabled={isSavingBank}
                accessibilityLabel="Close modal"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: '#F1F5F9',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name="x" size={18} color="#64748B" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Update your bank details for future payout transfers.
            </Text>

            {bankFormError && (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FCA5A5',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}>
                <Text style={{ color: '#B91C1C', fontSize: 13, fontWeight: '600' }}>
                  {bankFormError}
                </Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 380 }}>
              <View style={{ marginBottom: 14 }}>
                <TextInput
                  label="Account Holder Name"
                  accessibilityLabel="Account Holder Name"
                  value={bankHolderName}
                  onChangeText={setBankHolderName}
                  editable={!isSavingBank}
                  placeholder="e.g. Rahul Sharma"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <TextInput
                  label="Bank Name"
                  accessibilityLabel="Bank Name"
                  value={bankName}
                  onChangeText={setBankName}
                  editable={!isSavingBank}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <TextInput
                  label="Account Number"
                  accessibilityLabel="Account Number"
                  value={bankAccountNumber}
                  onChangeText={setBankAccountNumber}
                  keyboardType="number-pad"
                  editable={!isSavingBank}
                  placeholder="e.g. 1234567890"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <TextInput
                  label="IFSC Code"
                  accessibilityLabel="IFSC Code"
                  value={bankIfscCode}
                  onChangeText={setBankIfscCode}
                  autoCapitalize="characters"
                  editable={!isSavingBank}
                  placeholder="e.g. HDFC0001234"
                />
              </View>

              <Pressable
                disabled={isSavingBank}
                onPress={handleSaveBankDetails}
                accessibilityLabel="Save Bank Details"
                style={({ pressed }) => [
                  {
                    borderRadius: 16,
                    height: 52,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    opacity: pressed ? 0.9 : 1,
                    marginBottom: 8,
                  },
                  isSavingBank && { opacity: 0.7 },
                ]}
              >
                <LinearGradient
                  colors={['#14532D', '#1B6A3A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>
                    {isSavingBank ? 'Saving Details...' : 'Save Bank Details'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                disabled={isSavingBank}
                onPress={() => setShowBankModal(false)}
                accessibilityLabel="Cancel"
                style={{
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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
