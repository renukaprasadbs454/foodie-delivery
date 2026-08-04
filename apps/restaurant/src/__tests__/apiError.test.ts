import { toUnwrappedApiError } from '../features/auth/apiError';

describe('toUnwrappedApiError', () => {
  it('reads RTK error.data envelope unwrap shape', () => {
    const error = toUnwrappedApiError({
      status: 400,
      data: {
        code: 'INVALID_OTP',
        message: 'Bad OTP',
        fields: null,
      },
    });
    expect(error.code).toBe('INVALID_OTP');
  });
});
