import './polyfill';
import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import App from './src/core/App';
import './src/features/location/backgroundTask';

if (Platform.OS !== 'web') {
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
        });
        Notifications.setNotificationChannelAsync('delivery-offers', {
            name: 'New Order Offers',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 800, 400, 800, 400, 800],
            sound: 'default',
            lightColor: '#F59E0B',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
        });
    }
}

registerRootComponent(App);
