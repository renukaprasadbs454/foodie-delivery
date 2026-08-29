'use client';

import React, { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
  ThemeProvider,
  useConnectivity,
  ErrorBoundaryFallback,
} from 'foodie-shared-web';
import { ConnectivityBanner } from '@/components/ConnectivityBanner';
import { store } from '@/store/store';
import { useAppDispatch } from '@/store/hooks';
import { setConnectivity } from '@/store/connectivitySlice';
import { runBootstrap } from '@/lib/bootstrap';

function ConnectivityBridge({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const connectivity = useConnectivity();

  useEffect(() => {
    dispatch(
      setConnectivity({
        isConnected: connectivity.isConnected,
      }),
    );
  }, [connectivity.isConnected, dispatch]);

  return <>{children}</>;
}

function BootstrapGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = React.useState(false);

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
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}

class RootErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          title="Something went wrong"
          onAction={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}

import { PermissionProvider } from '@/context/PermissionContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RootErrorBoundary>
      <Provider store={store}>
        <ThemeProvider initialMode="light" applyToDocument>
          <PermissionProvider>
            <ConnectivityBridge>
              <ConnectivityBanner />
              <BootstrapGate>{children}</BootstrapGate>
            </ConnectivityBridge>
          </PermissionProvider>
        </ThemeProvider>
      </Provider>
    </RootErrorBoundary>
  );
}
