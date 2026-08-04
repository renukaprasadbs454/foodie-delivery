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
} from 'foodie-shared-rn';
import { useAppSelector } from '../../../store/hooks';
import { KycStepper } from '../components/KycStepper';
import {
  selectKycDocuments,
  selectUploadedDocCount,
} from '../kycFormSlice';
import type { KycStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<KycStackParamList, 'PendingVerification'>;

/**
 * P2-DEL-01 — Pending Verification Gap shell (GAP-API-08).
 * No GET /delivery/me. Must not POST availability to infer KYC status.
 */
export function PendingVerificationScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const documents = useAppSelector(selectKycDocuments);
  const uploadedCount = useAppSelector(selectUploadedDocCount);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('delivery_pending_verification_viewed');
    trackAnalyticsEvent('delivery_kyc_pending');
  }, []);

  const onRefresh = () => {
    trackAnalyticsEvent('refresh_tapped');
    setRefreshing(true);
    setToast({
      message:
        'Partner KYC status cannot be refreshed yet. GET /delivery/me is an API gap (GAP-API-08). Re-login after admin verification.',
      variant: 'info',
    });
    setRefreshing(false);
  };

  const uploadedLabels = Object.keys(documents);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Pending verification
        </Text>
        <KycStepper activeIndex={1} />
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing pending state. Status cannot be checked without
            connectivity or partner profile API.
          </Text>
        ) : null}
        <EmptyState
          title="Waiting for KYC verification"
          description={
            uploadedCount > 0
              ? `Submitted locally this session: ${uploadedLabels.join(', ')}. Admin must verify. Availability stays disabled until kycStatus is VERIFIED. Partner status read is GAP-API-08.`
              : 'Submit documents on the KYC screen. Partner status read (GET /delivery/me) is an API gap — pull-to-refresh cannot confirm VERIFIED yet. Re-login after admin approval.'
          }
          accessibilityLabel="Pending KYC verification gap shell"
        />
        <Button
          label="Back to KYC uploads"
          accessibilityLabel="Back to KYC uploads"
          variant="secondary"
          onPress={() => navigation.navigate('Kyc')}
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
