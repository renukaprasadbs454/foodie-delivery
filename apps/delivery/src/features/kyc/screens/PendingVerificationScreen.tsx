import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
  clearRefreshToken,
} from 'foodie-shared-rn';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearIsNewUser } from '../../auth/authSlice';
import { baseApi } from '../../../api/baseApi';
import { useGetDeliveryProfileQuery } from '../../../api/endpoints/deliveryApi';
import { KycStepper } from '../components/KycStepper';
import {
  selectKycDocuments,
  selectUploadedDocCount,
} from '../kycFormSlice';
import type { KycStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<KycStackParamList, 'PendingVerification'>;

/**
 * P2-DEL-01 — Pending Verification Gate
 * Polls GET /delivery/me profile. Drops gate if VERIFIED.
 */
const THEME_EMERALD = '#14532D';

export function PendingVerificationScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const documents = useAppSelector(selectKycDocuments);
  const uploadedCount = useAppSelector(selectUploadedDocCount);
  const { data: profile, isLoading, isFetching, refetch, isError } = useGetDeliveryProfileQuery(
    undefined,
    { skip: !isConnected, pollingInterval: 15000 }
  );
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('delivery_pending_verification_viewed');
    trackAnalyticsEvent('delivery_kyc_pending');
  }, []);

  useEffect(() => {
    if (profile?.kycStatus === 'VERIFIED') {
      setToast({ message: 'KYC Verified! Taking you online...', variant: 'success' });
      setTimeout(() => {
        dispatch(clearIsNewUser());
      }, 1500);
    }
  }, [profile?.kycStatus, dispatch]);

  const onRefresh = () => {
    trackAnalyticsEvent('refresh_tapped');
    if (isConnected) {
      void refetch();
    }
  };

  const isRejected = profile?.kycStatus === 'REJECTED';

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 20,
          backgroundColor: THEME_EMERALD,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text variant="heading2" style={{ color: 'white' }}>Verification Status</Text>
        <Button
          label="LOGOUT"
          accessibilityLabel="Logout"
          variant="secondary"
          onPress={async () => {
            await clearRefreshToken();
            dispatch({ type: 'auth/clearCredentials' });
            dispatch(baseApi.util.resetApiState());
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading || isFetching} onRefresh={onRefresh} />}
      >
        <KycStepper activeIndex={1} />

        {(!isConnected || isError) && (
          <View style={{ backgroundColor: '#fffbeb', padding: 12, borderRadius: 8 }}>
            <Text variant="caption" color={tokens.color.warning} style={{ textAlign: 'center' }}>
              {!isConnected ? 'Offline — displaying local status.' : 'Network error — please swipe down to refresh.'}
            </Text>
          </View>
        )}

        <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, alignItems: 'center', marginTop: 12, elevation: 2, shadowColor: '#000', shadowOffset: { height: 2, width: 0 }, shadowRadius: 4, shadowOpacity: 0.05 }}>
          <Text variant="heading1" style={{ color: isRejected ? '#ef4444' : THEME_EMERALD, marginBottom: 8, fontSize: 48 }}>
            {isRejected ? '✖' : '🕒'}
          </Text>
          <Text variant="heading2" style={{ textAlign: 'center', color: '#1e293b', marginBottom: 12 }}>
            {isRejected ? "Verification Rejected" : "Review in Progress"}
          </Text>
          <Text variant="body" style={{ textAlign: 'center', color: '#64748b' }}>
            {isRejected
              ? 'Unfortunately, your KYC documents were rejected. Please review them and re-submit.'
              : 'Your documents have been securely uploaded and are waiting for an Admin to verify them. You will be able to start delivering as soon as approved!'}
          </Text>
        </View>

        {isRejected && (
          <Button
            label="Re-Upload Documents"
            accessibilityLabel="Re-Upload Documents"
            variant="primary"
            onPress={() => navigation.navigate('Kyc')}
          />
        )}

        <Button
          label="Go to Home Dashboard"
          accessibilityLabel="Go to Home Dashboard"
          variant={isRejected ? "secondary" : "primary"}
          onPress={() => navigation.navigate('DeliveryHome' as any)}
        />
      </ScrollView>
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </View >
  );
}
