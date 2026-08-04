import { trackAnalyticsEvent } from 'foodie-shared-web';
import { baseApi } from '@/api/baseApi';
import { authApi } from '@/api/endpoints/authApi';
import { clearSession } from './authSlice';
import type { AppDispatch } from '@/store/store';

/**
 * Admin logout — clear BFF cookies + Redux + RTK (P2-AUTH-04).
 * Always clears local session even if the BFF call fails.
 */
export async function logoutAdmin(dispatch: AppDispatch): Promise<void> {
  trackAnalyticsEvent('logout_tapped');
  try {
    await dispatch(authApi.endpoints.logout.initiate()).unwrap();
  } catch {
    // Still clear local session.
  }
  dispatch(clearSession());
  dispatch(baseApi.util.resetApiState());
  trackAnalyticsEvent('session_logged_out');
}
