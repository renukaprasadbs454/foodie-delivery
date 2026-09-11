import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

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
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    const apply = (next: NetInfoState) => {
      setState({
        isConnected: Boolean(next.isConnected),
        isInternetReachable: next.isInternetReachable,
        type: next.type ?? null,
      });
    };

    const unsubscribe = NetInfo.addEventListener(apply);
    void NetInfo.fetch().then(apply);
    return unsubscribe;
  }, []);

  return state;
}
