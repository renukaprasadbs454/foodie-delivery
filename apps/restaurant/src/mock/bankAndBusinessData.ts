import type { BankAndBusinessData } from '../features/profile/bankBusinessTypes';

export const MOCK_BANK_AND_BUSINESS_DATA: BankAndBusinessData = {
  bankAccount: {
    accountHolderName: 'Foodie Restaurant Pvt Ltd',
    bankName: 'HDFC Bank',
    accountNumber: '98765432104521',
    ifscCode: 'HDFC0001234',
    accountType: 'CURRENT',
    branchName: 'Koramangala 5th Block',
    verificationStatus: 'VERIFIED',
  },
  upi: {
    upiId: 'foodierestaurant@upi',
    verificationStatus: 'VERIFIED',
  },
  taxAndLegal: {
    gstin: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234X',
    legalName: 'Foodie Restaurant Pvt Ltd',
    businessType: 'PRIVATE_LIMITED',
    fssaiLicenseNumber: '12345678901234',
    fssaiExpiryDate: '2027-12-31',
    gstinVerificationStatus: 'VERIFIED',
    panVerificationStatus: 'VERIFIED',
    fssaiVerificationStatus: 'VERIFIED',
  },
  businessContact: {
    businessEmail: 'contact@foodierestaurant.com',
    businessPhone: '+91 98765 43210',
    registeredAddressLine1: '124 MG Road, Opposite Metro Station',
    registeredAddressLine2: 'Koramangala 5th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560095',
  },
};

let currentMockBankAndBusiness: BankAndBusinessData = {
  ...MOCK_BANK_AND_BUSINESS_DATA,
};

export function getMockBankAndBusinessData(): BankAndBusinessData {
  return currentMockBankAndBusiness;
}

export function updateMockBankAndBusinessData(
  updated: Partial<BankAndBusinessData>,
): BankAndBusinessData {
  currentMockBankAndBusiness = {
    ...currentMockBankAndBusiness,
    ...updated,
  };
  return currentMockBankAndBusiness;
}
