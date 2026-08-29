import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../../store/hooks';
import { selectIsConnected } from '../../store/connectivitySlice';

/**
 * P2-XAP-02 shell-level offline banner.
 * Screen-level guards still own feature-specific mutation blocking.
 */
export function ConnectivityBanner() {
  const isConnected = useAppSelector(selectIsConnected);
  const insets = useSafeAreaInsets();

  if (isConnected) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text accessibilityRole="alert" style={styles.title}>
        Offline mode
      </Text>
      <Text style={styles.message}>
        Cached data may be shown. Checkout, payment, and OTP actions stay
        blocked until you are back online.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7a2812',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d97757',
  },
  title: {
    color: '#fff4ee',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#fff4ee',
    fontSize: 12,
    lineHeight: 18,
  },
});
