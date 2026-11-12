import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { MapPin, Info, Compass, Waves, Zap, ShieldCheck } from 'lucide-react';
import L from 'leaflet';

// Fix standard marker icon issue in Leaflet + React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MetturDamMap() {
  const [damInfo, setDamInfo] = useState(null);

  useEffect(() => {
    fetch('/api/dam-info')
      .then(res => res.json())
      .then(data => setDamInfo(data))
      .catch(err => console.error(err));
  }, []);

  if (!damInfo) {
    return <div className="p-8 text-slate-400 font-mono">Loading Mettur Dam GIS Map...</div>;
  }

  const center = [11.8000, 77.8000];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#2a364f] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-teal-400 font-bold uppercase">PAGE 7 OF 9</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-400">GEOSPATIAL INFRASTRUCTURE</span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-white mt-1">Mettur Dam & Stanley Reservoir Map</h2>
        </div>

        <div className="bg-[#141c2b] px-3 py-1.5 rounded border border-[#2a364f] text-right font-mono text-xs">
          <span className="text-slate-400 block text-[10px]">COORDINATES</span>
          <span className="text-teal-400 font-bold">11.8000° N, 77.8000° E</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-[#141c2b] rounded-xl border border-[#2a364f] overflow-hidden h-[600px] relative shadow-2xl">
          <MapContainer center={center} zoom={11} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {damInfo.map_nodes?.map((node) => (
              <Marker key={node.id} position={[node.lat, node.lng]} icon={customIcon}>
                <Popup>
                  <div className="font-mono text-xs space-y-1 p-1">
                    <span className="font-bold text-teal-400 block text-sm">{node.name}</span>
                    <span className="text-slate-300 block">{node.type}</span>
                    <span className="text-slate-400 text-[10px] block">Status: {node.status}</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Polyline simulating Cauvery River flow into dam */}
            <Polyline
              positions={[
                [12.1167, 77.7750], // Hogenakkal
                [11.9500, 77.7800],
                [11.8250, 77.7850], // Stanley Reservoir
                [11.8000, 77.8000], // Dam Axis
                [11.7500, 77.8200]  // Downstream Cauvery
              ]}
              color="#14b8a6"
              weight={4}
              dashArray="6, 8"
            />
          </MapContainer>

          <div className="absolute bottom-4 left-4 z-[1000] bg-[#141c2b]/95 p-3 rounded-lg border border-[#2a364f] font-mono text-xs text-slate-300 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">Cauvery River Basin</span>
            </div>
            <p className="text-[10px] text-slate-400">Upstream: Karnataka Releases (KRS & Kabini)</p>
          </div>
        </div>

        {/* Right Side: Specifications Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a364f] space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-[#2a364f] pb-3">
              <Info className="w-4 h-4 text-teal-400" />
              Dam Specifications & Parameters
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-[#2a364f]/60">
                <span className="text-slate-400">Dam Name:</span>
                <span className="text-white font-bold">{damInfo.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2a364f]/60">
                <span className="text-slate-400">River System:</span>
                <span className="text-teal-300 font-bold">{damInfo.river}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2a364f]/60">
                <span className="text-slate-400">Max Height:</span>
                <span className="text-white font-bold">{damInfo.specifications.height_feet} Feet</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2a364f]/60">
                <span className="text-slate-400">Dam Length:</span>
                <span className="text-white font-bold">{damInfo.specifications.length_meters.toLocaleString()} Meters</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2a364f]/60">
                <span className="text-slate-400">Full Storage Capacity:</span>
                <span className="text-teal-300 font-bold">{damInfo.specifications.full_storage_capacity_tmc} TMC</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2a364f]/60">
                <span className="text-slate-400">Spillway Gates:</span>
                <span className="text-white font-bold">{damInfo.specifications.spillway_gates_count} Radial Gates</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Hydroelectric Capacity:</span>
                <span className="text-amber-400 font-bold">{damInfo.specifications.hydroelectric_power_capacity_mw} MW</span>
              </div>
            </div>
          </div>

          <div className="bg-[#141c2b] p-5 rounded-xl border border-[#2a364f] space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Monitored Node Locations
            </h4>
            {damInfo.map_nodes?.map((node) => (
              <div key={node.id} className="p-2.5 rounded bg-[#1a2436] border border-[#2a364f] font-mono text-xs">
                <div className="font-bold text-white">{node.name}</div>
                <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                  <span>{node.type}</span>
                  <span className="text-teal-400 font-semibold">{node.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
