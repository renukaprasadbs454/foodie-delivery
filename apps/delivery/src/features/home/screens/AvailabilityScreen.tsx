import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useSetAvailabilityMutation } from '../../../api/endpoints/deliveryApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectIsOnline,
  setIsOnline,
} from '../availabilitySlice';
import { ensureBackgroundLocationForOnline } from '../locationPermission';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Availability'>;

/**
 * P2-DEL-02 — POST /delivery/availability.
 * Offline toggle blocked. Background location hard gate on go-online only.
 * kycStatus not readable (GAP-API-08) — server KYC_NOT_VERIFIED is backstop.
 */
export function AvailabilityScreen(_props: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const [setAvailability, mutation] = useSetAvailabilityMutation();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('delivery_availability_viewed');
  }, []);

  const applyAvailability = async (nextOnline: boolean) => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to change availability.',
        variant: 'warning',
      });
      return;
    }

    if (nextOnline) {
      trackAnalyticsEvent('go_online_tapped');
      const gate = await ensureBackgroundLocationForOnline();
      if (!gate.ok) {
        setToast({ message: gate.message, variant: 'warning' });
        return;
      }
    } else {
      trackAnalyticsEvent('go_offline_tapped');
    }

    const previous = isOnline;
    dispatch(setIsOnline(nextOnline));
    try {
      const result = await setAvailability({ isOnline: nextOnline }).unwrap();
      dispatch(setIsOnline(Boolean(result.isOnline)));
      trackAnalyticsEvent('delivery_availability_changed', {
        isOnline: Boolean(result.isOnline),
      });
      setToast({
        message: result.isOnline ? 'You are online.' : 'You are offline.',
        variant: 'success',
      });
    } catch (error) {
      dispatch(setIsOnline(previous));
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
      >
        <Text variant="heading1" accessibilityRole="header">
          Availability
        </Text>
        <Text variant="body" color={tokens.color.textSecondary}>
          Status: {isOnline ? 'Online' : 'Offline'}. Background location is
          required to go online. Partner kycStatus is not readable yet
          (GAP-API-08) — the server returns KYC_NOT_VERIFIED if verification is
          incomplete.
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — availability toggle is blocked.
          </Text>
        ) : null}
        <Button
          label={isOnline ? 'Go offline' : 'Go online'}
          accessibilityLabel={isOnline ? 'Go offline' : 'Go online'}
          accessibilityRole="switch"
          accessibilityState={{
            checked: isOnline,
            disabled: !isConnected,
          }}
          accessibilityHint={
            isOnline
              ? 'Takes you offline and stops receiving offers'
              : 'Requires internet and background location permission'
          }
          loading={mutation.isLoading}
          disabled={!isConnected}
          onPress={() => {
            void applyAvailability(!isOnline);
          }}
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
