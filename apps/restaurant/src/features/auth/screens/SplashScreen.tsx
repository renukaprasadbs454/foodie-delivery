import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LoadingSpinner, Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-rn';

/**
 * P2-AUTH-02 Splash — cold-start while bootstrap resolves authStatus.
 */
export function SplashScreen() {
  const { tokens } = useTheme();

  useEffect(() => {
    trackAnalyticsEvent('restaurant_splash_viewed');
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
        Foodie Restaurant
      </Text>
      <LoadingSpinner accessibilityLabel="Restoring session" />
    </View>
  );
}
