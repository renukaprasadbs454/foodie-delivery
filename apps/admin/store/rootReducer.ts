import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import authReducer from '../features/auth/authSlice';
import connectivityReducer from './connectivitySlice';
import moduleReducer from './moduleSlice';

/**
 * Root reducer — Blueprint §9.
 * Foundation owns auth + connectivity + active module state.
 */
export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  connectivity: connectivityReducer,
  module: moduleReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
