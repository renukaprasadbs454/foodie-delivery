import reducer, {
  clearAvailability,
  setActiveAssignment,
  setIsOnline,
} from '../features/home/availabilitySlice';
import { clearCredentials } from '../features/auth/authSlice';

describe('availabilitySlice (P2-DEL-02)', () => {
  it('tracks online flag and active assignment', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, setIsOnline(true));
    expect(state.isOnline).toBe(true);
    state = reducer(
      state,
      setActiveAssignment({
        assignmentId: 'a1',
        orderId: 'o1',
      }),
    );
    expect(state.activeAssignment?.orderId).toBe('o1');
  });

  it('clears on logout', () => {
    let state = reducer(undefined, setIsOnline(true));
    state = reducer(
      state,
      setActiveAssignment({ assignmentId: 'a1', orderId: 'o1' }),
    );
    state = reducer(state, clearCredentials());
    expect(state.isOnline).toBe(false);
    expect(state.activeAssignment).toBeNull();
    state = reducer(undefined, setIsOnline(true));
    state = reducer(state, clearAvailability());
    expect(state.isOnline).toBe(false);
  });
});
