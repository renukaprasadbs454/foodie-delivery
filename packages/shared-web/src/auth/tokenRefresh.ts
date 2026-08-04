import type { ApiEnvelope } from '../types/api';
import { logger } from '../utils/logger';

/**
 * Admin token refresh — Blueprint §7.4 / §13 / System Design §7 / §9.4.
 *
 * Client JS never holds tokens. Refresh is a same-origin call to the Next.js
 * BFF route, which reads the httpOnly refresh cookie and rotates cookies.
 */

export type AdminTokenRefreshCallbacks = {
  onRefreshed: () => void | Promise<void>;
  onTokenReuseDetected: () => void | Promise<void>;
  onRefreshFailed: (code: string) => void | Promise<void>;
};

export type PerformAdminRefreshArgs = {
  /** Default: `/api/auth/refresh` (BFF route owned by foodie-admin). */
  refreshPath?: string;
  callbacks: AdminTokenRefreshCallbacks;
  fetchImpl?: typeof fetch;
};

let inFlightRefresh: Promise<boolean> | null = null;

export function resetAdminTokenRefreshMutex(): void {
  inFlightRefresh = null;
}

async function executeRefresh({
  refreshPath = '/api/auth/refresh',
  callbacks,
  fetchImpl = fetch,
}: PerformAdminRefreshArgs): Promise<boolean> {
  try {
    const response = await fetchImpl(refreshPath, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    let envelope: ApiEnvelope<unknown> | null = null;
    try {
      envelope = (await response.json()) as ApiEnvelope<unknown>;
    } catch {
      envelope = null;
    }

    const code = envelope?.error?.code;

    if (code === 'TOKEN_REUSE_DETECTED') {
      logger.warn('TOKEN_REUSE_DETECTED during admin BFF refresh', {
        requestId: envelope?.meta?.requestId,
      });
      await callbacks.onTokenReuseDetected();
      return false;
    }

    if (!response.ok || envelope?.success === false) {
      const failureCode = code ?? 'UNAUTHORIZED';
      logger.error('Admin token refresh failed', {
        requestId: envelope?.meta?.requestId,
        code: failureCode,
      });
      await callbacks.onRefreshFailed(failureCode);
      return false;
    }

    await callbacks.onRefreshed();
    logger.info('Admin token refresh succeeded', {
      requestId: envelope?.meta?.requestId,
    });
    return true;
  } catch (error) {
    logger.error('Admin token refresh network failure', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    await callbacks.onRefreshFailed('NETWORK_ERROR');
    return false;
  }
}

/** Coalesced BFF refresh — concurrent callers share one in-flight request. */
export function performAdminTokenRefresh(
  args: PerformAdminRefreshArgs,
): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = executeRefresh(args).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}
