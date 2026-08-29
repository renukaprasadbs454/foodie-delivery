import {
  performTokenRefresh,
  resetTokenRefreshMutex,
} from '../auth/tokenRefresh';
import {
  resetSecureStorageAdapter,
  setSecureStorageAdapter,
} from '../auth/secureStorage';
import { asRefreshToken } from '../types/tokens';

describe('tokenRefresh coalescing', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    resetTokenRefreshMutex();
    memory.clear();
    setSecureStorageAdapter({
      getItemAsync: async (key) => memory.get(key) ?? null,
      setItemAsync: async (key, value) => {
        memory.set(key, value);
      },
      deleteItemAsync: async (key) => {
        memory.delete(key);
      },
    });
  });

  afterEach(() => {
    resetSecureStorageAdapter();
    resetTokenRefreshMutex();
  });

  it('coalesces concurrent refresh calls into one network request', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'access-new',
            refreshToken: 'refresh-new',
          },
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
      onCredentialsRefreshed: jest.fn(),
      onTokenReuseDetected: jest.fn(),
      onRefreshFailed: jest.fn(),
    };

    const args = {
      baseUrl: 'https://api.foodie.kwiko.org',
      refreshToken: asRefreshToken('refresh-old'),
      callbacks,
      fetchImpl,
    };

    const [a, b] = await Promise.all([
      performTokenRefresh(args),
      performTokenRefresh(args),
    ]);

    expect(calls).toBe(1);
    expect(a?.accessToken).toBe('access-new');
    expect(b?.refreshToken).toBe('refresh-new');
    expect(callbacks.onCredentialsRefreshed).toHaveBeenCalledTimes(1);
    expect(memory.get('foodie.auth.refreshToken')).toBe('refresh-new');
  });

  it('handles TOKEN_REUSE_DETECTED without retrying credentials', async () => {
    const fetchImpl: typeof fetch = async () =>
      ({
        ok: false,
        json: async () => ({
          success: false,
          data: null,
          error: {
            code: 'TOKEN_REUSE_DETECTED',
            message: 'Reuse detected',
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
      onCredentialsRefreshed: jest.fn(),
      onTokenReuseDetected: jest.fn(),
      onRefreshFailed: jest.fn(),
    };

    const result = await performTokenRefresh({
      baseUrl: 'https://api.foodie.kwiko.org',
      refreshToken: asRefreshToken('refresh-old'),
      callbacks,
      fetchImpl,
    });

    expect(result).toBeNull();
    expect(callbacks.onTokenReuseDetected).toHaveBeenCalledTimes(1);
    expect(callbacks.onCredentialsRefreshed).not.toHaveBeenCalled();
  });
});
