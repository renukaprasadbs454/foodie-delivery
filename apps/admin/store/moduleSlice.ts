import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MarketplaceModule } from '@/components/ModuleSwitcher';
import type { RootState } from './store';

interface ModuleState {
  activeModule: MarketplaceModule;
}

const initialState: ModuleState = {
  activeModule: 'FOOD',
};

export const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {
    setActiveModule: (state, action: PayloadAction<MarketplaceModule>) => {
      state.activeModule = action.payload;
    },
  },
});

export const { setActiveModule } = moduleSlice.actions;

export const selectActiveModule = (state: RootState): MarketplaceModule =>
  state.module?.activeModule ?? 'FOOD';

export default moduleSlice.reducer;
