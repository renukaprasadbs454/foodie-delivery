import React, { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useConnectivity } from 'foodie-shared-rn';
import { useAppDispatch } from '../../store/hooks';
import { setConnectivity } from '../../store/connectivitySlice';
import { runBootstrap } from './bootstrap';

export function BootstrapGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const connectivity = useConnectivity();

  useEffect(() => {
    dispatch(
      setConnectivity({
        isConnected: connectivity.isConnected,
        isInternetReachable: connectivity.isInternetReachable,
      }),
    );
  }, [
    connectivity.isConnected,
    connectivity.isInternetReachable,
    dispatch,
  ]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await runBootstrap(dispatch);
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
