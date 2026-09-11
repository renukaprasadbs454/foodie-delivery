import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * connectivitySlice — Blueprint §32.
 * Cross-cutting infrastructure state; not a business feature slice.
 */
export type ConnectivityState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

const initialState: ConnectivityState = {
  isConnected: true,
  isInternetReachable: null,
};

const connectivitySlice = createSlice({
  name: 'connectivity',
  initialState,
  reducers: {
    setConnectivity(state, action: PayloadAction<ConnectivityState>) {
      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
    },
  },
});

export const { setConnectivity } = connectivitySlice.actions;

export const selectIsConnected = (state: { connectivity: ConnectivityState }) =>
  state.connectivity.isConnected;

export default connectivitySlice.reducer;
