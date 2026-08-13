import type { UnwrappedApiError } from 'foodie-shared-rn';

/** Normalize RTK Query unwrap failures to UnwrappedApiError with descriptive fallback. */
export function toUnwrappedApiError(err: unknown): UnwrappedApiError {
  if (err && typeof err === 'object') {
    const withData = err as {
      data?: UnwrappedApiError | { message?: string; error?: string; code?: string };
      status?: unknown;
      error?: string;
      message?: string;
    };

    if (withData.data && typeof withData.data === 'object' && 'code' in withData.data && withData.data.code) {
      return withData.data as UnwrappedApiError;
    }

    if (withData.data && typeof withData.data === 'object' && 'message' in withData.data && withData.data.message) {
      return {
        code: (withData.data as any).code ?? 'ERROR',
        message: String((withData.data as any).message),
        fields: (withData.data as any).fields ?? null,
      };
    }

    const direct = err as UnwrappedApiError;
    if (direct.code && direct.message) {
      return direct;
    }

    if (typeof withData.error === 'string' && withData.error.trim().length > 0) {
      return {
        code: 'NETWORK_ERROR',
        message: `Network/API Error: ${withData.error}`,
        fields: null,
      };
    }

    if (typeof withData.status === 'string' || typeof withData.status === 'number') {
      return {
        code: 'HTTP_ERROR',
        message: `Request failed with status ${withData.status}`,
        fields: null,
      };
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    message: err instanceof Error ? err.message : 'Unable to complete request. Check connection.',
    fields: null,
  };
}
