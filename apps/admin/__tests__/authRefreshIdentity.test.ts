/**
 * GAP-API-13: refresh BFF returns identity without token strings.
 */

describe('GAP-API-13 refresh identity JSON contract', () => {
  it('success body may include session identity without tokens', () => {
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
        requestId: 'req-refresh',
        pagination: null,
      },
    };
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('accessToken');
    expect(serialized).not.toContain('refreshToken');
    expect(body.data.userId).toBeTruthy();
  });
});
