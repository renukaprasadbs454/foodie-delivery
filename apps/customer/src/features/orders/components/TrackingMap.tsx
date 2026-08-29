import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Text, useTheme, type WebSocketLocation } from 'foodie-shared-rn';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

type Props = {
  location: WebSocketLocation | null;
  orderStatus: string;
  restaurantLocation?: { latitude: number; longitude: number };
  customerLocation?: { latitude: number; longitude: number };
  onEtaUpdate?: (etaMins: number) => void;
};

const DEFAULT_REGION = {
  latitude: 12.9716, // Default: Bengaluru
  longitude: 77.5946,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function TrackingMap({ location, orderStatus, restaurantLocation, customerLocation, onEtaUpdate }: Props) {
  const { tokens } = useTheme();

  const isDriverToResto = orderStatus === 'ASSIGNED' || orderStatus === 'READY_FOR_PICKUP';
  const isAfterPickup = orderStatus === 'OUT_FOR_DELIVERY' || orderStatus === 'DELIVERED' || orderStatus === 'PICKED_UP';

  let targetLocation = isDriverToResto ? restaurantLocation : customerLocation;
  let originLocation = location ? { latitude: location.lat, longitude: location.lng } : null;

  // Mock driver location
  if (!originLocation && isDriverToResto && restaurantLocation) {
    originLocation = {
      latitude: restaurantLocation.latitude + 0.015,
      longitude: restaurantLocation.longitude + 0.015
    };
  } else if (!originLocation && isAfterPickup && restaurantLocation && customerLocation) {
    if (orderStatus === 'OUT_FOR_DELIVERY') {
      originLocation = customerLocation;
    } else {
      originLocation = {
        latitude: restaurantLocation.latitude + (customerLocation.latitude - restaurantLocation.latitude) * 0.5,
        longitude: restaurantLocation.longitude + (customerLocation.longitude - restaurantLocation.longitude) * 0.5
      };
    }
  }

  // Fallback map view if still no origin
  let fallbackMode = false;
  if (!originLocation && restaurantLocation && customerLocation) {
    originLocation = restaurantLocation;
    fallbackMode = true;
  }

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (originLocation && targetLocation && restaurantLocation && customerLocation) {
      setLoadingRoute(true);
      const fetchRoute = async () => {
        try {
          // Calculate direct route for map polyline
          const res = await fetch(`https://router.project-osrm.org/route/v1/bike/${originLocation?.longitude},${originLocation?.latitude};${targetLocation?.longitude},${targetLocation?.latitude}?overview=full&geometries=geojson`);
          const data = await res.json();
          let currentRouteEta = 0;
          if (data && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            setRouteCoords(coords);
            currentRouteEta = Math.ceil(data.routes[0].duration / 60);

            if (mapRef.current) {
              mapRef.current.fitToCoordinates([originLocation, targetLocation, restaurantLocation], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }

          // Calculate full ETA sum if driver is heading to resto
          if (isDriverToResto && onEtaUpdate) {
            const res2 = await fetch(`https://router.project-osrm.org/route/v1/bike/${restaurantLocation.longitude},${restaurantLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?overview=false`);
            const data2 = await res2.json();
            let secondLegEta = 0;
            if (data2 && data2.routes && data2.routes.length > 0) {
              secondLegEta = Math.ceil(data2.routes[0].duration / 60);
            }
            onEtaUpdate(currentRouteEta + secondLegEta + 5); // total eta + 5 min buffer
          } else if (onEtaUpdate) {
            onEtaUpdate(currentRouteEta);
          }

        } catch (e) {
          console.warn("Could not fetch route", e);
        } finally {
          setLoadingRoute(false);
        }
      };

      void fetchRoute();
      const intervalId = setInterval(() => {
        void fetchRoute();
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [originLocation?.latitude, originLocation?.longitude, targetLocation?.latitude, targetLocation?.longitude]);

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrapper, {
        borderColor: '#F59E0B',
        borderWidth: 3,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#14532D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10
      }]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={originLocation ? {
            latitude: originLocation.latitude,
            longitude: originLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : DEFAULT_REGION}
          showsUserLocation={true}
        >
          {originLocation && (
            <Marker coordinate={originLocation} title={fallbackMode ? "Restaurant" : "Delivery Partner"} zIndex={10}>
              <View style={[styles.markerBody, { backgroundColor: '#14532D' }]}>
                <Text style={{ fontSize: 18 }}>{fallbackMode ? "🏪" : "🛵"}</Text>
              </View>
            </Marker>
          )}

          {targetLocation && !isDriverToResto && (
            <Marker coordinate={customerLocation!} title="Home" zIndex={5}>
              <View style={[styles.markerBody, { backgroundColor: '#2563EB' }]}>
                <Text style={{ fontSize: 16 }}>🏠</Text>
              </View>
            </Marker>
          )}

          {restaurantLocation && (
            <Marker coordinate={restaurantLocation} title="Restaurant" zIndex={6}>
              <View style={[styles.markerBody, { backgroundColor: '#B91C1C' }]}>
                <Text style={{ fontSize: 16 }}>🏪</Text>
              </View>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#14532D"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -20, // Let map overlap slightly with curved header
    marginBottom: 8,
  },
  mapWrapper: {
    height: Dimensions.get('window').height * 0.45,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerBody: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
