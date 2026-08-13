import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Button, Text, TextInput, useTheme } from 'foodie-shared-rn';
import type {
  AccountType,
  BankAndBusinessData,
  BusinessType,
} from '../bankBusinessTypes';
import {
  validateBankAccountForm,
  validateBusinessContactForm,
  validateTaxLegalForm,
  validateUpiForm,
} from '../bankBusinessTypes';

export type EditSection = 'bank' | 'upi' | 'tax' | 'contact';

interface Props {
  visible: boolean;
  section: EditSection | null;
  data: BankAndBusinessData;
  onClose: () => void;
  onSave: (section: EditSection, payload: any) => Promise<void>;
  isSubmitting: boolean;
}

const ACCENT_COLOR = '#F59E0B';

export function EditBankBusinessModal({
  visible,
  section,
  data,
  onClose,
  onSave,
  isSubmitting,
}: Props) {
  const { tokens } = useTheme();

  // Bank Form state
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CURRENT');
  const [branchName, setBranchName] = useState('');

  // UPI Form state
  const [upiId, setUpiId] = useState('');

  // Tax/Legal Form state
  const [legalName, setLegalName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('PRIVATE_LIMITED');
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [fssaiLicenseNumber, setFssaiLicenseNumber] = useState('');
  const [fssaiExpiryDate, setFssaiExpiryDate] = useState('');

  // Business Contact Form state
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [registeredAddressLine1, setRegisteredAddressLine1] = useState('');
  const [registeredAddressLine2, setRegisteredAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Errors & error message state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Pre-fill fields on open
  useEffect(() => {
    if (!visible || !section) return;
    setErrors({});
    setGeneralError(null);

    if (section === 'bank') {
      setAccountHolderName(data.bankAccount.accountHolderName || '');
      setBankName(data.bankAccount.bankName || '');
      setAccountNumber(data.bankAccount.accountNumber || '');
      setConfirmAccountNumber(data.bankAccount.accountNumber || '');
      setIfscCode(data.bankAccount.ifscCode || '');
      setAccountType(data.bankAccount.accountType || 'CURRENT');
      setBranchName(data.bankAccount.branchName || '');
    } else if (section === 'upi') {
      setUpiId(data.upi.upiId || '');
    } else if (section === 'tax') {
      setLegalName(data.taxAndLegal.legalName || '');
      setBusinessType(data.taxAndLegal.businessType || 'PRIVATE_LIMITED');
      setGstin(data.taxAndLegal.gstin || '');
      setPanNumber(data.taxAndLegal.panNumber || '');
      setFssaiLicenseNumber(data.taxAndLegal.fssaiLicenseNumber || '');
      setFssaiExpiryDate(data.taxAndLegal.fssaiExpiryDate || '');
    } else if (section === 'contact') {
      setBusinessEmail(data.businessContact.businessEmail || '');
      setBusinessPhone(data.businessContact.businessPhone || '');
      setRegisteredAddressLine1(data.businessContact.registeredAddressLine1 || '');
      setRegisteredAddressLine2(data.businessContact.registeredAddressLine2 || '');
      setCity(data.businessContact.city || '');
      setState(data.businessContact.state || '');
      setPincode(data.businessContact.pincode || '');
    }
  }, [visible, section, data]);

  if (!visible || !section) return null;

  const getTitle = () => {
    switch (section) {
      case 'bank':
        return 'Edit Bank Account Details';
      case 'upi':
        return 'Edit UPI Payout Details';
      case 'tax':
        return 'Edit Tax & Legal Details';
      case 'contact':
        return 'Edit Business Contact Details';
    }
  };

  const handleFormSubmit = async () => {
    setErrors({});
    setGeneralError(null);

    if (section === 'bank') {
      const res = validateBankAccountForm({
        accountHolderName,
        bankName,
        accountNumber,
        confirmAccountNumber,
        ifscCode,
        accountType,
        branchName,
      });
      if (!res.ok) {
        setErrors(res.errors);
        setGeneralError(res.message);
        return;
      }
      try {
        await onSave('bank', res.value);
        onClose();
      } catch (err: any) {
        setGeneralError(err?.message || 'Failed to save bank details');
      }
    } else if (section === 'upi') {
      const res = validateUpiForm({ upiId });
      if (!res.ok) {
        setErrors(res.errors);
        setGeneralError(res.message);
        return;
      }
      try {
        await onSave('upi', res.value);
        onClose();
      } catch (err: any) {
        setGeneralError(err?.message || 'Failed to save UPI details');
      }
    } else if (section === 'tax') {
      const res = validateTaxLegalForm({
        gstin,
        panNumber,
        legalName,
        businessType,
        fssaiLicenseNumber,
        fssaiExpiryDate,
      });
      if (!res.ok) {
        setErrors(res.errors);
        setGeneralError(res.message);
        return;
      }
      try {
        await onSave('tax', res.value);
        onClose();
      } catch (err: any) {
        setGeneralError(err?.message || 'Failed to save tax & legal details');
      }
    } else if (section === 'contact') {
      const res = validateBusinessContactForm({
        businessEmail,
        businessPhone,
        registeredAddressLine1,
        registeredAddressLine2,
        city,
        state,
        pincode,
      });
      if (!res.ok) {
        setErrors(res.errors);
        setGeneralError(res.message);
        return;
      }
      try {
        await onSave('contact', res.value);
        onClose();
      } catch (err: any) {
        setGeneralError(err?.message || 'Failed to save business contact details');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
            paddingBottom: 24,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
            }}
          >
            <Text
              variant="heading2"
              style={{ color: '#0F172A', fontSize: 18, fontWeight: '700' }}
            >
              {getTitle()}
            </Text>
            <Pressable
              onPress={onClose}
              disabled={isSubmitting}
              style={{ padding: 6, borderRadius: 20, backgroundColor: '#F1F5F9' }}
              accessibilityRole="button"
              accessibilityLabel="Close form"
            >
              <Text style={{ fontSize: 16, color: '#64748B' }}>✕</Text>
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {generalError ? (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FECACA',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '600' }}>
                  ⚠️ {generalError}
                </Text>
              </View>
            ) : null}

            {/* BANK ACCOUNT FORM */}
            {section === 'bank' ? (
              <>
                <TextInput
                  label="Account Holder Name *"
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholder="e.g. Foodie Restaurant Pvt Ltd"
                  errorText={errors.accountHolderName}
                  accessibilityLabel="Account Holder Name"
                />

                <TextInput
                  label="Bank Name *"
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. HDFC Bank"
                  errorText={errors.bankName}
                  accessibilityLabel="Bank Name"
                />

                <TextInput
                  label="Account Number *"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter full bank account number"
                  keyboardType="number-pad"
                  secureTextEntry={false}
                  errorText={errors.accountNumber}
                  accessibilityLabel="Account Number"
                />

                <TextInput
                  label="Confirm Account Number *"
                  value={confirmAccountNumber}
                  onChangeText={setConfirmAccountNumber}
                  placeholder="Re-enter bank account number"
                  keyboardType="number-pad"
                  secureTextEntry={false}
                  errorText={errors.confirmAccountNumber}
                  accessibilityLabel="Confirm Account Number"
                />

                <TextInput
                  label="IFSC Code *"
                  value={ifscCode}
                  onChangeText={(val) => setIfscCode(val.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  autoCapitalize="characters"
                  errorText={errors.ifscCode}
                  accessibilityLabel="IFSC Code"
                />

                {/* Account Type Selector */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#334155', fontWeight: '600', fontSize: 14 }}>
                    Account Type *
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {(['CURRENT', 'SAVINGS'] as AccountType[]).map((type) => {
                      const isSelected = accountType === type;
                      return (
                        <Pressable
                          key={type}
                          onPress={() => setAccountType(type)}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: isSelected ? ACCENT_COLOR : '#CBD5E1',
                            backgroundColor: isSelected ? '#FEF3C7' : '#FFFFFF',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: '700',
                              color: isSelected ? '#92400E' : '#475569',
                            }}
                          >
                            {type === 'CURRENT' ? 'Current Account' : 'Savings Account'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <TextInput
                  label="Branch Name *"
                  value={branchName}
                  onChangeText={setBranchName}
                  placeholder="e.g. Koramangala 5th Block"
                  errorText={errors.branchName}
                  accessibilityLabel="Branch Name"
                />
              </>
            ) : null}

            {/* UPI FORM */}
            {section === 'upi' ? (
              <>
                <TextInput
                  label="UPI ID (VPA) *"
                  value={upiId}
                  onChangeText={(val) => setUpiId(val.toLowerCase())}
                  placeholder="e.g. foodierestaurant@upi"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  errorText={errors.upiId}
                  accessibilityLabel="UPI ID"
                />
                <Text style={{ color: '#64748B', fontSize: 13 }}>
                  Verify that your UPI VPA handle is active and registered with your bank for fast settlement payouts.
                </Text>
              </>
            ) : null}

            {/* TAX & LEGAL FORM */}
            {section === 'tax' ? (
              <>
                <TextInput
                  label="Legal Business Name *"
                  value={legalName}
                  onChangeText={setLegalName}
                  placeholder="e.g. Foodie Restaurant Pvt Ltd"
                  errorText={errors.legalName}
                  accessibilityLabel="Legal Business Name"
                />

                {/* Business Type Selector */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#334155', fontWeight: '600', fontSize: 14 }}>
                    Business Type *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        { key: 'PROPRIETORSHIP', label: 'Proprietorship' },
                        { key: 'PARTNERSHIP', label: 'Partnership' },
                        { key: 'LLP', label: 'LLP' },
                        { key: 'PRIVATE_LIMITED', label: 'Private Limited' },
                        { key: 'OTHER', label: 'Other' },
                      ].map((item) => {
                        const isSelected = businessType === item.key;
                        return (
                          <Pressable
                            key={item.key}
                            onPress={() => setBusinessType(item.key as BusinessType)}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 14,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: isSelected ? ACCENT_COLOR : '#CBD5E1',
                              backgroundColor: isSelected ? '#FEF3C7' : '#FFFFFF',
                            }}
                          >
                            <Text
                              style={{
                                fontWeight: '700',
                                color: isSelected ? '#92400E' : '#475569',
                                fontSize: 13,
                              }}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <TextInput
                  label="GSTIN Number *"
                  value={gstin}
                  onChangeText={(val) => setGstin(val.toUpperCase())}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  autoCapitalize="characters"
                  errorText={errors.gstin}
                  accessibilityLabel="GSTIN Number"
                />

                <TextInput
                  label="PAN Number *"
                  value={panNumber}
                  onChangeText={(val) => setPanNumber(val.toUpperCase())}
                  placeholder="e.g. ABCDE1234X"
                  autoCapitalize="characters"
                  errorText={errors.panNumber}
                  accessibilityLabel="PAN Number"
                />

                <TextInput
                  label="FSSAI License Number *"
                  value={fssaiLicenseNumber}
                  onChangeText={setFssaiLicenseNumber}
                  placeholder="14-digit FSSAI License Number"
                  keyboardType="number-pad"
                  errorText={errors.fssaiLicenseNumber}
                  accessibilityLabel="FSSAI License Number"
                />

                <TextInput
                  label="FSSAI License Expiry Date (YYYY-MM-DD) *"
                  value={fssaiExpiryDate}
                  onChangeText={setFssaiExpiryDate}
                  placeholder="e.g. 2027-12-31"
                  errorText={errors.fssaiExpiryDate}
                  accessibilityLabel="FSSAI License Expiry Date"
                />
              </>
            ) : null}

            {/* BUSINESS CONTACT FORM */}
            {section === 'contact' ? (
              <>
                <TextInput
                  label="Business Email *"
                  value={businessEmail}
                  onChangeText={setBusinessEmail}
                  placeholder="e.g. contact@foodierestaurant.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  errorText={errors.businessEmail}
                  accessibilityLabel="Business Email"
                />

                <TextInput
                  label="Business Phone Number *"
                  value={businessPhone}
                  onChangeText={setBusinessPhone}
                  placeholder="e.g. +91 98765 43210"
                  keyboardType="phone-pad"
                  errorText={errors.businessPhone}
                  accessibilityLabel="Business Phone Number"
                />

                <TextInput
                  label="Registered Address Line 1 *"
                  value={registeredAddressLine1}
                  onChangeText={setRegisteredAddressLine1}
                  placeholder="Building / Street Address"
                  errorText={errors.registeredAddressLine1}
                  accessibilityLabel="Address Line 1"
                />

                <TextInput
                  label="Registered Address Line 2"
                  value={registeredAddressLine2}
                  onChangeText={setRegisteredAddressLine2}
                  placeholder="Area / Landmark (Optional)"
                  accessibilityLabel="Address Line 2"
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      label="City *"
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g. Bengaluru"
                      errorText={errors.city}
                      accessibilityLabel="City"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      label="State *"
                      value={state}
                      onChangeText={setState}
                      placeholder="e.g. Karnataka"
                      errorText={errors.state}
                      accessibilityLabel="State"
                    />
                  </View>
                </View>

                <TextInput
                  label="Pincode *"
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="6-digit Pincode"
                  keyboardType="number-pad"
                  errorText={errors.pincode}
                  accessibilityLabel="Pincode"
                />
              </>
            ) : null}

            {/* Submit Action */}
            <View style={{ marginTop: 12 }}>
              <Pressable
                onPress={handleFormSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => ({
                  backgroundColor: isSubmitting
                    ? '#FCD34D'
                    : pressed
                      ? '#D97706'
                      : ACCENT_COLOR,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                })}
                accessibilityRole="button"
                accessibilityLabel="Save details"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : null}
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save & Submit Details'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
