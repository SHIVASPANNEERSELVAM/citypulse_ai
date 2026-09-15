'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hotspot } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';
import Link from 'next/link';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_RADIUS: Record<string, number> = {
  CRITICAL: 16,
  HIGH: 12,
  MEDIUM: 9,
  LOW: 7,
};

const SEVERITY_OPACITY: Record<string, number> = {
  CRITICAL: 0.9,
  HIGH: 0.8,
  MEDIUM: 0.7,
  LOW: 0.6,
};

interface HotspotMapProps {
  hotspots: Hotspot[];
  onSelect: (h: Hotspot | null) => void;
  selected: Hotspot | null;
}

function FitBounds({ hotspots }: { hotspots: Hotspot[] }) {
  const map = useMap();
  useEffect(() => {
    if (hotspots.length === 0) return;
    const bounds = L.latLngBounds(hotspots.map((h) => [h.latitude, h.longitude]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [hotspots, map]);
  return null;
}

export default function HotspotMap({ hotspots, onSelect, selected }: HotspotMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      <FitBounds hotspots={hotspots} />
      {hotspots.map((hotspot) => {
        const color = CATEGORY_COLORS[hotspot.category] || '#6b7280';
        const radius = SEVERITY_RADIUS[hotspot.severity] || 8;
        const opacity = SEVERITY_OPACITY[hotspot.severity] || 0.7;
        const isSelected = selected?.id === hotspot.id;

        return (
          <CircleMarker
            key={hotspot.id}
            center={[hotspot.latitude, hotspot.longitude]}
            radius={isSelected ? radius + 4 : radius}
            fillColor={color}
            color={isSelected ? '#fff' : color}
            weight={isSelected ? 2.5 : 1}
            fillOpacity={opacity}
            opacity={1}
            eventHandlers={{
              click: () => onSelect(hotspot),
            }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'system-ui', color: '#111' }}>
                <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{hotspot.title}</p>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{hotspot.category}</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {hotspot.severity && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 999, backgroundColor: '#fee2e2', color: '#dc2626',
                    }}>
                      {hotspot.severity}
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 8px',
                    borderRadius: 999, backgroundColor: '#f3f4f6', color: '#374151',
                  }}>
                    {hotspot.status?.replace('_', ' ')}
                  </span>
                </div>
                <a
                  href={`/authority/reports/${hotspot.id}`}
                  style={{
                    display: 'block', textAlign: 'center', padding: '6px 12px',
                    backgroundColor: '#10b981', color: '#fff', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  View Report
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
