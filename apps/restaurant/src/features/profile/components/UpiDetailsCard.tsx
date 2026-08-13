import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Card, Text, useTheme } from 'foodie-shared-rn';
import type { UpiDetails } from '../bankBusinessTypes';

interface Props {
  upi: UpiDetails;
  onEdit: () => void;
}

const ACCENT_COLOR = '#F59E0B';

export function UpiDetailsCard({ upi, onEdit }: Props) {
  const { tokens } = useTheme();
  const isVerified = upi.verificationStatus === 'VERIFIED';

  return (
    <Card
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: tokens.spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        gap: tokens.spacing.md,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading2" style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}>
              UPI Payout Details
            </Text>
            <Text variant="caption" style={{ color: '#64748B', fontSize: 12 }}>
              Virtual Payment Address (VPA) for quick payouts
            </Text>
          </View>
        </View>

        {/* Verification Status */}
        <Badge
          label={isVerified ? 'Verified' : 'Pending Verification'}
          tone={isVerified ? 'success' : 'warning'}
          accessibilityLabel={isVerified ? 'UPI verified' : 'UPI pending verification'}
        />
      </View>

      {/* Info List */}
      <View
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          padding: tokens.spacing.md,
          gap: 12,
          borderWidth: 1,
          borderColor: '#F1F5F9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            UPI ID
          </Text>
          <Text
            variant="body"
            style={{ color: '#0F172A', fontWeight: '700', fontSize: 15 }}
          >
            {upi.upiId || 'Not set'}
          </Text>
        </View>
      </View>

      {/* Edit Trigger */}
      <Pressable
        onPress={onEdit}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#D97706' : ACCENT_COLOR,
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        })}
        accessibilityRole="button"
        accessibilityLabel="Edit UPI Payout Details"
      >
        <Text style={{ fontSize: 14 }}>✏️</Text>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
          Edit UPI Details
        </Text>
      </Pressable>
    </Card>
  );
}
