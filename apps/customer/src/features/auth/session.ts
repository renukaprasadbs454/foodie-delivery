import {
  clearRefreshToken,
  saveRefreshToken,
  type UserType,
} from 'foodie-shared-rn';
import { baseApi } from '../../api/baseApi';
import type { AuthTokenData } from '../../api/endpoints/authApi';
import { authApi } from '../../api/endpoints/authApi';
import { clearCredentials, setCredentials } from './authSlice';
import type { AppDispatch, RootState } from '../../store/store';

/** Apply contracted token data to SecureStore + authSlice (P2-AUTH-01). */
export async function applyAuthSession(
  dispatch: AppDispatch,
  data: AuthTokenData,
): Promise<void> {
  await saveRefreshToken(data.refreshToken);
  dispatch(
    setCredentials({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userType: (data.userType as UserType) || 'CUSTOMER',
      userId: data.userId,
      isNewUser: data.isNewUser,
    }),
  );
}

/**
 * Backend logout then local teardown — System Design §7 / UI-API Settings logout.
 * Always clears local session even if the network call fails.
 */
export async function logoutCustomer(
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<void> {
  const refreshToken = getState().auth.refreshToken;
  if (refreshToken) {
    try {
      await dispatch(
        authApi.endpoints.logout.initiate({ refreshToken }),
      ).unwrap();
    } catch {
      // Still clear local session (UI-API: UNAUTHORIZED → clearCredentials).
    }
  }
  await clearRefreshToken();
  dispatch(clearCredentials());
  dispatch(baseApi.util.resetApiState());
}
