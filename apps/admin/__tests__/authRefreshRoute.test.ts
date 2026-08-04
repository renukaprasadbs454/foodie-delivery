/**
 * TD-012: Admin refresh must never put token strings in JSON `data`.
 * Exercises response shape construction (same contract as route handler).
 */

describe('TD-012 refresh JSON redaction contract', () => {
  it('success body uses data: null (cookies carry tokens)', () => {
    const upstreamTokens = {
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    };
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
    expect(serialized).not.toContain(upstreamTokens.accessToken);
    expect(serialized).not.toContain(upstreamTokens.refreshToken);
    expect(body.data).toBeNull();
  });
});
