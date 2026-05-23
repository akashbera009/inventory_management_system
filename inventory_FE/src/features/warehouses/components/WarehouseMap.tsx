import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Warehouse } from '@/types';

// Fix default marker icons broken by webpack/vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 10);
    } else {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

interface WarehouseMapProps {
  warehouses: Warehouse[];
}

export function WarehouseMap({ warehouses }: WarehouseMapProps) {
  const located = warehouses.filter(
    (w) => w.latitude != null && w.longitude != null
  );

  const positions: [number, number][] = located.map((w) => [
    Number(w.latitude),
    Number(w.longitude),
  ]);

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 300 }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {located.map((w) => (
          <Marker key={w.id} position={[Number(w.latitude), Number(w.longitude)]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{w.name}</p>
                <p className="text-gray-500">{w.city}, {w.state}</p>
                <p className="text-gray-500">Capacity: {w.capacity} units</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {positions.length > 0 && <FitBounds positions={positions} />}
      </MapContainer>
    </div>
  );
}
