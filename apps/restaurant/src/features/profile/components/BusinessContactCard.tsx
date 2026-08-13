import React from 'react';
import { Pressable, View } from 'react-native';
import { Card, Text, useTheme } from 'foodie-shared-rn';
import type { BusinessContactDetails } from '../bankBusinessTypes';

interface Props {
  contact: BusinessContactDetails;
  onEdit: () => void;
}

const ACCENT_COLOR = '#F59E0B';

export function BusinessContactCard({ contact, onEdit }: Props) {
  const { tokens } = useTheme();

  const formattedAddress = [
    contact.registeredAddressLine1,
    contact.registeredAddressLine2,
    `${contact.city}, ${contact.state} - ${contact.pincode}`,
  ]
    .filter(Boolean)
    .join('\n');

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
            <Text style={{ fontSize: 20 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading2" style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}>
              Business Contact Details
            </Text>
            <Text variant="caption" style={{ color: '#64748B', fontSize: 12 }}>
              Official contact information & registered address
            </Text>
          </View>
        </View>
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
            Business Email
          </Text>
          <Text variant="body" style={{ color: '#0F172A', fontWeight: '600' }}>
            {contact.businessEmail || 'N/A'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            Business Phone
          </Text>
          <Text variant="body" style={{ color: '#0F172A', fontWeight: '600' }}>
            {contact.businessPhone || 'N/A'}
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            Registered Address
          </Text>
          <Text variant="body" style={{ color: '#0F172A', fontWeight: '500', lineHeight: 20 }}>
            {formattedAddress || 'N/A'}
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
        accessibilityLabel="Edit Business Contact Details"
      >
        <Text style={{ fontSize: 14 }}>✏️</Text>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
          Edit Business Contact
        </Text>
      </Pressable>
    </Card>
  );
}
