/**
 * Envelope + error shapes from 04_API_Contracts.md Response / Error Standards.
 */
export type ApiPaginationMeta = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ApiMeta = {
  timestamp: string;
  requestId: string;
  pagination: ApiPaginationMeta | null;
};

export type ApiErrorFields = Record<string, string>;

export type ApiErrorBody = {
  code: string;
  message: string;
  fields: ApiErrorFields | null;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
  meta: ApiMeta;
};

/** RTK Query error shape after shared baseQuery unwrap (Blueprint §7.2, §28.2). */
export type UnwrappedApiError = {
  code: string;
  message: string;
  fields: ApiErrorFields | null;
  status?: number;
  requestId?: string;
};
