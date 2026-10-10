import './polyfill';
import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import App from './src/core/App';
import './src/features/location/backgroundTask';

// Global error protection to prevent crashes on native release builds
if (typeof (globalThis as any).ErrorUtils !== 'undefined') {
    const errorUtils = (globalThis as any).ErrorUtils;
    const previousHandler = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler?.((error: any, isFatal: boolean) => {
        console.warn('[GlobalErrorHandler] Caught error (fatal=' + isFatal + '):', error);
        if (previousHandler) {
            try {
                previousHandler(error, false);
            } catch (hErr) {
                console.warn('[GlobalErrorHandler] Handler threw:', hErr);
            }
        }
    });
}

if (Platform.OS !== 'web') {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 500, 200, 500],
                lightColor: '#F59E0B',
            }).catch((err) => {
                console.warn('[NotificationChannel] default failed:', err);
            });

            Notifications.setNotificationChannelAsync('delivery-offers', {
                name: 'New Order Offers',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 800, 400, 800, 400, 800],
                sound: 'default',
                lightColor: '#F59E0B',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
            }).catch((err) => {
                console.warn('[NotificationChannel] delivery-offers failed:', err);
            });
        }
    } catch (err) {
        console.warn('[Notifications] setup error:', err);
    }
}

registerRootComponent(App);
