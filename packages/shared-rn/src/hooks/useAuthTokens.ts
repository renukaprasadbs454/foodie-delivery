import { useCallback, useEffect, useState } from 'react';
import {
  clearRefreshToken,
  loadRefreshToken,
  saveRefreshToken,
} from '../auth/secureStorage';
import type { RefreshToken } from '../types/tokens';
import { asRefreshToken } from '../types/tokens';

export type UseAuthTokensResult = {
  refreshToken: RefreshToken | null;
  isHydrating: boolean;
  persistRefreshToken: (token: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  reloadRefreshToken: () => Promise<RefreshToken | null>;
};

/**
 * Wraps secure storage for refresh token — Blueprint §5 / §12.
 * Access token remains Redux memory-only (never persisted here).
 */
export function useAuthTokens(): UseAuthTokensResult {
  const [refreshToken, setRefreshToken] = useState<RefreshToken | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const reloadRefreshToken = useCallback(async () => {
    const token = await loadRefreshToken();
    setRefreshToken(token);
    return token;
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await loadRefreshToken();
      if (mounted) {
        setRefreshToken(token);
        setIsHydrating(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistRefreshToken = useCallback(async (token: string) => {
    const branded = asRefreshToken(token);
    await saveRefreshToken(branded);
    setRefreshToken(branded);
  }, []);

  const clearTokens = useCallback(async () => {
    await clearRefreshToken();
    setRefreshToken(null);
  }, []);

  return {
    refreshToken,
    isHydrating,
    persistRefreshToken,
    clearTokens,
    reloadRefreshToken,
  };
}
