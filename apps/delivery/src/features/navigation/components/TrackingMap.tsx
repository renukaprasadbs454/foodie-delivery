import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

type Props = {
  lastPing: any;
  orderStatus: any;
  leg: string;
  restaurantLocation?: { latitude: number; longitude: number };
  customerLocation?: { latitude: number; longitude: number };
};

export function TrackingMap({ lastPing, orderStatus, leg, restaurantLocation, customerLocation }: Props) {
  const targetLocation = leg === 'pickup' ? restaurantLocation : customerLocation;

  // Immediately fetch current device location so routing works before first ping
  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) {
          const req = await Location.requestForegroundPermissionsAsync();
          if (!req.granted) return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setDeviceLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // Fallback to Bengaluru coords for robust testing
        setDeviceLocation({ latitude: 12.9800, longitude: 77.5900 });
      }
    })();
  }, []);

  // Prefer live ping if available, fall back to device location from initial fetch
  const originLocation = lastPing ?? deviceLocation;

  const centerLat = targetLocation ? targetLocation.latitude : (originLocation?.latitude || 12.9716);
  const centerLng = targetLocation ? targetLocation.longitude : (originLocation?.longitude || 77.5946);

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (originLocation && targetLocation) {
      setLoadingRoute(true);
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/bike/${originLocation.longitude},${originLocation.latitude};${targetLocation.longitude},${targetLocation.latitude}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            setRouteCoords(coords);
            if (mapRef.current) {
              mapRef.current.fitToCoordinates([
                { latitude: originLocation.latitude, longitude: originLocation.longitude },
                { latitude: targetLocation.latitude, longitude: targetLocation.longitude }
              ], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }
        } catch (e) {
          console.warn("Could not fetch route", e);
        } finally {
          setLoadingRoute(false);
        }
      };
      void fetchRoute();
    }
  }, [originLocation?.latitude, originLocation?.longitude, targetLocation?.latitude, targetLocation?.longitude]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {lastPing || deviceLocation ? (
          <Marker
            coordinate={{ latitude: (lastPing ?? deviceLocation)!.latitude, longitude: (lastPing ?? deviceLocation)!.longitude }}
            title="You (Motorcycle)"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.bikeIconContainer}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1048/1048325.png' }} style={styles.bikeIcon} />
            </View>
          </Marker>
        ) : null}

        {targetLocation && (
          <Marker
            coordinate={{ latitude: targetLocation.latitude, longitude: targetLocation.longitude }}
            title={leg === 'pickup' ? 'Restaurant' : 'Customer'}
          />
        )}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#F59E0B"
            strokeWidth={4}
          />
        )}
      </MapView>

      {loadingRoute && (
        <View style={styles.loaderBadge}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  bikeIconContainer: {
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }
  },
  bikeIcon: {
    width: 24,
    height: 24,
  },
  loaderBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(20, 83, 45, 0.8)',
    padding: 8,
    borderRadius: 20,
  }
});
