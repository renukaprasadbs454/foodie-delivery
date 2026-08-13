import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'foodie-shared-rn';
import {
  formatCoordinates,
  isValidCoordinate,
} from '../location/locationTypes';

interface Props {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: number;
}

const MARKER_COLOR = '#F59E0B'; // Amber Accent Color
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function buildMapHtml(lat: number, lng: number, zoom: number, apiKey: string): string {
  if (apiKey) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}"></script>
  <script>
    var lat = ${lat};
    var lng = ${lng};
    var zoom = ${zoom};

    var map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: lat, lng: lng },
      zoom: zoom,
      disableDefaultUI: true,
      cursor: 'default'
    });

    var marker = new google.maps.Marker({
      position: { lat: lat, lng: lng },
      map: map,
      draggable: true,
      title: 'Restaurant Location'
    });

    function notifyParent(newLat, newLng, newZoom) {
      window.parent.postMessage({
        type: 'LOCATION_CHANGED',
        lat: Number(newLat.toFixed(6)),
        lng: Number(newLng.toFixed(6)),
        zoom: newZoom || map.getZoom()
      }, '*');
    }

    marker.addListener('dragend', function() {
      var pos = marker.getPosition();
      notifyParent(pos.lat(), pos.lng());
    });

    map.addListener('click', function(e) {
      marker.setPosition(e.latLng);
      notifyParent(e.latLng.lat(), e.latLng.lng());
    });

    map.addListener('zoom_changed', function() {
      var pos = marker.getPosition();
      notifyParent(pos.lat(), pos.lng(), map.getZoom());
    });

    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data) return;
      if (data.type === 'SET_LOCATION') {
        var nLat = Number(data.lat);
        var nLng = Number(data.lng);
        if (!isNaN(nLat) && !isNaN(nLng)) {
          var p = { lat: nLat, lng: nLng };
          marker.setPosition(p);
          map.setCenter(p);
          if (data.zoom) map.setZoom(data.zoom);
        }
      } else if (data.type === 'ZOOM_IN') {
        map.setZoom(Math.min(map.getZoom() + 1, 20));
      } else if (data.type === 'ZOOM_OUT') {
        map.setZoom(Math.max(map.getZoom() - 1, 5));
      }
    });
  </script>
</body>
</html>`;
  }

  // Interactive OpenStreetMap + Leaflet HTML for web/demo mode
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #e2e8f0; }
    .custom-pin {
      cursor: grab !important;
    }
    .custom-pin:active {
      cursor: grabbing !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var initialLat = ${lat};
    var initialLng = ${lng};
    var initialZoom = ${zoom};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-pin',
      html: '<div style="position:relative;width:40px;height:40px;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;"><div style="width:36px;height:36px;border-radius:18px;background:#F59E0B;border:2.5px solid #FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);"><span style="font-size:18px;">📍</span></div><div style="width:3px;height:6px;background:#0F172A;"></div><div style="width:14px;height:4px;border-radius:7px;background:rgba(15,23,42,0.3);margin-top:-1px;"></div></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    var marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    function notifyParent(latVal, lngVal, zoomVal) {
      window.parent.postMessage({
        type: 'LOCATION_CHANGED',
        lat: Number(latVal.toFixed(6)),
        lng: Number(lngVal.toFixed(6)),
        zoom: zoomVal || map.getZoom()
      }, '*');
    }

    marker.on('dragend', function() {
      var pos = marker.getLatLng();
      notifyParent(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyParent(e.latlng.lat, e.latlng.lng);
    });

    map.on('zoomend', function() {
      var pos = marker.getLatLng();
      notifyParent(pos.lat, pos.lng, map.getZoom());
    });

    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data) return;
      if (data.type === 'SET_LOCATION') {
        var nLat = Number(data.lat);
        var nLng = Number(data.lng);
        if (!isNaN(nLat) && !isNaN(nLng)) {
          marker.setLatLng([nLat, nLng]);
          map.setView([nLat, nLng], data.zoom || map.getZoom(), { animate: true });
        }
      } else if (data.type === 'ZOOM_IN') {
        map.zoomIn();
      } else if (data.type === 'ZOOM_OUT') {
        map.zoomOut();
      }
    });
  </script>
</body>
</html>`;
}

export function RestaurantLocationMap({
  latitude,
  longitude,
  onLocationSelect,
  height = 280,
}: Props) {
  const [zoomLevel, setZoomLevel] = useState(15);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Safe validation fallback to default Bengaluru coordinates (NEVER NaN)
  const safeLat = isValidCoordinate(latitude, longitude) ? Number(latitude) : 12.9352;
  const safeLng = isValidCoordinate(latitude, longitude) ? Number(longitude) : 77.6245;

  const lastIframeCoordsRef = useRef<{ lat: number; lng: number }>({ lat: safeLat, lng: safeLng });

  const mapHtml = useMemo(
    () => buildMapHtml(safeLat, safeLng, zoomLevel, GOOGLE_MAPS_API_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [GOOGLE_MAPS_API_KEY],
  );

  // Listen to postMessage from iframe map engine (marker drag or map click)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LOCATION_CHANGED') {
        const { lat, lng, zoom } = event.data;
        if (isValidCoordinate(lat, lng)) {
          lastIframeCoordsRef.current = { lat, lng };
          if (typeof zoom === 'number' && zoom >= 5 && zoom <= 20) {
            setZoomLevel(zoom);
          }
          onLocationSelect(lat, lng);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLocationSelect]);

  // Synchronize map iframe whenever safeLat/safeLng changes externally (e.g. Address Search, GPS button, or form)
  useEffect(() => {
    const latDiff = Math.abs(lastIframeCoordsRef.current.lat - safeLat);
    const lngDiff = Math.abs(lastIframeCoordsRef.current.lng - safeLng);

    // If safeLat or safeLng differ from what the iframe last reported, post SET_LOCATION to move iframe camera & marker
    if (latDiff > 0.00001 || lngDiff > 0.00001) {
      lastIframeCoordsRef.current = { lat: safeLat, lng: safeLng };
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_LOCATION', lat: safeLat, lng: safeLng, zoom: zoomLevel },
          '*',
        );
      }
    }
  }, [safeLat, safeLng, zoomLevel]);

  const handleZoomIn = () => {
    const nextZoom = Math.min(zoomLevel + 1, 20);
    setZoomLevel(nextZoom);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'ZOOM_IN' }, '*');
    }
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(zoomLevel - 1, 5);
    setZoomLevel(nextZoom);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'ZOOM_OUT' }, '*');
    }
  };

  const handleRecenter = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_LOCATION', lat: safeLat, lng: safeLng, zoom: 15 },
        '*',
      );
    }
    setZoomLevel(15);
    onLocationSelect(safeLat, safeLng);
  };

  return (
    <View
      style={{
        height,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#E2E8F0',
        position: 'relative',
      }}
    >
      {/* INTERACTIVE MAP ENGINE IFRAME */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            width="100%"
            height="100%"
            style={{ border: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
            title="Interactive Restaurant Map"
          />
        ) : (
          /* Native Map Simulation Container */
          <View style={styles.nativeFallbackContainer}>
            <Text variant="caption" style={{ color: '#475569' }}>
              Interactive Map ({formatCoordinates(safeLat, safeLng)})
            </Text>
          </View>
        )}
      </View>

      {/* TOP-LEFT COORDINATES BANNER OVERLAY - NEVER DISPLAYS NaN */}
      <View style={styles.coordOverlay} pointerEvents="none">
        <Text style={{ color: MARKER_COLOR, fontSize: 11, fontWeight: '700' }}>
          ● {GOOGLE_MAPS_API_KEY ? 'Google Maps' : 'Interactive Map'}
        </Text>
        <Text style={{ color: '#F8FAFC', fontSize: 11, fontWeight: '600' }}>
          {formatCoordinates(safeLat, safeLng)}
        </Text>
      </View>

      {/* API KEY NOTICE BANNER */}
      {!GOOGLE_MAPS_API_KEY ? (
        <View style={styles.noticeBanner} pointerEvents="none">
          <Text style={{ color: '#92400E', fontSize: 10, fontWeight: '600' }}>
            Drag marker or tap map to place pin · OpenStreetMap Interactive Mode
          </Text>
        </View>
      ) : null}

      {/* FUNCTIONAL ZOOM & RECENTER CONTROLS */}
      <View style={styles.controlsContainer} pointerEvents="box-none">
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [
            styles.controlButton,
            pressed && { backgroundColor: '#FEF3C7' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Recenter map to selected coordinates"
        >
          <Text style={{ fontSize: 16 }}>🎯</Text>
        </Pressable>

        <Pressable
          onPress={handleZoomIn}
          disabled={zoomLevel >= 20}
          style={({ pressed }) => [
            styles.controlButton,
            zoomLevel >= 20 && { opacity: 0.5 },
            pressed && { backgroundColor: '#FEF3C7' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Zoom in map"
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>+</Text>
        </Pressable>

        <Pressable
          onPress={handleZoomOut}
          disabled={zoomLevel <= 5}
          style={({ pressed }) => [
            styles.controlButton,
            zoomLevel <= 5 && { opacity: 0.5 },
            pressed && { backgroundColor: '#FEF3C7' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Zoom out map"
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>−</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeFallbackContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  noticeBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    zIndex: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    gap: 8,
    zIndex: 20,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
