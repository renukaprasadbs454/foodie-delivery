import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import authReducer from '../features/auth/authSlice';
import availabilityReducer from '../features/home/availabilitySlice';
import kycFormReducer from '../features/kyc/kycFormSlice';
import connectivityReducer from './connectivitySlice';

/**
 * Root reducer — Blueprint §9 / P2-DEL-01 / P2-DEL-02.
 * kycForm + availability are session-only (not persisted).
 */
export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  kycForm: kycFormReducer,
  availability: availabilityReducer,
  connectivity: connectivityReducer,
});

export type RootReducerState = ReturnType<typeof rootReducer>;
