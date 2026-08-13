import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import { MOCK_CONFIG } from '../config/mockConfig';

type Props = {
  isMockActive?: boolean;
};

export function DemoModeIndicator({ isMockActive = true }: Props) {
  const { tokens } = useTheme();

  if (!MOCK_CONFIG.SHOW_MOCK_INDICATOR || !isMockActive) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FEF3C7', // Soft warm yellow
        borderWidth: 1,
        borderColor: '#F59E0B',    // Accent Orange/Gold
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        gap: 4,
      }}
      accessibilityRole="text"
      accessibilityLabel="Demo mode indicator active"
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#D97706',
        }}
      />
      <Text
        variant="caption"
        style={{
          color: '#92400E',
          fontWeight: '700',
          fontSize: 10,
          letterSpacing: 0.5,
        }}
      >
        DEMO MODE
      </Text>
    </View>
  );
}
