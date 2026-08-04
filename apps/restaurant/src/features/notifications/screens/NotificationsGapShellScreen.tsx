import React, { useEffect } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useTheme,
} from 'foodie-shared-rn';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  ProfileStackParamList,
  'NotificationsHome'
>;

/**
 * P2-RES-05 Gap-blocked deep-link target for `/notifications`.
 * UI-API has no Restaurant Notifications screen (GAP-IA-02) — escalate to
 * Architect/EM for amendment. Do not invent an inbox list here.
 */
export function NotificationsGapShellScreen({ navigation }: Props) {
  const { tokens } = useTheme();

  useEffect(() => {
    trackAnalyticsEvent('restaurant_notifications_gap_viewed', {
      gap: 'GAP-IA-02',
    });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.xl,
        justifyContent: 'center',
        gap: tokens.spacing.md,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Notifications
      </Text>
      <EmptyState
        title="Inbox not available in V1"
        description="Restaurant App has no dedicated Notifications screen in the frozen UI-API (GAP-IA-02). Escalated for IA amendment. Use Settings for the unread badge and local push preference."
        accessibilityLabel="Notifications IA gap"
      />
      <Button
        label="Open settings"
        accessibilityLabel="Open settings"
        onPress={() => navigation.navigate('RestaurantSettings')}
      />
      <Button
        label="Back to profile"
        accessibilityLabel="Back to profile"
        variant="secondary"
        onPress={() => navigation.navigate('RestaurantProfile')}
      />
    </View>
  );
}
