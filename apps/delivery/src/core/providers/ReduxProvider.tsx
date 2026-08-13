import React, { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import { persistor, store } from '../../store/store';

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        }
        persistor={persistor}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {children as any}
      </PersistGate>
    </Provider>
  );
}
