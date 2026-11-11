import React, { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setConnectivity } from '@/store/connectivitySlice';
import { selectAuthStatus, setAuthStatus } from '@/features/auth/authSlice';
import { runBootstrap } from './bootstrap';

export function BootstrapGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
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
      try {
        await Promise.race([
          runBootstrap(dispatch),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      } catch (err) {
        console.warn('[BootstrapGate] Bootstrap error:', err);
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (ready && (authStatus === 'idle' || authStatus === 'authenticating')) {
      dispatch(setAuthStatus('unauthenticated'));
    }
  }, [ready, authStatus, dispatch]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return <>{children}</>;
}
