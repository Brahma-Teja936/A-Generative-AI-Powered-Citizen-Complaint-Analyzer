import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fix default leaflet marker icon in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationPicker = ({ onLocationChange, initialCoords = [17.3850, 78.4867] }) => {
  const [position, setPosition] = useState(initialCoords); // [lat, lng]
  const [addressData, setAddressData] = useState({
    address: '',
    area: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postal_code: '',
    latitude: initialCoords[0],
    longitude: initialCoords[1]
  });
  const [loadingGeo, setLoadingGeo] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    setLoadingGeo(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'CivicAI-Client/1.0' }
      });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const newAddress = {
          address: data.display_name || '',
          area: addr.suburb || addr.neighbourhood || addr.residential || addr.road || '',
          city: addr.city || addr.town || addr.county || 'Hyderabad',
          state: addr.state || 'Telangana',
          postal_code: addr.postcode || '',
          latitude: lat,
          longitude: lng
        };
        setAddressData(newAddress);
        if (onLocationChange) onLocationChange(newAddress);
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setPosition([lat, lng]);
    setAddressData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    reverseGeocode(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleLocationSelect(latitude, longitude);
      },
      (err) => {
        alert('Could not acquire GPS position. Please click on the map.');
        setLoadingGeo(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...addressData, [field]: value };
    setAddressData(updated);
    if (onLocationChange) onLocationChange(updated);
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Complaint Location Intelligence</span>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loadingGeo}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          {loadingGeo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-civic-400" />}
          <span>Use Current GPS Location</span>
        </button>
      </div>

      <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
        <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        </MapContainer>
        <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[10px] text-slate-400 border border-slate-700 z-[400]">
          Click map to reposition marker
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="md:col-span-2">
          <label className="block text-slate-400 font-medium mb-1">Full Street Address / Landmark</label>
          <input
            type="text"
            value={addressData.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="e.g. Near Metro Pillar 104, MG Road"
            className="w-full bg-slate-950 text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:border-civic-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-medium mb-1">Area / Locality</label>
          <input
            type="text"
            value={addressData.area}
            onChange={(e) => handleFieldChange('area', e.target.value)}
            placeholder="e.g. Jubilee Hills"
            className="w-full bg-slate-950 text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:border-civic-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-medium mb-1">City</label>
          <input
            type="text"
            value={addressData.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            className="w-full bg-slate-950 text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:border-civic-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-medium mb-1">Postal Code (PIN)</label>
          <input
            type="text"
            value={addressData.postal_code}
            onChange={(e) => handleFieldChange('postal_code', e.target.value)}
            placeholder="e.g. 500033"
            className="w-full bg-slate-950 text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:border-civic-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-400 font-medium mb-1">GPS Coordinates</label>
          <input
            type="text"
            readOnly
            value={`${addressData.latitude.toFixed(5)}, ${addressData.longitude.toFixed(5)}`}
            className="w-full bg-slate-950/60 text-slate-400 font-mono rounded-lg px-3 py-2 border border-slate-800 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};
