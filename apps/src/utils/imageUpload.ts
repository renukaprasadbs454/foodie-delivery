/**
 * Image upload constants — Blueprint §37.2 / System Design §17.2 /
 * 04_API_Contracts.md File Upload Standards.
 *
 * GAP: max dimension and JPEG quality are required as shared constants but
 * numeric targets are not published in frozen docs. Size limits ARE published.
 */
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB (API contract)
export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB (API contract)

/**
 * Reserved slots — do not invent values. Amend design/docs before enabling compression pipeline.
 * @see Implementation Report Known TODOs
 */
export const IMAGE_UPLOAD_MAX_DIMENSION_PX: number | null = null;
export const IMAGE_UPLOAD_JPEG_QUALITY: number | null = null;

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
