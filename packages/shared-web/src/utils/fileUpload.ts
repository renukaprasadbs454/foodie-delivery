/** File upload size limits — 04_API_Contracts.md File Upload Standards. */
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export function isImageWithinSizeLimit(byteLength: number): boolean {
  return byteLength > 0 && byteLength <= IMAGE_UPLOAD_MAX_BYTES;
}

export function isDocumentWithinSizeLimit(byteLength: number): boolean {
  return byteLength > 0 && byteLength <= DOCUMENT_UPLOAD_MAX_BYTES;
}
