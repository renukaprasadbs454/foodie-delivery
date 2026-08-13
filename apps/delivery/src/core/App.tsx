import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  ErrorBoundaryFallback,
  captureCrashException,
} from 'foodie-shared-rn';
import { StyleSheet, View } from 'react-native';
import { RootNavigator } from '../navigation/RootNavigator';
import { BootstrapGate } from './bootstrap/BootstrapGate';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { PushRegistrationBridge } from './push/PushRegistrationBridge';
import { NavigationProvider } from './providers/NavigationProvider';
import { ReduxProvider } from './providers/ReduxProvider';
import { ThemeProvider } from './providers/ThemeProvider';

type BoundaryState = { hasError: boolean };

class RootErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  override state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    captureCrashException(error, { screenName: 'RootErrorBoundary' });
    console.error(info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          variant="root"
          onAction={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Root composition — Blueprint §2.1.
 * Providers only + navigation; no business screens.
 */
export default function App() {
  return (
    <RootErrorBoundary>
      <ReduxProvider>
        <ThemeProvider>
          <NavigationProvider>
            <BootstrapGate>
              <View style={styles.shell}>
                <ConnectivityBanner />
                <PushRegistrationBridge />
                <View style={styles.content}>
                  <RootNavigator />
                </View>
              </View>
            </BootstrapGate>
          </NavigationProvider>
        </ThemeProvider>
      </ReduxProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  content: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
