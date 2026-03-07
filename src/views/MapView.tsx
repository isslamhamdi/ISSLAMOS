import React from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Activity, MapPin } from 'lucide-react';
import { vehiclePositions } from '../data/mockData';
import { VehiclePosition } from '../types';

export const MapView = () => {
  const [positions, setPositions] = React.useState<VehiclePosition[]>(vehiclePositions);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(p => {
        if (p.status === 'En Transit') {
          return {
            ...p,
            lat: p.lat + (Math.random() - 0.5) * 0.005,
            lng: p.lng + (Math.random() - 0.5) * 0.005,
            speed: Math.floor(Math.max(60, Math.min(110, p.speed + (Math.random() - 0.5) * 10)))
          };
        }
        return p;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative h-[600px] z-0">
          <MapContainer center={[34.8505, 5.7280]} zoom={8} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.map((pos) => (
              <Marker key={pos.id} position={[pos.lat, pos.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-sm">{pos.vehicle}</h3>
                    <p className="text-xs">Statut: {pos.status}</p>
                    <p className="text-xs">Vitesse: {pos.speed} km/h</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="absolute top-6 left-16 z-[1000] space-y-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 pointer-events-auto">
              <h3 className="text-xs font-black uppercase tracking-tight mb-3">Légende GPS</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-green rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">En Transit (Actif)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-red rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Maintenance / Alerte</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Chargement / Quai</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-tight">Flotte en Direct</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {positions.map(pos => (
              <motion.div 
                key={pos.id} 
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-green transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-black uppercase">{pos.vehicle}</p>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    pos.status === 'En Transit' ? 'bg-emerald-100 text-success' : 
                    pos.status === 'Maintenance' ? 'bg-red-100 text-danger' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {pos.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Activity className="w-3 h-3" />
                  <span className="font-mono">{pos.speed} km/h</span>
                  <span className="mx-1">•</span>
                  <MapPin className="w-3 h-3" />
                  <span className="font-mono">{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
