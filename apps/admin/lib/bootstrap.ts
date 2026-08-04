import {
  initAnalytics,
  initCrashReporting,
  logger,
  noOpAnalyticsClient,
  noOpCrashReporter,
  performAdminTokenRefresh,
} from 'foodie-shared-web';
import { ENV } from '../constants/env';
import { baseApi } from '../api/baseApi';
import {
  clearSession,
  markCookieSessionValid,
  setAuthStatus,
  setSession,
} from '../features/auth/authSlice';
import type { AppDispatch } from '../store/store';

/**
 * Cold-start sequence — Blueprint §11.3 adapted for Admin cookies.
 * Attempts BFF refresh; restores userId/role when the refresh contract returns them.
 */
export async function runBootstrap(dispatch: AppDispatch): Promise<void> {
  dispatch(setAuthStatus('authenticating'));

  await initCrashReporting(noOpCrashReporter, {
    appName: ENV.appName,
    appVersion: ENV.appVersion,
  });

  await initAnalytics(noOpAnalyticsClient, {
    appName: ENV.appName,
    appVersion: ENV.appVersion,
  });

  logger.info('Admin bootstrap started', { app: ENV.appName });

  try {
    const ok = await performAdminTokenRefresh({
      refreshPath: '/api/auth/refresh',
      callbacks: {
        onRefreshed: async (session) => {
          if (session) {
            dispatch(
              setSession({
                userId: session.userId,
                role: session.role,
                userType: session.userType,
              }),
            );
          } else {
            dispatch(markCookieSessionValid());
          }
        },
        onTokenReuseDetected: async () => {
          dispatch(clearSession());
          dispatch(baseApi.util.resetApiState());
        },
        onRefreshFailed: async () => {
          dispatch(clearSession());
          dispatch(baseApi.util.resetApiState());
        },
      },
    });

    if (!ok) {
      dispatch(clearSession());
    }
  } catch (error) {
    logger.error('Admin bootstrap failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    dispatch(clearSession());
  }
}
