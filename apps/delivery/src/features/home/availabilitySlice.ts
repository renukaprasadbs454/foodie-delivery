import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearCredentials } from '../auth/authSlice';
import type { ActiveAssignmentRef } from './types';

/**
 * Session availability + active assignment — P2-DEL-02.
 * Not persisted (GAP-API-08: no GET /delivery/me for isOnline rehydrate).
 */
export type AvailabilityUiState = {
  isOnline: boolean;
  activeAssignment: ActiveAssignmentRef | null;
  rejectedOffers: string[];
};

const initialState: AvailabilityUiState = {
  isOnline: false,
  activeAssignment: null,
  rejectedOffers: [],
};

const availabilitySlice = createSlice({
  name: 'availability',
  initialState,
  reducers: {
    setIsOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setActiveAssignment(
      state,
      action: PayloadAction<ActiveAssignmentRef | null>,
    ) {
      state.activeAssignment = action.payload;
    },
    addRejectedOffer(state, action: PayloadAction<string>) {
      if (!state.rejectedOffers.includes(action.payload)) {
        state.rejectedOffers.push(action.payload);
      }
    },
    clearAvailability() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearCredentials, () => initialState);
  },
});

export const { setIsOnline, setActiveAssignment, addRejectedOffer, clearAvailability } =
  availabilitySlice.actions;

export const selectIsOnline = (state: { availability: AvailabilityUiState }) =>
  state.availability.isOnline;

export const selectActiveAssignment = (state: {
  availability: AvailabilityUiState;
}) => state.availability.activeAssignment;

export const selectRejectedOffers = (state: {
  availability: AvailabilityUiState;
}) => state.availability.rejectedOffers;

export default availabilitySlice.reducer;
