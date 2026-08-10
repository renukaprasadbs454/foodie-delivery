import { configureStore } from '@reduxjs/toolkit';
import { baseApi, bindBaseApiAuthHandlers } from '../api/baseApi';
import '../api/endpoints/analyticsApi';
import '../api/endpoints/authApi';
import '../api/endpoints/couponsApi';
import '../api/endpoints/deliveryPartnersApi';
import '../api/endpoints/ordersApi';
import '../api/endpoints/paymentsApi';
import '../api/endpoints/restaurantsApi';
import '../api/endpoints/auditLogsApi';
import { rootReducer } from './rootReducer';
import { websocketMiddleware } from './websocketMiddleware';

/**
 * Admin store — Blueprint §9.
 * No redux-persist for tokens (httpOnly cookies own session — §12.1).
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, websocketMiddleware),
});

bindBaseApiAuthHandlers(store.dispatch as (action: unknown) => void);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
