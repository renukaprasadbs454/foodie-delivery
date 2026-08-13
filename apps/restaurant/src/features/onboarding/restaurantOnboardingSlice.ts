import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearCredentials } from '../auth/authSlice';
import type { RestaurantStatus } from './types';

export const DEFAULT_DEV_RESTAURANT_ID = 'e125642d-a14a-4e80-8e51-c0534a58b35f';

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
  restaurantId: DEFAULT_DEV_RESTAURANT_ID,
  status: 'APPROVED',
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
      state.status = action.payload.status ?? 'APPROVED';
    },
    setRestaurantStatus(state, action: PayloadAction<RestaurantStatus>) {
      state.status = action.payload;
    },
    setDraftName(state, action: PayloadAction<string>) {
      state.draftName = action.payload;
    },
    clearOnboarding(state) {
      state.restaurantId = DEFAULT_DEV_RESTAURANT_ID;
      state.status = 'APPROVED';
      state.draftName = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearCredentials, (state) => {
      state.restaurantId = DEFAULT_DEV_RESTAURANT_ID;
      state.status = 'APPROVED';
      state.draftName = '';
    });
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
}) => state.restaurantOnboarding.restaurantId || DEFAULT_DEV_RESTAURANT_ID;

export const selectRestaurantOnboardingStatus = (state: {
  restaurantOnboarding: RestaurantOnboardingState;
}) => state.restaurantOnboarding.status || 'APPROVED';

export default restaurantOnboardingSlice.reducer;
