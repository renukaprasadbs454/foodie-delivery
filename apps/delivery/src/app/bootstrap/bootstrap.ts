import {
  clearRefreshToken,
  initAnalytics,
  initCrashReporting,
  loadRefreshToken,
  logger,
  noOpAnalyticsClient,
  noOpCrashReporter,
  performTokenRefresh,
  saveRefreshToken,
} from 'foodie-shared-rn';
import { ENV } from '../../constants/env';
import { baseApi } from '../../api/baseApi';
import {
  clearCredentials,
  setAuthStatus,
  setCredentials,
} from '../../features/auth/authSlice';
import type { AppDispatch } from '../../store/store';

/** TD-011: clear SecureStore + Redux + RTK on forced session end. */
async function terminateSession(dispatch: AppDispatch): Promise<void> {
  await clearRefreshToken();
  dispatch(clearCredentials());
  dispatch(baseApi.util.resetApiState());
}

/**
 * Cold-start sequence — Blueprint §2.1 bootstrap / §11.3.
 * Initializes crash/analytics, restores refresh token, refreshes session.
 * Does not implement login UI.
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

  logger.info('Bootstrap started', { app: ENV.appName });

  try {
    const refreshToken = await loadRefreshToken();
    if (!refreshToken) {
      await terminateSession(dispatch);
      logger.info('Bootstrap: no refresh token — unauthenticated');
      return;
    }

    const pair = await performTokenRefresh({
      baseUrl: ENV.apiBaseUrl,
      refreshToken,
      callbacks: {
        onCredentialsRefreshed: async (tokens, raw) => {
          await saveRefreshToken(tokens.refreshToken);
          dispatch(
            setCredentials({
              accessToken: String(tokens.accessToken),
              refreshToken: String(tokens.refreshToken),
              userType: (raw?.userType as 'DELIVERY_PARTNER') ?? 'DELIVERY_PARTNER',
              userId: raw?.userId ?? '',
              isNewUser: raw?.isNewUser,
            }),
          );
        },
        onTokenReuseDetected: async () => {
          await terminateSession(dispatch);
        },
        onRefreshFailed: async () => {
          await terminateSession(dispatch);
        },
      },
    });

    if (!pair) {
      await terminateSession(dispatch);
    }
  } catch (error) {
    logger.error('Bootstrap failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    await terminateSession(dispatch);
  }
}
