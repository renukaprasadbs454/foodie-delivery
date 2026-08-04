import type { ApiEnvelope } from '../types/api';
import {
  asAccessToken,
  asRefreshToken,
  type AccessToken,
  type RefreshToken,
  type TokenPair,
} from '../types/tokens';
import { saveRefreshToken } from './secureStorage';
import { logger } from '../utils/logger';

/**
 * Shared refresh interceptor logic — Blueprint §13 / System Design §7.2–§7.3.
 * Consumed by createBaseApi baseQuery wrapper. Not reimplemented per app.
 */

export type RefreshSuccessPayload = {
  accessToken: string;
  refreshToken: string;
  userType?: string;
  userId?: string;
  isNewUser?: boolean;
};

export type TokenRefreshCallbacks = {
  onCredentialsRefreshed: (pair: TokenPair, raw?: RefreshSuccessPayload) => void;
  onTokenReuseDetected: () => void | Promise<void>;
  onRefreshFailed: (code: string) => void | Promise<void>;
};

export type PerformRefreshArgs = {
  baseUrl: string;
  refreshToken: RefreshToken | string;
  callbacks: TokenRefreshCallbacks;
  fetchImpl?: typeof fetch;
};

let inFlightRefresh: Promise<TokenPair | null> | null = null;

export function resetTokenRefreshMutex(): void {
  inFlightRefresh = null;
}

async function executeRefresh({
  baseUrl,
  refreshToken,
  callbacks,
  fetchImpl = fetch,
}: PerformRefreshArgs): Promise<TokenPair | null> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/refresh`;
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken: String(refreshToken) }),
    });

    const envelope = (await response.json()) as ApiEnvelope<RefreshSuccessPayload>;
    const code = envelope.error?.code;

    if (code === 'TOKEN_REUSE_DETECTED') {
      logger.warn('TOKEN_REUSE_DETECTED during refresh', {
        requestId: envelope.meta?.requestId,
      });
      await callbacks.onTokenReuseDetected();
      return null;
    }

    if (!response.ok || !envelope.success || !envelope.data) {
      const failureCode = code ?? 'UNAUTHORIZED';
      logger.error('Token refresh failed', {
        requestId: envelope.meta?.requestId,
        code: failureCode,
      });
      await callbacks.onRefreshFailed(failureCode);
      return null;
    }

    const pair: TokenPair = {
      accessToken: asAccessToken(envelope.data.accessToken),
      refreshToken: asRefreshToken(envelope.data.refreshToken),
    };

    await saveRefreshToken(pair.refreshToken);
    callbacks.onCredentialsRefreshed(pair, envelope.data);
    logger.info('Token refresh succeeded', {
      requestId: envelope.meta?.requestId,
    });
    return pair;
  } catch (error) {
    logger.error('Token refresh network failure', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    await callbacks.onRefreshFailed('NETWORK_ERROR');
    return null;
  }
}

/**
 * Coalesced refresh — concurrent callers share one in-flight POST /auth/refresh.
 */
export function performTokenRefresh(
  args: PerformRefreshArgs,
): Promise<TokenPair | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = executeRefresh(args).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

export type ProactiveRefreshArgs = PerformRefreshArgs & {
  accessToken: AccessToken | string;
  bufferMs?: number;
  isExpiringSoon: (token: string, bufferMs?: number) => boolean;
};

export async function maybeProactiveRefresh(
  args: ProactiveRefreshArgs,
): Promise<TokenPair | null> {
  if (!args.isExpiringSoon(String(args.accessToken), args.bufferMs)) {
    return null;
  }
  return performTokenRefresh(args);
}
