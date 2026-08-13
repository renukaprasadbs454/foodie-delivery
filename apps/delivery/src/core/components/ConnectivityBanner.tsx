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
        Cached data may be shown. OTP, assignment, and location-sync actions
        stay blocked until you are back online.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6b1f1f',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d48282',
  },
  title: {
    color: '#fff5f5',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#fff5f5',
    fontSize: 12,
    lineHeight: 18,
  },
});
