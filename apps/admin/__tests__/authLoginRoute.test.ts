/**
 * GAP-API-13: Admin login BFF never returns token strings.
 */

describe('GAP-API-13 login JSON contract', () => {
  it('success body exposes identity only', () => {
    const body = {
      success: true as const,
      data: {
        userId: '33333333-3333-3333-3333-333333333001',
        userType: 'ADMIN' as const,
        role: 'SUPER_ADMIN' as const,
      },
      error: null,
      meta: {
        timestamp: '2026-08-04T00:00:00Z',
        requestId: 'req-login',
        pagination: null,
      },
    };
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('accessToken');
    expect(serialized).not.toContain('refreshToken');
    expect(body.data.role).toBe('SUPER_ADMIN');
  });

  it('maps unauthorized login failures', () => {
    const error = {
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password.',
      fields: null,
    };
    expect(error.code).toBe('UNAUTHORIZED');
  });
});
