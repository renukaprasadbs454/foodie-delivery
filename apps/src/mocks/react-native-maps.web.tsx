import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
// @ts-ignore
import ReactDOM from 'react-dom';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

interface MapContextValue {
  map: any;
  L: any;
}

const MapContext = createContext<MapContextValue | null>(null);

// Helper to dynamically load Leaflet once
let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    // 1. Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet Custom Styles to integrate seamlessly with React Native Web
    if (!document.getElementById('leaflet-rn-custom-css')) {
      const style = document.createElement('style');
      style.id = 'leaflet-rn-custom-css';
      style.innerHTML = `
        .foodie-map-container,
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          font-family: inherit;
          z-index: 1;
        }
        .foodie-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .foodie-marker-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
        }
        .foodie-map-google-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          z-index: 1000;
          pointer-events: none;
          background: rgba(255, 255, 255, 0.9);
          padding: 3px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          font-size: 11px;
          font-weight: 700;
          color: #3C4043;
        }
      `;
      document.head.appendChild(style);
    }

    // 3. Inject Leaflet JS
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      resolve((window as any).L);
    };
    script.onerror = (err) => {
      leafletPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return leafletPromise;
}

export const Marker = ({
  children,
  title,
  coordinate,
  pinColor,
  zIndex = 10,
  draggable = false,
  onDragEnd,
  onPress,
}: any) => {
  const ctx = useContext(MapContext);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!ctx?.map || !ctx?.L || !coordinate?.latitude || !coordinate?.longitude) return;
    const { map, L } = ctx;

    const hostDiv = document.createElement('div');
    hostDiv.className = 'foodie-marker-node';

    const icon = L.divIcon({
      html: hostDiv,
      className: 'foodie-marker-wrapper',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([coordinate.latitude, coordinate.longitude], {
      icon,
      zIndexOffset: zIndex * 50,
      draggable: Boolean(draggable),
    }).addTo(map);

    if (draggable && onDragEnd) {
      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        onDragEnd({ nativeEvent: { coordinate: { latitude: pos.lat, longitude: pos.lng } } });
      });
    }

    if (onPress) {
      marker.on('click', () => onPress());
    }

    markerRef.current = marker;
    setContainerEl(hostDiv);

    return () => {
      marker.remove();
      markerRef.current = null;
      setContainerEl(null);
    };
  }, [ctx?.map, ctx?.L, draggable]);

  // Keep marker position synced
  useEffect(() => {
    if (markerRef.current && coordinate?.latitude && coordinate?.longitude) {
      markerRef.current.setLatLng([coordinate.latitude, coordinate.longitude]);
    }
  }, [coordinate?.latitude, coordinate?.longitude]);

  if (!containerEl) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {children ? (
        children
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: pinColor || '#14532D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: 16 }}>📍</span>
        </div>
      )}
      {title ? (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#0F172A',
            padding: '2px 6px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            marginTop: 4,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0',
          }}
        >
          {title}
        </div>
      ) : null}
    </div>,
    containerEl
  );
};

export const Polyline = ({
  coordinates,
  strokeColor = '#14532D',
  strokeWidth = 4,
  lineDashPattern,
}: any) => {
  const ctx = useContext(MapContext);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!ctx?.map || !ctx?.L) return;
    const { map, L } = ctx;

    if (!coordinates || coordinates.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      return;
    }

    const latlngs = coordinates.map((c: any) => [c.latitude, c.longitude]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs);
      polylineRef.current.setStyle({
        color: strokeColor,
        weight: strokeWidth,
      });
    } else {
      polylineRef.current = L.polyline(latlngs, {
        color: strokeColor,
        weight: strokeWidth,
        opacity: 0.9,
        dashArray: lineDashPattern ? lineDashPattern.join(',') : undefined,
      }).addTo(map);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    };
  }, [ctx?.map, ctx?.L, coordinates, strokeColor, strokeWidth]);

  return null;
};

export const Polygon = ({
  coordinates,
  strokeColor = '#14532D',
  fillColor = 'rgba(20, 83, 45, 0.2)',
  strokeWidth = 2,
}: any) => {
  const ctx = useContext(MapContext);
  const polygonRef = useRef<any>(null);

  useEffect(() => {
    if (!ctx?.map || !ctx?.L || !coordinates || coordinates.length < 3) return;
    const { map, L } = ctx;

    const latlngs = coordinates.map((c: any) => [c.latitude, c.longitude]);
    if (polygonRef.current) {
      polygonRef.current.setLatLngs(latlngs);
      polygonRef.current.setStyle({
        color: strokeColor,
        fillColor,
        weight: strokeWidth,
      });
    } else {
      polygonRef.current = L.polygon(latlngs, {
        color: strokeColor,
        fillColor,
        weight: strokeWidth,
        fillOpacity: 0.2,
      }).addTo(map);
    }

    return () => {
      if (polygonRef.current) {
        polygonRef.current.remove();
        polygonRef.current = null;
      }
    };
  }, [ctx?.map, ctx?.L, coordinates, strokeColor, fillColor, strokeWidth]);

  return null;
};

export const Circle = ({
  center,
  radius,
  strokeColor = '#F59E0B',
  fillColor = 'rgba(245, 158, 11, 0.15)',
  strokeWidth = 1.5,
}: any) => {
  const ctx = useContext(MapContext);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!ctx?.map || !ctx?.L || !center?.latitude || !center?.longitude || !radius) return;
    const { map, L } = ctx;

    if (circleRef.current) {
      circleRef.current.setLatLng([center.latitude, center.longitude]);
      circleRef.current.setRadius(radius);
      circleRef.current.setStyle({
        color: strokeColor,
        fillColor,
        weight: strokeWidth,
      });
    } else {
      circleRef.current = L.circle([center.latitude, center.longitude], {
        radius,
        color: strokeColor,
        fillColor,
        weight: strokeWidth,
        fillOpacity: 0.15,
      }).addTo(map);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    };
  }, [ctx?.map, ctx?.L, center?.latitude, center?.longitude, radius, strokeColor, fillColor, strokeWidth]);

  return null;
};

export const Callout = ({ children }: any) => <View>{children}</View>;

export interface MapViewProps {
  style?: any;
  region?: Region;
  initialRegion?: Region;
  children?: React.ReactNode;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (e: any) => void;
  [key: string]: any;
}

export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: Array<{ latitude: number; longitude: number }>, options?: any) => void;
  animateCamera: (camera: any, options?: any) => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const { style, children, region, initialRegion, onRegionChangeComplete, onPress } = props;

  const mapDomRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapContextVal, setMapContextVal] = useState<MapContextValue | null>(null);
  const [isReady, setIsReady] = useState(false);

  const activeRegion = region || initialRegion || { latitude: 13.3379, longitude: 77.1173 };

  // Expose imperative methods to match react-native-maps
  useImperativeHandle(ref, () => ({
    animateToRegion: (r: Region, duration?: number) => {
      if (mapInstanceRef.current && r) {
        mapInstanceRef.current.flyTo([r.latitude, r.longitude], 15, {
          duration: duration ? duration / 1000 : 1.2,
        });
      }
    },
    fitToCoordinates: (coords: Array<{ latitude: number; longitude: number }>, options?: any) => {
      if (mapInstanceRef.current && (window as any).L && coords && coords.length > 0) {
        const L = (window as any).L;
        const validCoords = coords.filter((c) => c && !isNaN(c.latitude) && !isNaN(c.longitude));
        if (validCoords.length === 0) return;

        if (validCoords.length === 1) {
          mapInstanceRef.current.setView([validCoords[0].latitude, validCoords[0].longitude], 15);
          return;
        }

        const bounds = L.latLngBounds(validCoords.map((c) => [c.latitude, c.longitude]));
        const top = options?.edgePadding?.top || 50;
        const right = options?.edgePadding?.right || 50;
        const bottom = options?.edgePadding?.bottom || 50;
        const left = options?.edgePadding?.left || 50;

        mapInstanceRef.current.fitBounds(bounds, {
          paddingTopLeft: [left, top],
          paddingBottomRight: [right, bottom],
          animate: options?.animated ?? true,
        });
      }
    },
    animateCamera: (camera: any, _options?: any) => {
      if (mapInstanceRef.current && camera) {
        if (camera.zoom !== undefined) {
          mapInstanceRef.current.setZoom(camera.zoom);
        }
        if (camera.center) {
          mapInstanceRef.current.panTo([camera.center.latitude, camera.center.longitude]);
        }
      }
    },
  }));

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;

    loadLeaflet()
      .then((L) => {
        if (isCancelled || !mapDomRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapDomRef.current, {
          center: [activeRegion.latitude, activeRegion.longitude],
          zoom: 14,
          zoomControl: true,
          attributionControl: false,
        });

        // Google Maps Tile Layer
        L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
        }).addTo(map);

        mapInstanceRef.current = map;

        map.on('moveend', () => {
          if (onRegionChangeComplete) {
            const center = map.getCenter();
            const bounds = map.getBounds();
            onRegionChangeComplete({
              latitude: center.lat,
              longitude: center.lng,
              latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
              longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest()),
            });
          }
        });

        if (onPress) {
          map.on('click', (e: any) => {
            onPress({
              nativeEvent: {
                coordinate: {
                  latitude: e.latlng.lat,
                  longitude: e.latlng.lng,
                },
              },
            });
          });
        }

        const resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapDomRef.current);

        setMapContextVal({ map, L });
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps via Leaflet in react-native-maps.web.tsx:', err);
      });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      <div
        ref={mapDomRef}
        className="foodie-map-container"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
      {isReady && mapContextVal && (
        <MapContext.Provider value={mapContextVal}>
          {children}
        </MapContext.Provider>
      )}
    </View>
  );
});

export default MapView;
