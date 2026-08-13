export type AccountType = 'SAVINGS' | 'CURRENT';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED';

export type BusinessType =
  | 'PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'LLP'
  | 'PRIVATE_LIMITED'
  | 'OTHER';

export interface BankAccountDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: AccountType;
  branchName: string;
  verificationStatus: VerificationStatus;
}

export interface UpiDetails {
  upiId: string;
  verificationStatus: VerificationStatus;
}

export interface TaxAndLegalDetails {
  gstin: string;
  panNumber: string;
  legalName: string;
  businessType: BusinessType;
  fssaiLicenseNumber: string;
  fssaiExpiryDate: string;
  gstinVerificationStatus: VerificationStatus;
  panVerificationStatus: VerificationStatus;
  fssaiVerificationStatus: VerificationStatus;
}

export interface BusinessContactDetails {
  businessEmail: string;
  businessPhone: string;
  registeredAddressLine1: string;
  registeredAddressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface BankAndBusinessData {
  bankAccount: BankAccountDetails;
  upi: UpiDetails;
  taxAndLegal: TaxAndLegalDetails;
  businessContact: BusinessContactDetails;
}

/** Form Payloads for Edits */

export interface UpdateBankAccountPayload {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: AccountType;
  branchName: string;
}

export interface UpdateUpiPayload {
  upiId: string;
}

export interface UpdateTaxLegalPayload {
  gstin: string;
  panNumber: string;
  legalName: string;
  businessType: BusinessType;
  fssaiLicenseNumber: string;
  fssaiExpiryDate: string;
}

export interface UpdateBusinessContactPayload {
  businessEmail: string;
  businessPhone: string;
  registeredAddressLine1: string;
  registeredAddressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Record<string, string>; message: string };

/** Validation Helpers */

export function validateBankAccountForm(
  payload: UpdateBankAccountPayload,
): ValidationResult<Omit<UpdateBankAccountPayload, 'confirmAccountNumber'>> {
  const errors: Record<string, string> = {};

  if (!payload.accountHolderName.trim()) {
    errors.accountHolderName = 'Account holder name is required';
  }

  if (!payload.bankName.trim()) {
    errors.bankName = 'Bank name is required';
  }

  const cleanAccNum = payload.accountNumber.replace(/\s+/g, '');
  if (!cleanAccNum) {
    errors.accountNumber = 'Account number is required';
  } else if (!/^\d{9,18}$/.test(cleanAccNum)) {
    errors.accountNumber = 'Account number must be 9 to 18 digits';
  }

  const cleanConfirmAccNum = payload.confirmAccountNumber.replace(/\s+/g, '');
  if (!cleanConfirmAccNum) {
    errors.confirmAccountNumber = 'Please confirm your account number';
  } else if (cleanConfirmAccNum !== cleanAccNum) {
    errors.confirmAccountNumber = 'Account numbers do not match';
  }

  const cleanIfsc = payload.ifscCode.trim().toUpperCase();
  if (!cleanIfsc) {
    errors.ifscCode = 'IFSC code is required';
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
    errors.ifscCode = 'Invalid IFSC format (e.g. HDFC0001234)';
  }

  if (!payload.branchName.trim()) {
    errors.branchName = 'Branch name is required';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: Object.values(errors)[0],
    };
  }

  return {
    ok: true,
    value: {
      accountHolderName: payload.accountHolderName.trim(),
      bankName: payload.bankName.trim(),
      accountNumber: cleanAccNum,
      ifscCode: cleanIfsc,
      accountType: payload.accountType,
      branchName: payload.branchName.trim(),
    },
  };
}

export function validateUpiForm(
  payload: UpdateUpiPayload,
): ValidationResult<UpdateUpiPayload> {
  const errors: Record<string, string> = {};

  const cleanUpi = payload.upiId.trim().toLowerCase();
  if (!cleanUpi) {
    errors.upiId = 'UPI ID is required';
  } else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
    errors.upiId = 'Invalid UPI ID format (e.g. restaurant@upi)';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: Object.values(errors)[0] };
  }

  return { ok: true, value: { upiId: cleanUpi } };
}

export function validateTaxLegalForm(
  payload: UpdateTaxLegalPayload,
): ValidationResult<UpdateTaxLegalPayload> {
  const errors: Record<string, string> = {};

  const cleanGstin = payload.gstin.trim().toUpperCase();
  if (!cleanGstin) {
    errors.gstin = 'GSTIN is required';
  } else if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)
  ) {
    errors.gstin = 'Invalid GSTIN format (15 characters, e.g. 29ABCDE1234F1Z5)';
  }

  const cleanPan = payload.panNumber.trim().toUpperCase();
  if (!cleanPan) {
    errors.panNumber = 'PAN number is required';
  } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
    errors.panNumber = 'Invalid PAN format (e.g. ABCDE1234X)';
  }

  if (!payload.legalName.trim()) {
    errors.legalName = 'Legal business name is required';
  }

  const cleanFssai = payload.fssaiLicenseNumber.trim();
  if (!cleanFssai) {
    errors.fssaiLicenseNumber = 'FSSAI License number is required';
  } else if (!/^\d{14}$/.test(cleanFssai)) {
    errors.fssaiLicenseNumber = 'FSSAI License number must be exactly 14 digits';
  }

  if (!payload.fssaiExpiryDate.trim()) {
    errors.fssaiExpiryDate = 'FSSAI Expiry date is required';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.fssaiExpiryDate.trim())) {
    errors.fssaiExpiryDate = 'Expiry date format must be YYYY-MM-DD';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: Object.values(errors)[0] };
  }

  return {
    ok: true,
    value: {
      gstin: cleanGstin,
      panNumber: cleanPan,
      legalName: payload.legalName.trim(),
      businessType: payload.businessType,
      fssaiLicenseNumber: cleanFssai,
      fssaiExpiryDate: payload.fssaiExpiryDate.trim(),
    },
  };
}

export function validateBusinessContactForm(
  payload: UpdateBusinessContactPayload,
): ValidationResult<UpdateBusinessContactPayload> {
  const errors: Record<string, string> = {};

  const cleanEmail = payload.businessEmail.trim();
  if (!cleanEmail) {
    errors.businessEmail = 'Business email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.businessEmail = 'Invalid email address format';
  }

  const cleanPhone = payload.businessPhone.trim();
  if (!cleanPhone) {
    errors.businessPhone = 'Business phone number is required';
  } else if (cleanPhone.replace(/[\s+\-()]/g, '').length < 10) {
    errors.businessPhone = 'Please enter a valid 10-digit phone number';
  }

  if (!payload.registeredAddressLine1.trim()) {
    errors.registeredAddressLine1 = 'Address line 1 is required';
  }

  if (!payload.city.trim()) {
    errors.city = 'City is required';
  }

  if (!payload.state.trim()) {
    errors.state = 'State is required';
  }

  const cleanPincode = payload.pincode.trim();
  if (!cleanPincode) {
    errors.pincode = 'Pincode is required';
  } else if (!/^\d{6}$/.test(cleanPincode)) {
    errors.pincode = 'Pincode must be 6 digits';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: Object.values(errors)[0] };
  }

  return {
    ok: true,
    value: {
      businessEmail: cleanEmail,
      businessPhone: cleanPhone,
      registeredAddressLine1: payload.registeredAddressLine1.trim(),
      registeredAddressLine2: payload.registeredAddressLine2?.trim() || undefined,
      city: payload.city.trim(),
      state: payload.state.trim(),
      pincode: cleanPincode,
    },
  };
}
