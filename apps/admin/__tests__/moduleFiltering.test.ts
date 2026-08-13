import moduleReducer, { setActiveModule } from '../store/moduleSlice';

describe('Food Module Switcher Redux State', () => {
  it('defaults activeModule to FOOD', () => {
    const state = moduleReducer(undefined, { type: '@@INIT' });
    expect(state.activeModule).toBe('FOOD');
  });

  it('updates activeModule to RESTAURANTS when switching to Fine Dining & Pizzerias', () => {
    const state = moduleReducer({ activeModule: 'FOOD' }, setActiveModule('RESTAURANTS'));
    expect(state.activeModule).toBe('RESTAURANTS');
  });

  it('updates activeModule to CAFES when switching to Cafes & Bakery', () => {
    const state = moduleReducer({ activeModule: 'FOOD' }, setActiveModule('CAFES'));
    expect(state.activeModule).toBe('CAFES');
  });

  it('updates activeModule to CLOUD_KITCHEN when switching to Cloud Kitchens', () => {
    const state = moduleReducer({ activeModule: 'FOOD' }, setActiveModule('CLOUD_KITCHEN'));
    expect(state.activeModule).toBe('CLOUD_KITCHEN');
  });
});
