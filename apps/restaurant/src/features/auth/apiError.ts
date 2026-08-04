import type { UnwrappedApiError } from 'foodie-shared-rn';

/** Normalize RTK Query unwrap failures to UnwrappedApiError. */
export function toUnwrappedApiError(err: unknown): UnwrappedApiError {
  if (err && typeof err === 'object') {
    const withData = err as { data?: UnwrappedApiError };
    if (withData.data?.code) {
      return withData.data;
    }
    const direct = err as UnwrappedApiError;
    if (direct.code) {
      return direct;
    }
  }
  return {
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong',
    fields: null,
  };
}
