import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getCurrentDeviceLocation } from './locationService';
import { store } from '@/store/store';
import { deliveryApi } from '@/api/endpoints/deliveryApi';
import { ENV } from '@/constants/env';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Define the headless background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('[BackgroundTask] Error in location task:', error.message);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
            const location = locations[0];
            const { latitude, longitude } = location.coords;

            try {
                // Redux might not be fully persisted/rehydrated in background context immediately,
                // we will fetch using the standard fetch API and SecureStore if needed, or dispatch a thunk.
                // It's safer to use RTK Query manually if configured

                // This relies on store having the mutation available, but Redux store is initialized on module load
                const result = await store.dispatch(
                    deliveryApi.endpoints.locationPing.initiate({
                        latitude,
                        longitude,
                    })
                );

                console.log('[BackgroundTask] Successfully verified background ping:', latitude, longitude);
            } catch (err) {
                console.warn('[BackgroundTask] Ping failed in background:', err);
            }
        }
    }
});

/**
 * Starts the background location tracking.
 */
export async function startBackgroundLocationTracking() {
    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
    if (!isTaskDefined) {
        console.warn('[BackgroundTask] Task is not defined');
        return;
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
        return; // Already running
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        // Distance interval in meters to trigger an update
        distanceInterval: 10,
        // Minimum time in ms between updates
        timeInterval: 15000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: 'Foodie Delivery is Active',
            notificationBody: 'Tracking your location to assign nearby orders',
            notificationColor: '#F59E0B',
        },
        // Pauses tracking automatically when stationary to save battery
        pausesUpdatesAutomatically: true,
    });
}

/**
 * Stops the background location tracking.
 */
export async function stopBackgroundLocationTracking() {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
}
