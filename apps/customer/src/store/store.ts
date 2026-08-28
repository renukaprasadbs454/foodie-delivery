import { configureStore, type Reducer } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTransform } from 'redux-persist';
import { baseApi, bindBaseApiAuthHandlers } from '../api/baseApi';
import '../api/endpoints/authApi';
import '../api/endpoints/restaurantsApi';
import '../api/endpoints/menuApi';
import '../api/endpoints/cartApi';
import '../api/endpoints/addressesApi';
import '../api/endpoints/usersApi';
import '../api/endpoints/couponsApi';
import '../api/endpoints/ordersApi';
import '../api/endpoints/paymentsApi';
import '../api/endpoints/reviewsApi';
import '../api/endpoints/notificationsApi';
import '../api/endpoints/walletApi';
import type { AuthState } from '../features/auth/authSlice';
import { rootReducer, type RootReducerState } from './rootReducer';
import { websocketMiddleware } from './websocketMiddleware';

/**
 * TD-010 / System Design §7.1 / UI-API persisted state:
 * Persist non-sensitive auth fields only — never accessToken or refreshToken.
 * Refresh rehydrates exclusively from expo-secure-store in bootstrap.
 */
const stripAuthTokensTransform = createTransform<AuthState, AuthState>(
  (inbound) => ({
    ...inbound,
    accessToken: null,
    refreshToken: null,
  }),
  (outbound) => ({
    ...outbound,
    accessToken: null,
    refreshToken: null,
  }),
  { whitelist: ['auth'] },
);

const persistConfig = {
  key: 'foodie-customer',
  storage: AsyncStorage,
  whitelist: ['auth'],
  transforms: [stripAuthTokensTransform],
};

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer as Reducer,
) as unknown as Reducer<RootReducerState>;

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware, websocketMiddleware),
});

bindBaseApiAuthHandlers(store.dispatch as (action: unknown) => void);

export const persistor = persistStore(store);

export type RootState = RootReducerState;
export type AppDispatch = typeof store.dispatch;
