/** Normalize RTK Query unwrap failures for Admin restaurant mutations. */
export function toUnwrappedApiError(err: unknown): {
  code: string;
  message: string;
  fields: null;
} {
  if (err && typeof err === 'object') {
    const withData = err as { data?: { code?: string; message?: string } };
    if (withData.data?.code) {
      return {
        code: withData.data.code,
        message: withData.data.message ?? 'Something went wrong',
        fields: null,
      };
    }
  }
  return { code: 'INTERNAL_ERROR', message: 'Something went wrong', fields: null };
}
