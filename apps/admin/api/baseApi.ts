import { createBaseApi } from 'foodie-shared-web';
import { ENV } from '../constants/env';
import { clearSession } from '../features/auth/authSlice';

/**
 * Single RTK Query API instance — Blueprint §7.4 / §8.
 * baseUrl is same-origin BFF; cookies via credentials: 'include'.
 * Feature agents inject endpoints later; none in Phase 1 foundation.
 */
export const baseApi = createBaseApi({
  baseUrl: ENV.bffBaseUrl,
  /** UI-API cache tags — Auth / Analytics / Restaurant / Review / Delivery / Admin / Order / Payment / Coupon */
  tagTypes: [
    'Auth',
    'Analytics',
    'Restaurant',
    'Review',
    'Delivery',
    'Admin',
    'Order',
    'Payment',
    'Coupon',
  ] as const,
  refreshPath: '/api/auth/refresh',
  onTokenReuseDetected: () => {
    sessionHandlers.onReuseDetected?.();
  },
  onRefreshFailed: () => {
    sessionHandlers.onRefreshFailed?.();
  },
});


type SessionHandlers = {
  onReuseDetected?: () => void;
  onRefreshFailed?: () => void;
};

const sessionHandlers: SessionHandlers = {};

/** Wire store actions after configureStore (avoids circular import). */
export function bindBaseApiAuthHandlers(dispatch: (action: unknown) => void) {
  sessionHandlers.onReuseDetected = () => {
    dispatch(clearSession());
    dispatch(baseApi.util.resetApiState());
  };
  sessionHandlers.onRefreshFailed = () => {
    dispatch(clearSession());
    dispatch(baseApi.util.resetApiState());
  };
}
