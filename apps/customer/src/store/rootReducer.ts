import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import authReducer from '../features/auth/authSlice';
import connectivityReducer from './connectivitySlice';

/**
 * Root reducer — Blueprint §9.
 * Feature slices added by feature agents later; foundation owns auth + connectivity.
 */
export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  connectivity: connectivityReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
