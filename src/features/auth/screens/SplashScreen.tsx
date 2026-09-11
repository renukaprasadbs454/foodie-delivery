import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Text } from '@/components/Text';
import { trackAnalyticsEvent } from '@/utils/analytics';
import { useTheme } from '@/hooks/useTheme';

/**
 * P2-AUTH-03 Splash — cold-start while bootstrap resolves authStatus.
 */
export function SplashScreen() {
  const { tokens } = useTheme();

  useEffect(() => {
    trackAnalyticsEvent('delivery_splash_viewed');
  }, []);

  return (
    <View
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.color.background,
        gap: tokens.spacing.lg,
        padding: tokens.spacing.xl,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Foodie Delivery
      </Text>
      <LoadingSpinner accessibilityLabel="Restoring session" />
    </View>
  );
}
