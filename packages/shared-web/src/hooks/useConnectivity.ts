import { useEffect, useState } from 'react';

export type ConnectivityState = {
  isConnected: boolean;
};

/** Browser online/offline — Admin offline architecture analog of Blueprint §32. */
export function useConnectivity(): ConnectivityState {
  const [isConnected, setIsConnected] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const onOnline = () => setIsConnected(true);
    const onOffline = () => setIsConnected(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setIsConnected(navigator.onLine);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { isConnected };
}
