import {
  performAdminTokenRefresh,
  resetAdminTokenRefreshMutex,
} from '../auth/tokenRefresh';

describe('admin token refresh', () => {
  beforeEach(() => {
    resetAdminTokenRefreshMutex();
  });

  afterEach(() => {
    resetAdminTokenRefreshMutex();
  });

  it('coalesces concurrent BFF refresh calls', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: null,
          error: null,
          meta: {
            timestamp: '2026-08-01T10:15:00Z',
            requestId: 'req-1',
            pagination: null,
          },
        }),
      } as Response;
    };

    const callbacks = {
      onRefreshed: jest.fn(),
      onTokenReuseDetected: jest.fn(),
      onRefreshFailed: jest.fn(),
    };

    const [a, b] = await Promise.all([
      performAdminTokenRefresh({ callbacks, fetchImpl }),
      performAdminTokenRefresh({ callbacks, fetchImpl }),
    ]);

    expect(calls).toBe(1);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(callbacks.onRefreshed).toHaveBeenCalledTimes(1);
  });

  it('handles TOKEN_REUSE_DETECTED', async () => {
    const fetchImpl: typeof fetch = async () =>
      ({
        ok: false,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: 'TOKEN_REUSE_DETECTED',
            message: 'Reuse',
            fields: null,
          },
          meta: {
            timestamp: '2026-08-01T10:15:00Z',
            requestId: 'req-2',
            pagination: null,
          },
        }),
      }) as Response;

    const callbacks = {
      onRefreshed: jest.fn(),
      onTokenReuseDetected: jest.fn(),
      onRefreshFailed: jest.fn(),
    };

    const result = await performAdminTokenRefresh({ callbacks, fetchImpl });
    expect(result).toBe(false);
    expect(callbacks.onTokenReuseDetected).toHaveBeenCalledTimes(1);
    expect(callbacks.onRefreshed).not.toHaveBeenCalled();
  });
});
