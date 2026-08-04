import { useEffect, useRef } from 'react';

/**
 * Document visibility changes — web analog of useAppStateChange.
 * Used for proactive session checks / WS lifecycle in Admin.
 */
export function useDocumentVisibility(
  onChange: (state: DocumentVisibilityState) => void,
): void {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    const handler = () => callbackRef.current(document.visibilityState);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
}
