import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useLocationPingMutation, useSetAvailabilityMutation } from '@/api/endpoints/deliveryApi';
import { useAppSelector } from '@/store/hooks';
import { selectIsOnline } from '@/features/home/availabilitySlice';

export function useDeliveryPresence() {
  const isOnline = useAppSelector(selectIsOnline);
  const [locationPing] = useLocationPingMutation();
  const [setAvailability] = useSetAvailabilityMutation();

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOnline) {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    const sendPing = async () => {
      try {
        let lat = 13.3400;
        let lng = 77.1000;

        try {
          const loc = await Location.getLastKnownPositionAsync({}) || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          if (loc?.coords) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          }
        } catch {
          // fallback location
        }

        await locationPing({ latitude: lat, longitude: lng }).unwrap();
      } catch {
        // silent ping error catch
      }
    };

    // Send initial ping immediately when going online
    void sendPing();

    // Ping every 12 seconds to keep presence active on backend
    pingIntervalRef.current = setInterval(() => {
      void sendPing();
    }, 12000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [isOnline, locationPing]);

  // Clean up online presence when app is closed / component unmounted
  useEffect(() => {
    return () => {
      if (isOnline) {
        void setAvailability({ isOnline: false });
      }
    };
  }, []);
}
