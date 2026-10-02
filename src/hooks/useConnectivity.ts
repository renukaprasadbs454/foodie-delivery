import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export type ConnectivityState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
};

/**
 * Network-state detection — Blueprint §5 / §32.
 * Apps sync this into connectivitySlice; this hook is the single sensor source.
 */
export function useConnectivity(): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    const apply = (next: { isConnected: boolean | null; isInternetReachable: boolean | null; type: NetInfoStateType | string | null }) => {
      const webOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true;
      const connected = next.isConnected === false && !webOnline ? false : true;
      setState({
        isConnected: connected,
        isInternetReachable: next.isInternetReachable ?? webOnline,
        type: next.type ?? null,
      });
    };

    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => apply(netState));
    void NetInfo.fetch().then((netState: NetInfoState) => apply(netState));

    const handleWebOnline = () => apply({ isConnected: true, isInternetReachable: true, type: NetInfoStateType.wifi, details: null } as unknown as NetInfoState);
    const handleWebOffline = () => apply({ isConnected: false, isInternetReachable: false, type: NetInfoStateType.none, details: null } as unknown as NetInfoState);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleWebOnline);
      window.addEventListener('offline', handleWebOffline);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleWebOnline);
        window.removeEventListener('offline', handleWebOffline);
      }
    };
  }, []);

  return state;
}
