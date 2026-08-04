import { clearRefreshToken, createBaseApi } from 'foodie-shared-rn';
import { ENV } from '../constants/env';
import {
  clearCredentials,
  selectAccessToken,
  selectRefreshToken,
  setCredentials,
  type AuthState,
} from '../features/auth/authSlice';

type AuthRoot = { auth: AuthState };

/**
 * Single RTK Query API instance — Blueprint §7–§8.
 * Feature agents inject endpoints later; none in Phase 1 foundation.
 */
export const baseApi = createBaseApi({
  baseUrl: ENV.apiBaseUrl,
  /** UI-API cache tags — Auth / Restaurant / Order / Menu / Review / Notification */
  tagTypes: [
    'Auth',
    'Restaurant',
    'Order',
    'Menu',
    'Review',
    'Notification',
  ] as const,
  getAccessToken: (state: unknown): string | null =>
    selectAccessToken(state as AuthRoot),
  getRefreshToken: (state: unknown): string | null =>
    selectRefreshToken(state as AuthRoot),
  onCredentialsRefreshed: (pair, raw) => {
    credentialHandlers.onRefreshed?.(pair, raw);
  },
  onTokenReuseDetected: () => {
    void credentialHandlers.onReuseDetected?.();
  },
  onRefreshFailed: () => {
    void credentialHandlers.onRefreshFailed?.();
  },
});

type Pair = { accessToken: string; refreshToken: string };
type Raw = {
  accessToken: string;
  refreshToken: string;
  userType?: string;
  userId?: string;
  isNewUser?: boolean;
};

type CredentialHandlers = {
  onRefreshed?: (pair: Pair, raw?: Raw) => void;
  onReuseDetected?: () => void | Promise<void>;
  onRefreshFailed?: () => void | Promise<void>;
};

const credentialHandlers: CredentialHandlers = {};

/** TD-011: Redux clear + SecureStore clear + API reset. */
async function terminateSession(
  dispatch: (action: unknown) => void,
): Promise<void> {
  await clearRefreshToken();
  dispatch(clearCredentials());
  dispatch(baseApi.util.resetApiState());
}

/** Wire store actions after configureStore (avoids circular import). */
export function bindBaseApiAuthHandlers(dispatch: (action: unknown) => void) {
  credentialHandlers.onRefreshed = (pair, raw) => {
    dispatch(
      setCredentials({
        accessToken: String(pair.accessToken),
        refreshToken: String(pair.refreshToken),
        userType: (raw?.userType as 'RESTAURANT') ?? 'RESTAURANT',
        userId: raw?.userId ?? '',
        isNewUser: raw?.isNewUser,
      }),
    );
  };
  credentialHandlers.onReuseDetected = () => terminateSession(dispatch);
  credentialHandlers.onRefreshFailed = () => terminateSession(dispatch);
}
