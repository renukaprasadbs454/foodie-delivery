import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Foreground/background transitions — Blueprint §5 / §13.4 / §34.
 * Apps wire proactive token refresh and WebSocket lifecycle from this hook.
 */
export function useAppStateChange(
  onChange: (next: AppStateStatus, previous: AppStateStatus) => void,
): void {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    let previous = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      callbackRef.current(next, previous);
      previous = next;
    });
    return () => sub.remove();
  }, []);
}
