import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create custom colored SVG marker icons for emergencies and responders
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      font-size: 16px;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const ICONS = {
  CRITICAL: createCustomIcon('#dc2626', '🔴'),
  HIGH: createCustomIcon('#ea580c', '🟠'),
  AMBULANCE: createCustomIcon('#0284c7', '🚑'),
  POLICE: createCustomIcon('#4f46e5', '🚔'),
  FIRE_RESCUE: createCustomIcon('#b91c1c', '🚒'),
  HOSPITAL: createCustomIcon('#059669', '🏥'),
  DEFAULT_SERVICE: createCustomIcon('#475569', '🚨')
};

export const EmergencyMap = ({ 
  incidents = [], 
  services = [], 
  center = [17.3850, 78.4867], 
  zoom = 12 
}) => {
  return (
    <div className="h-[450px] w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Live Complaint Incident Markers */}
        {incidents.map((inc) => {
          const coords = inc.location?.coordinates;
          if (!coords || coords.length !== 2) return null;
          const [lng, lat] = coords;
          const icon = inc.severity === 'CRITICAL' ? ICONS.CRITICAL : ICONS.HIGH;

          return (
            <Marker key={inc.complaint_id} position={[lat, lng]} icon={icon}>
              <Popup className="emergency-popup">
                <div className="text-slate-900 text-xs p-1">
                  <div className="font-bold text-rose-700 flex items-center space-x-1">
                    <span>🚨 {inc.complaint_id}</span>
                  </div>
                  <div className="font-medium mt-1">{inc.title}</div>
                  <div className="text-slate-600 mt-1">Severity: <b>{inc.severity}</b> | Status: <b>{inc.emergency_status || 'DETECTED'}</b></div>
                  <div className="text-slate-500 text-[10px] mt-1">{inc.location?.address}</div>
                  <a
                    href={`/admin/emergency/${inc.complaint_id}`}
                    className="inline-block mt-2 text-civic-700 font-bold underline"
                  >
                    Open in Emergency Command Center &rarr;
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Emergency Service Responders */}
        {services.map((svc) => {
          const coords = svc.location?.coordinates;
          if (!coords || coords.length !== 2) return null;
          const [lng, lat] = coords;
          const icon = ICONS[svc.service_type] || ICONS.DEFAULT_SERVICE;

          return (
            <Marker key={svc.service_id || svc.id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="text-slate-900 text-xs p-1">
                  <div className="font-bold text-slate-800">{svc.organization_name}</div>
                  <div className="text-slate-600 mt-0.5">Type: {svc.service_type}</div>
                  <div className="text-slate-600 mt-0.5">📞 {svc.phone}</div>
                  <div className="text-slate-500 text-[10px] mt-1">{svc.address}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
