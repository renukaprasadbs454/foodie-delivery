'use client';

import React, { useEffect, useState } from 'react';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';

export interface CityRecord {
  id: string;
  cityName: string;
  state: string;
  activeZonesCount: number;
  activeMerchantsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ServiceAreaRecord {
  id: string;
  areaName: string;
  cityName: string;
  pincode: string;
  coverageStatus: 'FULL_COVERAGE' | 'PARTIAL_COVERAGE' | 'UNAVAILABLE';
  totalOutlets: number;
}

export interface DeliveryZoneRecord {
  id: string;
  zoneName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  polygonCoordinates: string;
  activeDrivers: number;
  surgeMultiplier: number;
  status: 'ACTIVE' | 'HIGH_DEMAND' | 'PAUSED';
  // 3-Way Service Toggles
  restaurantEnabled: boolean;
  deliveryPartnerEnabled: boolean;
  customerOrderingEnabled: boolean;
}

export interface UnserviceableRequestRecord {
  id: string;
  restaurantName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  cityName: string;
  latitude: number;
  longitude: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const MOCK_CITIES: CityRecord[] = [
  { id: 'cty-101', cityName: 'Bangalore', state: 'Karnataka', activeZonesCount: 14, activeMerchantsCount: 450, status: 'ACTIVE' },
  { id: 'cty-102', cityName: 'Mumbai', state: 'Maharashtra', activeZonesCount: 18, activeMerchantsCount: 620, status: 'ACTIVE' },
  { id: 'cty-103', cityName: 'Delhi-NCR', state: 'Delhi', activeZonesCount: 22, activeMerchantsCount: 780, status: 'ACTIVE' },
  { id: 'cty-104', cityName: 'Hyderabad', state: 'Telangana', activeZonesCount: 10, activeMerchantsCount: 310, status: 'ACTIVE' },
];

const MOCK_SERVICE_AREAS: ServiceAreaRecord[] = [
  { id: 'sa-201', areaName: 'Indiranagar & Domlur', cityName: 'Bangalore', pincode: '560038', coverageStatus: 'FULL_COVERAGE', totalOutlets: 120 },
  { id: 'sa-202', areaName: 'Koramangala 4th Block', cityName: 'Bangalore', pincode: '560034', coverageStatus: 'FULL_COVERAGE', totalOutlets: 145 },
  { id: 'sa-203', areaName: 'Bandra West & Khar', cityName: 'Mumbai', pincode: '400050', coverageStatus: 'FULL_COVERAGE', totalOutlets: 190 },
  { id: 'sa-204', areaName: 'Connaught Place & Janpath', cityName: 'Delhi-NCR', pincode: '110001', coverageStatus: 'PARTIAL_COVERAGE', totalOutlets: 85 },
];

const MOCK_DELIVERY_ZONES: DeliveryZoneRecord[] = [
  {
    id: 'dz-301',
    zoneName: 'Indiranagar Tech Hub Zone',
    cityName: 'Bangalore',
    latitude: 12.9716,
    longitude: 77.6412,
    radiusKm: 5.0,
    polygonCoordinates: '12.9716,77.6412 | 12.9800,77.6500 | 12.9600,77.6600',
    activeDrivers: 42,
    surgeMultiplier: 1.0,
    status: 'ACTIVE',
    restaurantEnabled: true,
    deliveryPartnerEnabled: true,
    customerOrderingEnabled: true,
  },
  {
    id: 'dz-302',
    zoneName: 'Koramangala Food Strip Zone',
    cityName: 'Bangalore',
    latitude: 12.9352,
    longitude: 77.6245,
    radiusKm: 4.5,
    polygonCoordinates: '12.9352,77.6245 | 12.9450,77.6300 | 12.9200,77.6150',
    activeDrivers: 58,
    surgeMultiplier: 1.25,
    status: 'HIGH_DEMAND',
    restaurantEnabled: true,
    deliveryPartnerEnabled: true,
    customerOrderingEnabled: true,
  },
  {
    id: 'dz-303',
    zoneName: 'Bandra Coastal Eats Zone',
    cityName: 'Mumbai',
    latitude: 19.0596,
    longitude: 72.8295,
    radiusKm: 6.0,
    polygonCoordinates: '19.0596,72.8295 | 19.0700,72.8400 | 19.0450,72.8200',
    activeDrivers: 65,
    surgeMultiplier: 1.1,
    status: 'ACTIVE',
    restaurantEnabled: true,
    deliveryPartnerEnabled: true,
    customerOrderingEnabled: false, // Customer ordering paused
  },
  {
    id: 'dz-304',
    zoneName: 'HSR Sector 1 Express Zone',
    cityName: 'Bangalore',
    latitude: 12.9121,
    longitude: 77.6446,
    radiusKm: 4.0,
    polygonCoordinates: '12.9121,77.6446 | 12.9200,77.6500 | 12.9000,77.6350',
    activeDrivers: 28,
    surgeMultiplier: 1.0,
    status: 'ACTIVE',
    restaurantEnabled: true,
    deliveryPartnerEnabled: false, // Delivery partner dispatch paused
    customerOrderingEnabled: true,
  },
];

const MOCK_UNSERVICEABLE_REQUESTS: UnserviceableRequestRecord[] = [
  {
    id: 'req-501',
    restaurantName: 'Truffles Bistro',
    contactPerson: 'Rohan Sharma',
    contactEmail: 'rohan@truffles.com',
    contactPhone: '+91 98765 43210',
    address: '100 Feet Road, Whitefield',
    cityName: 'Bangalore',
    latitude: 12.9698,
    longitude: 77.7499,
    status: 'PENDING',
    createdAt: '2026-08-17 14:30',
  },
  {
    id: 'req-502',
    restaurantName: 'Coastal Spice House',
    contactPerson: 'Ananya Rao',
    contactEmail: 'ananya@coastalspice.com',
    contactPhone: '+91 98123 45678',
    address: 'Linking Road, Juhu',
    cityName: 'Mumbai',
    latitude: 19.1075,
    longitude: 72.8263,
    status: 'PENDING',
    createdAt: '2026-08-15 11:15',
  },
];

type LocationTab = 'CITIES' | 'SERVICE_AREAS' | 'DELIVERY_ZONES' | 'UNSERVICEABLE_REQUESTS' | 'DELIVERY_CHARGES' | 'RADIUS_SETTINGS';

interface GoogleMapsPolygonPinPickerProps {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  polygonString: string;
  onChangePolygon: (newPolygonStr: string) => void;
  title?: string;
}

export function GoogleMapsPolygonPinPicker({
  centerLat,
  centerLng,
  radiusKm,
  polygonString,
  onChangePolygon,
  title = 'Google Maps Interactive Polygon Pin Picker',
}: GoogleMapsPolygonPinPickerProps) {
  const [mapTheme, setMapTheme] = useState<'VECTOR' | 'SATELLITE' | 'HYBRID'>('VECTOR');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [hoveredPinIndex, setHoveredPinIndex] = useState<number | null>(null);

  // Parse polygon string into array of pins
  const parsePins = (str: string) => {
    if (!str || !str.trim()) return [];
    const parts = str.split('|').map((p) => p.trim()).filter(Boolean);
    const pins: { id: string; lat: number; lng: number }[] = [];
    parts.forEach((pt, idx) => {
      const coords = pt.split(',').map((c) => parseFloat(c.trim()));
      if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        pins.push({ id: `pin-${idx}-${coords[0]}-${coords[1]}`, lat: coords[0], lng: coords[1] });
      }
    });
    return pins;
  };

  const currentPins = parsePins(polygonString);

  const stringifyPins = (pins: { lat: number; lng: number }[]) => {
    return pins.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join(' | ');
  };

  const handleAddPin = (lat: number, lng: number) => {
    const updated = [...currentPins, { id: `pin-${Date.now()}-${lat}-${lng}`, lat, lng }];
    onChangePolygon(stringifyPins(updated));
  };

  const handleRemovePin = (index: number) => {
    const updated = currentPins.filter((_, i) => i !== index);
    onChangePolygon(stringifyPins(updated));
  };

  const handleClearAll = () => {
    onChangePolygon('');
  };

  const handleAutoPreset = (preset: '4POINT' | '6POINT' | 'CENTER') => {
    const lat = centerLat || 12.9716;
    const lng = centerLng || 77.5946;
    const rDeg = (radiusKm || 5.0) / 111.0;
    const cosLat = Math.cos((lat * Math.PI) / 180);

    if (preset === 'CENTER') {
      handleAddPin(lat, lng);
      return;
    }

    const pins: { lat: number; lng: number }[] = [];
    if (preset === '4POINT') {
      pins.push({ lat: lat + rDeg, lng: lng }); // North
      pins.push({ lat: lat, lng: lng + rDeg / cosLat }); // East
      pins.push({ lat: lat - rDeg, lng: lng }); // South
      pins.push({ lat: lat, lng: lng - rDeg / cosLat }); // West
    } else if (preset === '6POINT') {
      const numPoints = 6;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        const dLat = rDeg * Math.cos(angle);
        const dLng = (rDeg * Math.sin(angle)) / cosLat;
        pins.push({ lat: lat + dLat, lng: lng + dLng });
      }
    }
    onChangePolygon(stringifyPins(pins));
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      handleAddPin(lat, lng);
      setManualLat('');
      setManualLng('');
    }
  };

  // Convert lat/lng to SVG percentage relative to center
  const getSvgCoords = (pLat: number, pLng: number) => {
    const latSpan = ((radiusKm || 5.0) / 111.0) * 2.8;
    const lngSpan = latSpan / Math.max(0.1, Math.cos((centerLat * Math.PI) / 180));
    const xPct = 50 + ((pLng - centerLng) / lngSpan) * 100;
    const yPct = 50 - ((pLat - centerLat) / latSpan) * 100;
    return {
      x: Math.max(8, Math.min(92, xPct)),
      y: Math.max(8, Math.min(92, yPct)),
    };
  };

  // Click on interactive map canvas to drop a pin marker
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const normX = (clickX / rect.width - 0.5) * 2; // -1 to +1
    const normY = (0.5 - clickY / rect.height) * 2; // -1 to +1

    const latSpan = ((radiusKm || 5.0) / 111.0) * 1.4;
    const lngSpan = latSpan / Math.max(0.1, Math.cos((centerLat * Math.PI) / 180));

    const clickedLat = parseFloat((centerLat + normY * latSpan).toFixed(4));
    const clickedLng = parseFloat((centerLng + normX * lngSpan).toFixed(4));

    handleAddPin(clickedLat, clickedLng);
  };

  const svgPolygonPoints = currentPins.map((p) => {
    const coords = getSvgCoords(p.lat, p.lng);
    return `${coords.x}%,${coords.y}%`;
  }).join(' ');

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 20,
        border: '1.5px solid #14532D',
        boxShadow: '0 4px 16px rgba(20, 83, 45, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#14532D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span></span> {title}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Click anywhere on the interactive map canvas below to drop Google Maps Pins () and dynamically build the polygon string.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Map Theme Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3 }}>
            {(['VECTOR', 'SATELLITE', 'HYBRID'] as const).map((thm) => (
              <button
                key={thm}
                type="button"
                onClick={() => setMapTheme(thm)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: mapTheme === thm ? '#14532D' : 'transparent',
                  color: mapTheme === thm ? '#F59E0B' : '#475569',
                }}
              >
                {thm === 'VECTOR' ? ' Vector' : thm === 'SATELLITE' ? ' Satellite' : ' Hybrid'}
              </button>
            ))}
          </div>

          <span
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 900,
              backgroundColor: currentPins.length >= 3 ? '#D1FAE5' : '#FEF3C7',
              color: currentPins.length >= 3 ? '#047857' : '#B45309',
            }}
          >
             {currentPins.length} Pins Placed
          </span>
        </div>
      </div>

      {/* Interactive Google Maps Grid Canvas (Click to Place Google Maps Pin Marker) */}
      <div
        onClick={handleMapClick}
        style={{
          position: 'relative',
          height: 320,
          borderRadius: 12,
          border: '2px solid #CBD5E1',
          overflow: 'hidden',
          cursor: 'crosshair',
          backgroundColor: mapTheme === 'SATELLITE' ? '#0F172A' : mapTheme === 'HYBRID' ? '#1E293B' : '#E2E8F0',
          backgroundImage:
            mapTheme === 'VECTOR'
              ? 'radial-gradient(#CBD5E1 1px, transparent 1px)'
              : 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Map Watermark & Scale */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, backgroundColor: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
           Center: {centerLat.toFixed(4)}, {centerLng.toFixed(4)} (Scale: {radiusKm} KM Circle)
        </div>

        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 5, backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#14532D', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, border: '1px solid #CBD5E1' }}>
           Click Map Canvas to Drop Google Pin
        </div>

        {/* Center Crosshair Marker */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 16,
            height: 16,
            marginLeft: -8,
            marginTop: -8,
            border: '2px dashed #F59E0B',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />

        {/* SVG Layer: Coverage Circle & Polygon Line Path */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
          {/* Outer Coverage Circle */}
          <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

          {/* Polygon Perimeter Line */}
          {currentPins.length >= 2 && (
            <polygon
              points={svgPolygonPoints}
              fill="rgba(20, 83, 45, 0.25)"
              stroke="#14532D"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Render Dropped Google Maps Pin Markers */}
        {currentPins.map((pin, idx) => {
          const coords = getSvgCoords(pin.lat, pin.lng);
          const isHovered = hoveredPinIndex === idx;

          return (
            <div
              key={pin.id || idx}
              style={{
                position: 'absolute',
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -100%)',
                zIndex: isHovered ? 20 : 10,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              title={`Pin #${idx + 1}: ${pin.lat}, ${pin.lng}`}
              onMouseEnter={() => setHoveredPinIndex(idx)}
              onMouseLeave={() => setHoveredPinIndex(null)}
              onClick={(e) => {
                e.stopPropagation(); // Prevent dropping extra pin when clicking existing marker
                handleRemovePin(idx);
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                }}
              >
                {/* Pin Tooltip Badge */}
                <div
                  style={{
                    backgroundColor: isHovered ? '#B91C1C' : '#14532D',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    marginBottom: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  Pin #{idx + 1}
                </div>

                {/* Google Maps Pin Marker Icon */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50% 50% 50% 0',
                    backgroundColor: isHovered ? '#EF4444' : '#DC2626',
                    transform: 'rotate(-45deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      transform: 'rotate(45deg)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Pin Action Presets Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          backgroundColor: '#F8FAFC',
          padding: 12,
          borderRadius: 10,
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#14532D' }}>Quick Pin Presets:</span>

          <button
            type="button"
            onClick={() => handleAutoPreset('CENTER')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              color: '#14532D',
              border: '1px solid #14532D',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
             Drop Pin at Center
          </button>

          <button
            type="button"
            onClick={() => handleAutoPreset('4POINT')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#14532D',
              color: '#F59E0B',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🟩 Auto 4-Point Square Pins
          </button>

          <button
            type="button"
            onClick={() => handleAutoPreset('6POINT')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
             Auto 6-Point Hexagon Pins
          </button>

          {currentPins.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                padding: '6px 12px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
               Clear All Pins ({currentPins.length})
            </button>
          )}
        </div>

        {/* Manual Lat/Lng Add Form */}
        <form onSubmit={handleManualAdd} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="number"
            step="0.0001"
            placeholder="Lat (12.97)"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            style={{ width: 100, padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
          />
          <input
            type="number"
            step="0.0001"
            placeholder="Lng (77.59)"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            style={{ width: 100, padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 12px',
              backgroundColor: '#14532D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            + Add Pin
          </button>
        </form>
      </div>

      {/* Pins Cards List */}
      {currentPins.length > 0 ? (
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#14532D', marginBottom: 8 }}>
            Polygon Pin Marker Coordinates List ({currentPins.length} points):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {currentPins.map((pin, idx) => (
              <div
                key={pin.id || idx}
                onMouseEnter={() => setHoveredPinIndex(idx)}
                onMouseLeave={() => setHoveredPinIndex(null)}
                style={{
                  backgroundColor: hoveredPinIndex === idx ? '#FEF3C7' : '#F8FAFC',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: hoveredPinIndex === idx ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#14532D' }}>
                     Pin #{idx + 1}
                  </div>
                  <div style={{ color: '#475569', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
                    {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePin(idx)}
                  title="Remove this pin marker"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#EF4444',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', fontSize: 12, color: '#64748B' }}>
           No polygon pins dropped yet. Click anywhere on the map above or click <strong>"Auto 4-Point Square Pins"</strong> to place boundary markers.
        </div>
      )}
    </div>
  );
}

export function LocationManagementPage() {
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState<LocationTab>('DELIVERY_ZONES');

  // Cities State
  const [cities, setCities] = useState<CityRecord[]>(MOCK_CITIES);
  const [newCityName, setNewCityName] = useState('');
  const [newState, setNewState] = useState('');

  // Service Areas State
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaRecord[]>(MOCK_SERVICE_AREAS);

  // Multi-Zone State with 3-Way Toggles
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneRecord[]>(MOCK_DELIVERY_ZONES);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCity, setNewZoneCity] = useState('Bangalore');
  const [newLat, setNewLat] = useState('12.9716');
  const [newLng, setNewLng] = useState('77.5946');
  const [newRadiusKm, setNewRadiusKm] = useState('5.0');
  const [newPolygon, setNewPolygon] = useState('12.9716,77.5946 | 12.9800,77.6000 | 12.9600,77.6100');
  const [newRestEnabled, setNewRestEnabled] = useState(true);
  const [newDriverEnabled, setNewDriverEnabled] = useState(true);
  const [newCustomerEnabled, setNewCustomerEnabled] = useState(true);
  const [editingZoneMap, setEditingZoneMap] = useState<DeliveryZoneRecord | null>(null);

  // Unserviceable Location Requests State
  const [unserviceableRequests, setUnserviceableRequests] = useState<UnserviceableRequestRecord[]>(MOCK_UNSERVICEABLE_REQUESTS);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqRestName, setReqRestName] = useState('');
  const [reqContactPerson, setReqContactPerson] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqAddress, setReqAddress] = useState('');
  const [reqCity, setReqCity] = useState('Bangalore');
  const [reqLat, setReqLat] = useState('12.9698');
  const [reqLng, setReqLng] = useState('77.7499');

  // Delivery Charges State
  const [baseCharge, setBaseCharge] = useState('35');
  const [baseDistanceKm, setBaseDistanceKm] = useState('3');
  const [additionalChargePerKm, setAdditionalChargePerKm] = useState('10');
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState('499');
  const [nightSurcharge, setNightSurcharge] = useState('25');
  const [surgeMultiplier, setSurgeMultiplier] = useState('1.15');

  // Radius Settings State
  const [maxDeliveryRadius, setMaxDeliveryRadius] = useState('15');
  const [customerSearchRadius, setCustomerSearchRadius] = useState('10');
  const [driverDispatchRadius, setDriverDispatchRadius] = useState('5');
  const [distanceCalculationMode, setDistanceCalculationMode] = useState<'GPS_ROAD' | 'HAVERSINE'>('GPS_ROAD');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_location_management_viewed', {});
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Toggle individual service powers (Restaurants / Drivers / Customers) per zone
  const handleToggleZonePower = (zoneId: string, powerType: 'RESTAURANT' | 'DRIVER' | 'CUSTOMER') => {
    setDeliveryZones((prev) =>
      prev.map((z) => {
        if (z.id === zoneId) {
          const updated = { ...z };
          if (powerType === 'RESTAURANT') updated.restaurantEnabled = !z.restaurantEnabled;
          if (powerType === 'DRIVER') updated.deliveryPartnerEnabled = !z.deliveryPartnerEnabled;
          if (powerType === 'CUSTOMER') updated.customerOrderingEnabled = !z.customerOrderingEnabled;
          return updated;
        }
        return z;
      }),
    );
    showToast(`Zone service permissions updated!`);
  };

  // Step 1 & 2: Create Multi-Zone with Coordinates & 3-Way Toggles
  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      alert('Please enter a Zone Name');
      return;
    }
    const zone: DeliveryZoneRecord = {
      id: `dz-${Date.now().toString().slice(-4)}`,
      zoneName: newZoneName.trim(),
      cityName: newZoneCity,
      latitude: parseFloat(newLat) || 12.9716,
      longitude: parseFloat(newLng) || 77.5946,
      radiusKm: parseFloat(newRadiusKm) || 5.0,
      polygonCoordinates: newPolygon.trim(),
      activeDrivers: 0,
      surgeMultiplier: 1.0,
      status: 'ACTIVE',
      restaurantEnabled: newRestEnabled,
      deliveryPartnerEnabled: newDriverEnabled,
      customerOrderingEnabled: newCustomerEnabled,
    };

    setDeliveryZones((prev) => [zone, ...prev]);
    setIsCreatingZone(false);
    setNewZoneName('');
    showToast(`Multi-Zone "${zone.zoneName}" created successfully with map coordinates & 3-way service controls!`);
  };

  // Submit unserviceable restaurant request
  const handleSubmitUnserviceableRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqRestName.trim() || !reqAddress.trim()) {
      alert('Please enter restaurant name and address');
      return;
    }
    const req: UnserviceableRequestRecord = {
      id: `req-${Date.now().toString().slice(-4)}`,
      restaurantName: reqRestName.trim(),
      contactPerson: reqContactPerson.trim() || 'Restaurant Manager',
      contactEmail: reqEmail.trim() || 'contact@restaurant.com',
      contactPhone: reqPhone.trim() || '+91 98000 00000',
      address: reqAddress.trim(),
      cityName: reqCity,
      latitude: parseFloat(reqLat) || 12.9716,
      longitude: parseFloat(reqLng) || 77.5946,
      status: 'PENDING',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setUnserviceableRequests((prev) => [req, ...prev]);
    setShowRequestModal(false);
    setReqRestName('');
    setReqAddress('');
    showToast(`Unserviceable restaurant expansion request submitted for ${req.restaurantName}!`);
  };

  // Convert unserviceable request into a new Zone
  const handleApproveRequestAndCreateZone = (req: UnserviceableRequestRecord) => {
    setNewZoneName(`${req.restaurantName} Dedicated Zone`);
    setNewZoneCity(req.cityName);
    setNewLat(req.latitude.toString());
    setNewLng(req.longitude.toString());
    setNewRadiusKm('4.0');
    setNewPolygon(`${req.latitude},${req.longitude} | ${req.latitude + 0.01},${req.longitude + 0.01} | ${req.latitude - 0.01},${req.longitude - 0.01}`);
    setIsCreatingZone(true);
    setActiveTab('DELIVERY_ZONES');

    // Update request status
    setUnserviceableRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'APPROVED' } : r)),
    );
    showToast(`Pre-filled coordinates for ${req.restaurantName}. Complete zone creation below!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#14532D',
            color: '#F59E0B',
            padding: '14px 24px',
            borderRadius: 10,
            fontWeight: 800,
            boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
            zIndex: 9999,
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Multi-Zone & Location Operations Center
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Create accurate polygon/radius zones, manage 3-way permissions (Restaurants, Drivers, Customers) & review unserviceable location expansion requests
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              color: '#14532D',
              border: '1.5px solid #14532D',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            + Request Unserviceable Location
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingZone(true)}
            style={{
              padding: '10px 18px',
              backgroundColor: '#14532D',
              color: '#F59E0B',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20, 83, 45, 0.2)',
            }}
          >
            + Create Multi-Zone
          </button>
        </div>
      </div>

      {/* 6 Outer Visible Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: '#FFFFFF',
          padding: '8px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'DELIVERY_ZONES', label: `Delivery Multi-Zones (${deliveryZones.length})` },
          { id: 'UNSERVICEABLE_REQUESTS', label: `Unserviceable Requests (${unserviceableRequests.filter((r) => r.status === 'PENDING').length} Pending)` },
          { id: 'CITIES', label: `Cities (${cities.length})` },
          { id: 'SERVICE_AREAS', label: `Service Areas (${serviceAreas.length})` },
          { id: 'DELIVERY_CHARGES', label: 'Delivery Charges' },
          { id: 'RADIUS_SETTINGS', label: 'Radius Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as LocationTab)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#14532D' : 'transparent',
              color: activeTab === tab.id ? '#F59E0B' : '#475569',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* STEP 1 & 2: MULTI-ZONE CREATION MODAL / DRAWER */}
      {isCreatingZone && (
        <form
          onSubmit={handleCreateZone}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 28,
            border: '2px solid #14532D',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
              Step 1 & 2: Accurate Multi-Zone Creation & 3-Way Power Switches
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingZone(false)}
              style={{ padding: '6px 12px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>

          {/* Form Fields: Zone Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Zone Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Whitefield Tech Corridor Zone"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                City
              </label>
              <select
                value={newZoneCity}
                onChange={(e) => setNewZoneCity(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.cityName}>
                    {c.cityName} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Operational Radius (KM)
              </label>
              <input
                type="number"
                step="0.5"
                value={newRadiusKm}
                onChange={(e) => setNewRadiusKm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Center Latitude (GPS Coordinate)
              </label>
              <input
                type="number"
                step="0.0001"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Center Longitude (GPS Coordinate)
              </label>
              <input
                type="number"
                step="0.0001"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Polygon Boundary Coordinates String (Format: lat1,lng1 | lat2,lng2 | ...)
              </label>
              <input
                type="text"
                value={newPolygon}
                onChange={(e) => setNewPolygon(e.target.value)}
                placeholder="e.g. 12.9716,77.5946 | 12.9800,77.6000 | 12.9600,77.6100"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Interactive Google Maps Polygon Pin Picker Feature */}
          <GoogleMapsPolygonPinPicker
            centerLat={parseFloat(newLat) || 12.9716}
            centerLng={parseFloat(newLng) || 77.5946}
            radiusKm={parseFloat(newRadiusKm) || 5.0}
            polygonString={newPolygon}
            onChangePolygon={(str) => setNewPolygon(str)}
            title="Google Maps Interactive Multi-Zone Pin Picker & Polygon Builder"
          />

          {/* STEP 2: INDIVIDUAL 3-WAY POWER TOGGLE SWITCHES */}
          <div style={{ backgroundColor: '#ECFDF5', padding: 20, borderRadius: 12, border: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>
              Step 2: Individual 3-Way Power Switches (Enable / Disable per Zone)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {/* Toggle 1: Restaurants */}
              <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}> Restaurant Onboarding</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Allow restaurants to register & accept orders</div>
                </div>
                <input
                  type="checkbox"
                  checked={newRestEnabled}
                  onChange={(e) => setNewRestEnabled(e.target.checked)}
                  style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#14532D' }}
                />
              </div>

              {/* Toggle 2: Delivery Partners */}
              <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}> Delivery Partner Dispatch</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Allow driver fleet dispatch & payouts</div>
                </div>
                <input
                  type="checkbox"
                  checked={newDriverEnabled}
                  onChange={(e) => setNewDriverEnabled(e.target.checked)}
                  style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#14532D' }}
                />
              </div>

              {/* Toggle 3: Customer Ordering */}
              <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}> Customer Ordering Power</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Allow customers to place food orders</div>
                </div>
                <input
                  type="checkbox"
                  checked={newCustomerEnabled}
                  onChange={(e) => setNewCustomerEnabled(e.target.checked)}
                  style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#14532D' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => setIsCreatingZone(false)}
              style={{ padding: '10px 18px', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '10px 24px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
            >
              Create Multi-Zone Now
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: DELIVERY MULTI-ZONES TABLE & 3-WAY TOGGLE CONTROLS */}
      {activeTab === 'DELIVERY_ZONES' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '14px 20px' }}>Delivery Polygon Zone & Map Center</th>
                <th style={{ padding: '14px 20px' }}>City</th>
                <th style={{ padding: '14px 20px' }}>Coverage Radius</th>
                <th style={{ padding: '14px 20px' }}>3-Way Service Power Switches</th>
                <th style={{ padding: '14px 20px' }}>Surge Multiplier</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Map Pins & Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryZones.map((dz) => (
                <tr key={dz.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 800, color: '#14532D' }}>{dz.zoneName}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                       Lat: {dz.latitude}, Lng: {dz.longitude}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px', color: '#475569' }}>{dz.cityName}</td>

                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0F172A' }}>
                    {dz.radiusKm} KM Circle
                  </td>

                  {/* 3-Way Switch Buttons Column */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Switch 1: Restaurant */}
                      <button
                        type="button"
                        onClick={() => handleToggleZonePower(dz.id, 'RESTAURANT')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: dz.restaurantEnabled ? '#D1FAE5' : '#FEE2E2',
                          color: dz.restaurantEnabled ? '#047857' : '#991B1B',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <span> Restaurant Service:</span>
                        <span>{dz.restaurantEnabled ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* Switch 2: Delivery Partner */}
                      <button
                        type="button"
                        onClick={() => handleToggleZonePower(dz.id, 'DRIVER')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: dz.deliveryPartnerEnabled ? '#D1FAE5' : '#FEE2E2',
                          color: dz.deliveryPartnerEnabled ? '#047857' : '#991B1B',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <span> Driver Dispatch:</span>
                        <span>{dz.deliveryPartnerEnabled ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* Switch 3: Customer Ordering */}
                      <button
                        type="button"
                        onClick={() => handleToggleZonePower(dz.id, 'CUSTOMER')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: dz.customerOrderingEnabled ? '#D1FAE5' : '#FEE2E2',
                          color: dz.customerOrderingEnabled ? '#047857' : '#991B1B',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <span> Customer Ordering:</span>
                        <span>{dz.customerOrderingEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px', fontWeight: 800, color: dz.surgeMultiplier > 1.0 ? '#D97706' : '#0F172A' }}>
                    {dz.surgeMultiplier}x
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        backgroundColor: dz.status === 'ACTIVE' ? '#D1FAE5' : dz.status === 'HIGH_DEMAND' ? '#FEF3C7' : '#FEE2E2',
                        color: dz.status === 'ACTIVE' ? '#047857' : dz.status === 'HIGH_DEMAND' ? '#B45309' : '#991B1B',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {dz.status}
                    </span>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingZoneMap(dz)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#14532D',
                        color: '#F59E0B',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span> Edit Pins ({dz.polygonCoordinates ? dz.polygonCoordinates.split('|').length : 0})</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Existing Zone Map Pins Edit Modal */}
      {editingZoneMap && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#14532D', margin: 0 }}>
                  Google Maps Pin Boundary Markers — {editingZoneMap.zoneName}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  City: {editingZoneMap.cityName} | Center Lat: {editingZoneMap.latitude}, Lng: {editingZoneMap.longitude}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingZoneMap(null)}
                style={{ padding: '6px 14px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Window 
              </button>
            </div>

            <GoogleMapsPolygonPinPicker
              centerLat={editingZoneMap.latitude}
              centerLng={editingZoneMap.longitude}
              radiusKm={editingZoneMap.radiusKm}
              polygonString={editingZoneMap.polygonCoordinates}
              onChangePolygon={(str) => {
                setDeliveryZones((prev) =>
                  prev.map((z) => (z.id === editingZoneMap.id ? { ...z, polygonCoordinates: str } : z))
                );
                setEditingZoneMap((prev) => (prev ? { ...prev, polygonCoordinates: str } : null));
              }}
              title={`Google Maps Pin Picker — ${editingZoneMap.zoneName}`}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setEditingZoneMap(null);
                  showToast(`Google Maps pin coordinates updated for ${editingZoneMap.zoneName}!`);
                }}
                style={{ padding: '10px 20px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                Save Map Pins & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNSERVICEABLE RESTAURANT EXPANSION REQUESTS DESK */}
      {activeTab === 'UNSERVICEABLE_REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', padding: 16, borderRadius: 12, color: '#B45309', fontSize: 13, fontWeight: 700 }}>
            Restaurants outside existing active zones submit location expansion requests here. Review their map coordinates & convert them into new active Multi-Zones!
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '14px 20px' }}>Applicant Restaurant & Location</th>
                  <th style={{ padding: '14px 20px' }}>Contact Person</th>
                  <th style={{ padding: '14px 20px' }}>GPS Map Coordinates</th>
                  <th style={{ padding: '14px 20px' }}>Submitted Date</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {unserviceableRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#14532D' }}>{req.restaurantName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{req.address}, {req.cityName}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{req.contactPerson}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{req.contactPhone}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>
                       Lat: {req.latitude}, Lng: {req.longitude}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748B', fontSize: 12 }}>
                      {req.createdAt}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: req.status === 'APPROVED' ? '#D1FAE5' : req.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                          color: req.status === 'APPROVED' ? '#047857' : req.status === 'PENDING' ? '#B45309' : '#991B1B',
                          padding: '3px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {req.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveRequestAndCreateZone(req)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#14532D',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Approve & Create Zone
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBMIT UNSERVICEABLE LOCATION REQUEST MODAL */}
      {showRequestModal && (
        <form
          onSubmit={handleSubmitUnserviceableRequest}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 28,
            border: '2px solid #14532D',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
              Submit Unserviceable Restaurant Expansion Request
            </h3>
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              style={{ padding: '6px 12px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Restaurant Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Punjabi Rasoi"
                value={reqRestName}
                onChange={(e) => setReqRestName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Contact Person Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vikram Singh"
                value={reqContactPerson}
                onChange={(e) => setReqContactPerson(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Contact Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={reqPhone}
                onChange={(e) => setReqPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                City
              </label>
              <select
                value={reqCity}
                onChange={(e) => setReqCity(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.cityName}>
                    {c.cityName}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Full Address *
              </label>
              <input
                type="text"
                placeholder="e.g. Shop 12, MG Road Cyber Hub"
                value={reqAddress}
                onChange={(e) => setReqAddress(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Latitude Coordinates
              </label>
              <input
                type="number"
                step="0.0001"
                value={reqLat}
                onChange={(e) => setReqLat(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                Longitude Coordinates
              </label>
              <input
                type="number"
                step="0.0001"
                value={reqLng}
                onChange={(e) => setReqLng(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              style={{ padding: '10px 18px', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '10px 24px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
            >
              Submit Expansion Request
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: CITIES */}
      {activeTab === 'CITIES' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCityName.trim() || !newState.trim()) return;
              setCities((prev) => [
                { id: `cty-${Date.now().toString().slice(-4)}`, cityName: newCityName.trim(), state: newState.trim(), activeZonesCount: 1, activeMerchantsCount: 0, status: 'ACTIVE' },
                ...prev,
              ]);
              setNewCityName('');
              setNewState('');
              showToast('City added successfully!');
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 24,
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              height: 'fit-content',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#14532D', margin: 0 }}>Add Operating City</h3>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>City Name</label>
              <input type="text" placeholder="e.g. Pune" value={newCityName} onChange={(e) => setNewCityName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>State / Region</label>
              <input type="text" placeholder="e.g. Maharashtra" value={newState} onChange={(e) => setNewState(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <button type="submit" style={{ padding: '12px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
              Add City
            </button>
          </form>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '14px 20px' }}>City & State</th>
                  <th style={{ padding: '14px 20px' }}>Active Zones</th>
                  <th style={{ padding: '14px 20px' }}>Active Merchants</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#14532D' }}>{c.cityName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{c.state}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0F172A' }}>{c.activeZonesCount} Zones</td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>{c.activeMerchantsCount} Outlets</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: c.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2', color: c.status === 'ACTIVE' ? '#047857' : '#991B1B', padding: '3px 8px', borderRadius: 4 }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SERVICE AREAS */}
      {activeTab === 'SERVICE_AREAS' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '14px 20px' }}>Service Area & City</th>
                <th style={{ padding: '14px 20px' }}>Pincode</th>
                <th style={{ padding: '14px 20px' }}>Coverage Level</th>
                <th style={{ padding: '14px 20px' }}>Active Outlets</th>
              </tr>
            </thead>
            <tbody>
              {serviceAreas.map((sa) => (
                <tr key={sa.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 800, color: '#14532D' }}>{sa.areaName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{sa.cityName}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0F172A' }}>{sa.pincode}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: sa.coverageStatus === 'FULL_COVERAGE' ? '#D1FAE5' : '#FEF3C7', color: sa.coverageStatus === 'FULL_COVERAGE' ? '#047857' : '#B45309', padding: '3px 8px', borderRadius: 4 }}>
                      {sa.coverageStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>{sa.totalOutlets} Outlets</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: DELIVERY CHARGES */}
      {activeTab === 'DELIVERY_CHARGES' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            showToast('Delivery charge rules updated!');
          }}
          style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Distance-Based Delivery Charge Matrix</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Base Delivery Fee (₹)</label>
              <input type="number" value={baseCharge} onChange={(e) => setBaseCharge(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Base Distance Coverage (KM)</label>
              <input type="number" value={baseDistanceKm} onChange={(e) => setBaseDistanceKm(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Additional Fee per KM (₹)</label>
              <input type="number" value={additionalChargePerKm} onChange={(e) => setAdditionalChargePerKm(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Free Delivery Order Threshold (₹)</label>
              <input type="number" value={freeDeliveryMinOrder} onChange={(e) => setFreeDeliveryMinOrder(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Night Dispatch Surcharge (₹)</label>
              <input type="number" value={nightSurcharge} onChange={(e) => setNightSurcharge(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Peak Surge Multiplier</label>
              <input type="number" step="0.05" value={surgeMultiplier} onChange={(e) => setSurgeMultiplier(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Save Delivery Charges
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: RADIUS SETTINGS */}
      {activeTab === 'RADIUS_SETTINGS' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            showToast('Radius settings saved!');
          }}
          style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Operational Radius & Dispatch Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Maximum Operating Delivery Radius (KM)</label>
              <input type="number" value={maxDeliveryRadius} onChange={(e) => setMaxDeliveryRadius(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Customer Restaurant Discovery Radius (KM)</label>
              <input type="number" value={customerSearchRadius} onChange={(e) => setCustomerSearchRadius(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Driver Auto-Dispatch Broadcast Radius (KM)</label>
              <input type="number" value={driverDispatchRadius} onChange={(e) => setDriverDispatchRadius(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Distance Calculation Engine Mode</label>
              <select value={distanceCalculationMode} onChange={(e) => setDistanceCalculationMode(e.target.value as 'GPS_ROAD' | 'HAVERSINE')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}>
                <option value="GPS_ROAD">Google Maps GPS Road Navigation Distance</option>
                <option value="HAVERSINE">Straight Line Haversine Distance (Fast)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Save Radius Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
