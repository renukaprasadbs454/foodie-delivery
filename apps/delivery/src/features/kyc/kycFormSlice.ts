import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearCredentials } from '../auth/authSlice';
import type {
  DeliveryDocType,
  ProfileImageUploadResult,
  UploadedDocumentMeta,
} from './types';

/**
 * kycFormSlice — UI-API KYC Redux.
 * Session-only (not persisted). Patches local upload UI; no kycStatus read (GAP-API-08).
 */
export type KycFormState = {
  selectedDocType: DeliveryDocType;
  documents: Partial<Record<DeliveryDocType, UploadedDocumentMeta>>;
  profileImage: ProfileImageUploadResult | null;
};

const initialState: KycFormState = {
  selectedDocType: 'LICENSE',
  documents: {},
  profileImage: null,
};

const kycFormSlice = createSlice({
  name: 'kycForm',
  initialState,
  reducers: {
    setSelectedDocType(state, action: PayloadAction<DeliveryDocType>) {
      state.selectedDocType = action.payload;
    },
    documentUploaded(state, action: PayloadAction<UploadedDocumentMeta>) {
      state.documents[action.payload.docType] = action.payload;
    },
    profileImageUploaded(
      state,
      action: PayloadAction<ProfileImageUploadResult>,
    ) {
      state.profileImage = action.payload;
    },
    clearKycForm() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearCredentials, () => initialState);
  },
});

export const {
  setSelectedDocType,
  documentUploaded,
  profileImageUploaded,
  clearKycForm,
} = kycFormSlice.actions;

export const selectSelectedDocType = (state: { kycForm: KycFormState }) =>
  state.kycForm.selectedDocType;

export const selectKycDocuments = (state: { kycForm: KycFormState }) =>
  state.kycForm.documents;

export const selectKycProfileImage = (state: { kycForm: KycFormState }) =>
  state.kycForm.profileImage;

export const selectUploadedDocCount = (state: { kycForm: KycFormState }) =>
  Object.keys(state.kycForm.documents).length;

export default kycFormSlice.reducer;
