import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import { FontAwesome } from '@expo/vector-icons';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  label: string;
  accessibilityLabel: string;
  /** When false, display-only. */
  editable?: boolean;
};

export function StarRating({
  value,
  onChange,
  label,
  accessibilityLabel,
  editable = true,
}: Props) {
  const { tokens } = useTheme();

  return (
    <View style={{ gap: 8, marginVertical: 4 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#14532D' }}>{label}</Text>
      <View
        style={{ flexDirection: 'row', gap: 12 }}
        accessibilityLabel={accessibilityLabel}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = star <= value;
          return (
            <Pressable
              key={star}
              disabled={!editable || !onChange}
              onPress={() => onChange?.(star)}
              accessibilityRole={editable ? 'button' : 'text'}
              accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
              accessibilityState={{ selected }}
              style={{
                padding: 4,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: selected ? 1.1 : 1 }]
              }}
            >
              <FontAwesome
                name={selected ? 'star' : 'star-o'}
                size={38}
                color={selected ? '#FCD34D' : '#9CA3AF'}
                style={selected ? {
                  shadowColor: '#FCD34D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                } : undefined}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
