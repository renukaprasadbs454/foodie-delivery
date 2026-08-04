import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearCredentials } from '../auth/authSlice';
import type { RestaurantStatus } from './types';

/**
 * Onboarding session — UI-API restaurantOnboardingFormSlice.
 * Persist restaurantId (+ status) for cold-start Partial OK (GAP-API-03).
 */
export type RestaurantOnboardingState = {
  restaurantId: string | null;
  status: RestaurantStatus | null;
  draftName: string;
};

const initialState: RestaurantOnboardingState = {
  restaurantId: null,
  status: null,
  draftName: '',
};

const restaurantOnboardingSlice = createSlice({
  name: 'restaurantOnboarding',
  initialState,
  reducers: {
    setRestaurantCreated(
      state,
      action: PayloadAction<{ restaurantId: string; status?: RestaurantStatus }>,
    ) {
      state.restaurantId = action.payload.restaurantId;
      state.status = action.payload.status ?? 'PENDING';
    },
    setRestaurantStatus(state, action: PayloadAction<RestaurantStatus>) {
      state.status = action.payload;
    },
    setDraftName(state, action: PayloadAction<string>) {
      state.draftName = action.payload;
    },
    clearOnboarding() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearCredentials, () => initialState);
  },
});

export const {
  setRestaurantCreated,
  setRestaurantStatus,
  setDraftName,
  clearOnboarding,
} = restaurantOnboardingSlice.actions;

export const selectRestaurantId = (state: {
  restaurantOnboarding: RestaurantOnboardingState;
}) => state.restaurantOnboarding.restaurantId;

export const selectRestaurantOnboardingStatus = (state: {
  restaurantOnboarding: RestaurantOnboardingState;
}) => state.restaurantOnboarding.status;

export default restaurantOnboardingSlice.reducer;
