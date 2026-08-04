import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * connectivitySlice — Blueprint §32 (Admin web analog).
 * Mirrors foodie-shared-web useConnectivity (isConnected only).
 */
export type ConnectivityState = {
  isConnected: boolean;
};

const initialState: ConnectivityState = {
  isConnected: true,
};

const connectivitySlice = createSlice({
  name: 'connectivity',
  initialState,
  reducers: {
    setConnectivity(state, action: PayloadAction<ConnectivityState>) {
      state.isConnected = action.payload.isConnected;
    },
  },
});

export const { setConnectivity } = connectivitySlice.actions;

export const selectIsConnected = (state: { connectivity: ConnectivityState }) =>
  state.connectivity.isConnected;

export default connectivitySlice.reducer;
