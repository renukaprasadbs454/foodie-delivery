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
import {
  setRestaurantCreated,
  clearOnboarding,
} from '../onboarding/restaurantOnboardingSlice';
import type { RestaurantStatus } from '../onboarding/types';
import { websocketDisconnect } from '../../store/websocketMiddleware';

/** Apply contracted token data to SecureStore + authSlice (P2-AUTH-02). */
export async function applyAuthSession(
  dispatch: AppDispatch,
  data: AuthTokenData,
): Promise<void> {
  await saveRefreshToken(data.refreshToken);
  dispatch(
    setCredentials({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userType: (data.userType as UserType) || 'RESTAURANT',
      userId: data.userId,
      isNewUser: data.isNewUser,
    }),
  );

  const restaurantId =
    data.restaurantId ??
    data.restaurant?.restaurantId ??
    data.restaurant?.id;

  if (restaurantId) {
    console.log('[AUTH] Login successful, stored restaurantId:', restaurantId);
    dispatch(
      setRestaurantCreated({
        restaurantId,
        status: (data.restaurant?.status as RestaurantStatus) ?? 'APPROVED',
      }),
    );
  } else {
    console.log('[AUTH] Login successful — restaurantId not in auth token response');
  }
}

/**
 * Backend logout then local teardown — System Design §7.
 * Always clears local session even if the network call fails.
 */
export async function logoutRestaurant(
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
      // Still clear local session.
    }
  }
  dispatch(websocketDisconnect());
  await clearRefreshToken();
  dispatch(clearOnboarding());
  dispatch(clearCredentials());
  dispatch(baseApi.util.resetApiState());
}
