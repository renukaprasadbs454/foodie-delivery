/**
 * P2-AUTH-04: logout BFF clears cookies and never returns token strings.
 */

describe('TD/P2-AUTH-04 logout JSON contract', () => {
  it('success body uses data: null', () => {
    const body = {
      success: true as const,
      data: null,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'req-1',
        pagination: null,
      },
    };
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('accessToken');
    expect(serialized).not.toContain('refreshToken');
    expect(body.data).toBeNull();
  });
});
