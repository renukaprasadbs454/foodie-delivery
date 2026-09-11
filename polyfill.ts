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
