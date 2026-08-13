import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Card, Text, useTheme } from 'foodie-shared-rn';
import type { TaxAndLegalDetails } from '../bankBusinessTypes';
import { maskPanNumber } from '../bankBusinessStorage';

interface Props {
  taxLegal: TaxAndLegalDetails;
  onEdit: () => void;
}

const ACCENT_COLOR = '#F59E0B';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  PROPRIETORSHIP: 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership Firm',
  LLP: 'Limited Liability Partnership (LLP)',
  PRIVATE_LIMITED: 'Private Limited Company (Pvt Ltd)',
  OTHER: 'Other Legal Entity',
};

export function TaxLegalDetailsCard({ taxLegal, onEdit }: Props) {
  const { tokens } = useTheme();

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
            <Text style={{ fontSize: 20 }}>📜</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading2" style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}>
              Tax & Legal Information
            </Text>
            <Text variant="caption" style={{ color: '#64748B', fontSize: 12 }}>
              GSTIN, PAN, Business entity & FSSAI licenses
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
            Legal Business Name
          </Text>
          <Text variant="body" style={{ color: '#0F172A', fontWeight: '600' }}>
            {taxLegal.legalName || 'N/A'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            Business Type
          </Text>
          <Text variant="body" style={{ color: '#0F172A', fontWeight: '600' }}>
            {BUSINESS_TYPE_LABELS[taxLegal.businessType] || taxLegal.businessType || 'Private Limited'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            GSTIN
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body" style={{ color: '#0F172A', fontWeight: '700' }}>
              {taxLegal.gstin || 'N/A'}
            </Text>
            <Badge
              label={taxLegal.gstinVerificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
              tone={taxLegal.gstinVerificationStatus === 'VERIFIED' ? 'success' : 'warning'}
              accessibilityLabel={`GSTIN ${taxLegal.gstinVerificationStatus === 'VERIFIED' ? 'verified' : 'pending'}`}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            PAN Number
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body" style={{ color: '#0F172A', fontWeight: '700' }}>
              {maskPanNumber(taxLegal.panNumber)}
            </Text>
            <Badge
              label={taxLegal.panVerificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
              tone={taxLegal.panVerificationStatus === 'VERIFIED' ? 'success' : 'warning'}
              accessibilityLabel={`PAN ${taxLegal.panVerificationStatus === 'VERIFIED' ? 'verified' : 'pending'}`}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            FSSAI License
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body" style={{ color: '#0F172A', fontWeight: '600' }}>
              {taxLegal.fssaiLicenseNumber || 'N/A'}
            </Text>
            <Badge
              label={taxLegal.fssaiVerificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
              tone={taxLegal.fssaiVerificationStatus === 'VERIFIED' ? 'success' : 'warning'}
              accessibilityLabel={`FSSAI ${taxLegal.fssaiVerificationStatus === 'VERIFIED' ? 'verified' : 'pending'}`}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" style={{ color: '#64748B' }}>
            FSSAI License Expiry
          </Text>
          <Text variant="body" style={{ color: '#0F172A', fontWeight: '600' }}>
            {taxLegal.fssaiExpiryDate || 'N/A'}
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
        accessibilityLabel="Edit Tax and Legal Identification"
      >
        <Text style={{ fontSize: 14 }}>✏️</Text>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
          Edit Tax & Legal Details
        </Text>
      </Pressable>
    </Card>
  );
}
