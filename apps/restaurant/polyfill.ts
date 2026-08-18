// Polyfill React Native feature flags for Expo Go VirtualizedList compatibility
try {
    const g = globalThis as any;
    if (!g.ReactNativeFeatureFlags) {
        g.ReactNativeFeatureFlags = {};
    }
    if (typeof g.ReactNativeFeatureFlags.enableOptimisedVirtualizedCells !== 'function') {
        g.ReactNativeFeatureFlags.enableOptimisedVirtualizedCells = () => false;
    }
} catch {
    // Ignore
}

try {
    const featureFlags = require('react-native/Libraries/ReactNative/ReactNativeFeatureFlags');
    if (featureFlags) {
        if (typeof featureFlags.enableOptimisedVirtualizedCells !== 'function') featureFlags.enableOptimisedVirtualizedCells = () => false;
        if (featureFlags.default && typeof featureFlags.default.enableOptimisedVirtualizedCells !== 'function') featureFlags.default.enableOptimisedVirtualizedCells = () => false;
    }
} catch (e) { }

try {
    const priv = require('react-native/src/private/featureflags/ReactNativeFeatureFlags');
    if (priv) {
        if (typeof priv.enableOptimisedVirtualizedCells !== 'function') priv.enableOptimisedVirtualizedCells = () => false;
        if (priv.default && typeof priv.default.enableOptimisedVirtualizedCells !== 'function') priv.default.enableOptimisedVirtualizedCells = () => false;
    }
} catch (e) { }
