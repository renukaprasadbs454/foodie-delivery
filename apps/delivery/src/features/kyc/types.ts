/**
 * P2-DEL-01 KYC shapes — UI-API KYC + API Contracts §3 Delivery Partner Documents.
 */

export const DOC_TYPES = ['LICENSE', 'VEHICLE_RC', 'IDENTITY'] as const;
export type DeliveryDocType = (typeof DOC_TYPES)[number];

export type DocumentVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | string;

export type DeliveryDocumentUploadResult = {
  documentId: string;
  docType: DeliveryDocType | string;
  verificationStatus: DocumentVerificationStatus;
  fileKey: string;
  uploadedAt: string;
};

export type ProfileImageUploadResult = {
  fileKey: string;
  uploadedAt?: string;
};

export type UploadedDocumentMeta = {
  documentId: string;
  docType: DeliveryDocType;
  verificationStatus: DocumentVerificationStatus;
  fileKey: string;
  uploadedAt: string;
};

export function isDeliveryDocType(value: string): value is DeliveryDocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}
