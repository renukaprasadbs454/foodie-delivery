import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LoadingSpinner, Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-rn';

/**
 * P2-AUTH-01 Splash — UI-API Splash.
 * Shown while bootstrap resolves authStatus (no feature prefetch).
 */
export function SplashScreen() {
  const { tokens } = useTheme();

  useEffect(() => {
    trackAnalyticsEvent('customer_splash_viewed');
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.color.background,
        gap: tokens.spacing.lg,
        padding: tokens.spacing.xl,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Foodie
      </Text>
      <LoadingSpinner accessibilityLabel="Restoring session" />
    </View>
  );
}
