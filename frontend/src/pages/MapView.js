import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { Clock, Navigation, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { reportsAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function MapView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mapType, setMapType] = useState('normal'); 

  const fetchReports = useCallback(async () => {
    try {
      const res = await reportsAPI.getAll({});
      setReports(res.data.reports || []);
    } catch (error) {
      toast.error('Gis Data Stream Interrupted');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
        },
        () => toast.error('Satellite Fix Lost'),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    fetchReports();
    requestLocation();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchReports, requestLocation]);

  const createCustomIcon = (severity) => {
    const color = severity === 'high' ? '#F43F5E' : severity === 'medium' ? '#F59E0B' : '#10B981';
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 15px ${color}; border: 2px solid white;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  const currentUserIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="width: 16px; height: 16px; background: #38bdf8; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 20px #38bdf8;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const filteredReports = selectedSeverity ? reports.filter(r => r.severity === selectedSeverity) : reports;
  const defaultCenter = [28.6139, 77.2090]; 

  return (
    <div className="space-y-8 animate-enter">
      {/* HUD Header */}
      <div className="glass-panel rounded-[2rem] p-8 flex flex-col lg:flex-row justify-between items-center gap-6 border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20">
             <MapIcon size={24} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Operations_Map</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Geospatial Intelligence Unit</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="glass-panel px-6 py-3 rounded-xl flex items-center gap-4 border-white/5 font-mono text-xs">
              <Clock size={14} className="text-sky-400" />
              <span className="text-white font-bold">{currentTime.toLocaleTimeString()}</span>
           </div>
           <button onClick={requestLocation} className="btn-secondary !rounded-xl !py-3 !px-5 !text-[10px] uppercase tracking-widest">
              <Navigation size={14} /> Recalibrate
           </button>
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {['normal', 'satellite'].map(type => (
                <button 
                  key={type} 
                  onClick={() => setMapType(type)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${mapType === type ? 'bg-sky-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {type}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Stats & Filters */}
        <div className="space-y-6">
           <div className="glass-card rounded-[2rem] p-8 border-white/5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Threat Selection</h3>
              <div className="space-y-2">
                 <FilterBtn active={selectedSeverity === ''} onClick={() => setSelectedSeverity('')} label="All Sensors" color="sky" />
                 <FilterBtn active={selectedSeverity === 'high'} onClick={() => setSelectedSeverity('high')} label="Critical" color="rose" />
                 <FilterBtn active={selectedSeverity === 'medium'} onClick={() => setSelectedSeverity('medium')} label="Warning" color="amber" />
                 <FilterBtn active={selectedSeverity === 'low'} onClick={() => setSelectedSeverity('low')} label="Nominal" color="emerald" />
              </div>
           </div>

           <div className="glass-card rounded-[2rem] p-8 border-white/5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ShieldAlert size={14} /> Intelligence_Log
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredReports.slice(0, 5).map(r => (
                   <div key={r._id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black text-white uppercase truncate">{r.damageType}</p>
                      <p className="text-[9px] text-gray-500 font-mono mt-1">{r.location?.lat.toFixed(4)}, {r.location?.lng.toFixed(4)}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-3 relative glass-card rounded-[2.5rem] overflow-hidden border-white/5 min-h-[600px] bg-black">
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl z-50"
              >
                <div className="w-20 h-20 border-t-2 border-sky-500 rounded-full animate-spin"></div>
                <p className="mt-6 text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] animate-pulse">Establishing Satellite Uplink</p>
              </motion.div>
            )}
          </AnimatePresence>

          <MapContainer center={currentLocation || defaultCenter} zoom={13} className="h-full w-full z-0 grayscale-[0.4] brightness-[0.8] contrast-[1.2]">
            <TileLayer 
              url={mapType === 'normal' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
            />
            <MapUpdater center={currentLocation} />
            {currentLocation && <Marker position={currentLocation} icon={currentUserIcon} />}
            {filteredReports.map((report) => (
              <Marker 
                key={report._id} 
                position={[report.location?.lat || defaultCenter[0], report.location?.lng || defaultCenter[1]]} 
                icon={createCustomIcon(report.severity)}
              >
                <Popup className="premium-popup">
                   <div className="p-2 font-mono">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{report.severity} Priority</p>
                      <p className="text-xs font-bold text-black uppercase">{report.damageType}</p>
                   </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, label, color }) {
  const colors = {
    sky: 'border-sky-500/20 text-sky-400 bg-sky-500/5',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/5',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/5',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-500 ${active ? colors[color] + ' border-opacity-50 shadow-lg' : 'border-white/5 text-gray-500 hover:text-white hover:bg-white/5'}`}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]"></div>}
    </button>
  );
}
