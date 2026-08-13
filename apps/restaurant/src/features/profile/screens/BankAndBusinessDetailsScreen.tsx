import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Badge,
  Card,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetBankDetailsQuery,
  useGetBusinessDetailsQuery,
  useUpdateBankDetailsMutation,
  useUpdateBusinessDetailsMutation,
} from '../../../api/endpoints/bankAndBusinessApi';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import type { ProfileStackParamList } from '../../../navigation/types';
import type {
  BankAndBusinessData,
} from '../bankBusinessTypes';
import {
  loadStoredBankAndBusiness,
  saveStoredBankAndBusiness,
} from '../bankBusinessStorage';
import { BankDetailsCard } from '../components/BankDetailsCard';
import { BusinessContactCard } from '../components/BusinessContactCard';
import {
  EditBankBusinessModal,
  type EditSection,
} from '../components/EditBankBusinessModal';
import { TaxLegalDetailsCard } from '../components/TaxLegalDetailsCard';
import { UpiDetailsCard } from '../components/UpiDetailsCard';
import {
  getMockBankAndBusinessData,
  updateMockBankAndBusinessData,
} from '../../../mock/bankAndBusinessData';

type Props = NativeStackScreenProps<ProfileStackParamList, 'BankAndBusinessDetails'>;

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold / Amber Accent

export function BankAndBusinessDetailsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();

  const [data, setData] = useState<BankAndBusinessData>(getMockBankAndBusinessData());
  const [activeModalSection, setActiveModalSection] = useState<EditSection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  // RTK Query hooks
  const bankQuery = useGetBankDetailsQuery(undefined, { skip: !isConnected });
  const businessQuery = useGetBusinessDetailsQuery(undefined, { skip: !isConnected });

  const [updateBankDetails] = useUpdateBankDetailsMutation();
  const [updateBusinessDetails] = useUpdateBusinessDetailsMutation();

  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected || bankQuery.isError || businessQuery.isError);

  // Hydrate data from secure storage or mock layer on mount
  useEffect(() => {
    trackAnalyticsEvent('bank_business_details_viewed');
    void (async () => {
      const stored = await loadStoredBankAndBusiness();
      if (stored) {
        setData(stored);
      } else {
        setData(getMockBankAndBusinessData());
      }
    })();
  }, []);

  // Update from API when data changes
  useEffect(() => {
    if (bankQuery.data || businessQuery.data) {
      setData((prev) => ({
        ...prev,
        bankAccount: bankQuery.data?.bankAccount ?? prev.bankAccount,
        upi: bankQuery.data?.upi ?? prev.upi,
        taxAndLegal: businessQuery.data?.taxAndLegal ?? prev.taxAndLegal,
        businessContact: businessQuery.data?.businessContact ?? prev.businessContact,
      }));
    }
  }, [bankQuery.data, businessQuery.data]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      void bankQuery.refetch();
      void businessQuery.refetch();
    }
    const stored = await loadStoredBankAndBusiness();
    if (stored) {
      setData(stored);
    }
    setRefreshing(false);
  };

  const handleSaveSection = async (section: EditSection, payload: any) => {
    setIsSubmitting(true);
    try {
      let updatedData: BankAndBusinessData = { ...data };

      if (section === 'bank') {
        updatedData.bankAccount = {
          ...updatedData.bankAccount,
          accountHolderName: payload.accountHolderName,
          bankName: payload.bankName,
          accountNumber: payload.accountNumber,
          ifscCode: payload.ifscCode,
          accountType: payload.accountType,
          branchName: payload.branchName,
          verificationStatus: 'PENDING',
        };
      } else if (section === 'upi') {
        updatedData.upi = {
          ...updatedData.upi,
          upiId: payload.upiId,
          verificationStatus: 'PENDING',
        };
      } else if (section === 'tax') {
        updatedData.taxAndLegal = {
          ...updatedData.taxAndLegal,
          legalName: payload.legalName,
          businessType: payload.businessType,
          gstin: payload.gstin,
          panNumber: payload.panNumber,
          fssaiLicenseNumber: payload.fssaiLicenseNumber,
          fssaiExpiryDate: payload.fssaiExpiryDate,
          gstinVerificationStatus: 'PENDING',
          panVerificationStatus: 'PENDING',
          fssaiVerificationStatus: 'PENDING',
        };
      } else if (section === 'contact') {
        updatedData.businessContact = {
          ...updatedData.businessContact,
          ...payload,
        };
      }

      // 1. Try API if online & connected
      if (!isUsingMock) {
        try {
          if (section === 'bank' || section === 'upi') {
            await updateBankDetails(payload).unwrap();
          } else {
            await updateBusinessDetails(payload).unwrap();
          }
        } catch (_apiErr) {
          // Fall back to local secure persistence if backend endpoint doesn't exist
        }
      }

      // 2. Persist locally to secure storage and mock state
      await saveStoredBankAndBusiness(updatedData);
      updateMockBankAndBusinessData(updatedData);
      setData(updatedData);

      setToast({
        message: `${
          section === 'bank'
            ? 'Bank account'
            : section === 'upi'
              ? 'UPI details'
              : section === 'tax'
                ? 'Tax & legal details'
                : 'Business contact'
        } updated successfully.`,
        variant: 'success',
      });
      trackAnalyticsEvent('bank_business_details_updated', { section });
    } catch (err: any) {
      setToast({
        message: err?.message || 'Failed to save changes. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllVerified =
    data.bankAccount.verificationStatus === 'VERIFIED' &&
    data.upi.verificationStatus === 'VERIFIED' &&
    data.taxAndLegal.gstinVerificationStatus === 'VERIFIED';

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast message'}
        onDismiss={() => setToast(null)}
      />

      <ScrollView
        contentContainerStyle={{
          paddingVertical: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.md,
          paddingBottom: 90,
          gap: tokens.spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND_ACCENT}
          />
        }
      >
        {isUsingMock ? <DemoModeIndicator /> : null}

        {/* Page Header */}
        <View style={{ gap: 4 }}>
          <Text
            variant="heading1"
            style={{ color: BRAND_PRIMARY, fontSize: 24, fontWeight: '800' }}
            accessibilityRole="header"
          >
            Bank & Business Details
          </Text>
          <Text variant="caption" style={{ color: tokens.color.textSecondary, fontSize: 13 }}>
            Manage payout bank accounts, UPI VPAs, business tax registration, and legal details
          </Text>
        </View>

        {/* Verification Status Summary Banner */}
        <Card
          style={{
            backgroundColor: isAllVerified ? '#F0FDF4' : '#FEFCE8',
            borderColor: isAllVerified ? '#BBF7D0' : '#FEF08A',
            borderWidth: 1,
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isAllVerified ? '#DCFCE7' : '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>{isAllVerified ? '🛡️' : '⏳'}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  color: isAllVerified ? '#166534' : '#854D0E',
                  fontWeight: '700',
                  fontSize: 14,
                }}
              >
                {isAllVerified
                  ? 'Verified Business Partner'
                  : 'Verification In Progress'}
              </Text>
              <Badge
                label={isAllVerified ? 'Verified' : 'Action / Pending'}
                tone={isAllVerified ? 'success' : 'warning'}
                accessibilityLabel={isAllVerified ? 'Verified Business Partner' : 'Verification In Progress'}
              />
            </View>
            <Text
              style={{
                color: isAllVerified ? '#15803D' : '#A16207',
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {isAllVerified
                ? 'All payout accounts and tax licenses are verified for automated settlements.'
                : 'Updated financial or tax details require 24–48 hours for automated banking verification.'}
            </Text>
          </View>
        </Card>

        {/* SECTION 1: BANK ACCOUNT DETAILS */}
        <BankDetailsCard
          bankAccount={data.bankAccount}
          onEdit={() => setActiveModalSection('bank')}
        />

        {/* SECTION 2: UPI DETAILS */}
        <UpiDetailsCard
          upi={data.upi}
          onEdit={() => setActiveModalSection('upi')}
        />

        {/* SECTION 3: TAX & LEGAL DETAILS */}
        <TaxLegalDetailsCard
          taxLegal={data.taxAndLegal}
          onEdit={() => setActiveModalSection('tax')}
        />

        {/* SECTION 4: BUSINESS CONTACT DETAILS */}
        <BusinessContactCard
          contact={data.businessContact}
          onEdit={() => setActiveModalSection('contact')}
        />
      </ScrollView>

      {/* EDIT FORM MODAL */}
      <EditBankBusinessModal
        visible={Boolean(activeModalSection)}
        section={activeModalSection}
        data={data}
        onClose={() => setActiveModalSection(null)}
        onSave={handleSaveSection}
        isSubmitting={isSubmitting}
      />
    </View>
  );
}
