import React from 'react';
import { View } from 'react-native';
import { EmptyState, useTheme } from 'foodie-shared-rn';

/**
 * Non-business placeholder for navigator registration in Phase 1.
 * Feature screens replace these in Phase 2 — no domain UI here.
 */
export function FoundationPlaceholderScreen({ title }: { title: string }) {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        justifyContent: 'center',
      }}
    >
      <EmptyState
        title={title}
        description="Foundation scaffold only. Feature UI is Phase 2."
        accessibilityLabel={`${title} foundation placeholder`}
      />
    </View>
  );
}
