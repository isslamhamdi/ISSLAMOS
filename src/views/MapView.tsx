import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, useMapEvents } from 'react-leaflet';
import { Activity, MapPin, Truck, Warehouse, Navigation, AlertTriangle, Clock, ChevronRight, Search, Filter, Maximize, Minimize, LocateFixed, Zap, PhoneCall, X, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { distributors, vehiclePositions as initialFleet } from '../data/mockData';
import { VehiclePosition, Distributor, Movement, Notification } from '../types';
import { CustomDatePicker } from '../components/CustomDatePicker';
import L from 'leaflet';

// Fix Leaflet marker icons
import 'leaflet/dist/leaflet.css';

// Custom Marker Icons using Tailwind
const createTruckIcon = (status: string, rotation: number, isOverspeeding?: boolean, isStoppedAnormally?: boolean, load: number = 0, ecoScore: number = 85, weather?: { icon: string, temp: string }, driverName?: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative flex items-center justify-center transform transition-all duration-500">
      <div class="absolute w-12 h-12 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 ${
        isOverspeeding || isStoppedAnormally ? 'border-red-600 shadow-red-500/30' :
        status === 'En Transit' ? 'border-emerald-500 shadow-emerald-500/30' : 
        status === 'Déchargement' ? 'border-orange-500 shadow-orange-500/30' :
        status === 'Retour à Vide' ? 'border-purple-500 shadow-purple-500/30' :
        status === 'Maintenance' ? 'border-red-500 shadow-red-500/30' : 
        'border-amber-500 shadow-amber-500/30'
      } flex items-center justify-center transition-all duration-500" style="transform: rotate(${rotation}deg)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${
          isOverspeeding || isStoppedAnormally ? 'text-red-600' :
          status === 'En Transit' ? 'text-emerald-500' : 
          status === 'Déchargement' ? 'text-orange-500' :
          status === 'Retour à Vide' ? 'text-purple-500' :
          status === 'Maintenance' ? 'text-red-500' : 
          'text-amber-500'
        } w-6 h-6">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
        
        <!-- Tonnage Indicator -->
        ${load > 0 ? `
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-slate-600" style="width: ${Math.min(100, (load/27)*100)}%"></div>
          </div>
        ` : ''}
      </div>

      <!-- Driver Name Label -->
      ${driverName ? `
        <div class="absolute left-full ml-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap z-50">
          <p class="text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">${driverName}</p>
        </div>
      ` : ''}

      <!-- Eco-Score Badge -->
      <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white shadow-lg ${
        ecoScore >= 90 ? 'bg-emerald-500' : ecoScore >= 75 ? 'bg-amber-500' : 'bg-red-500'
      }">
        ${ecoScore}
      </div>

      <!-- Weather Badge (Real-time per truck) -->
      ${weather ? `
        <div class="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/20 shadow-sm whitespace-nowrap">
          <span class="text-xs">${weather.icon}</span>
          <span class="text-[7px] font-black text-slate-600 dark:text-slate-300">${weather.temp}</span>
        </div>
      ` : ''}

      ${status === 'En Transit' && !isOverspeeding && !isStoppedAnormally ? '<div class="absolute -top-2 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>' : ''}
      ${status === 'Déchargement' && !isOverspeeding && !isStoppedAnormally ? '<div class="absolute -top-2 -right-2 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>' : ''}
      ${status === 'Retour à Vide' && !isOverspeeding && !isStoppedAnormally ? '<div class="absolute -top-2 -right-2 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>' : ''}
      ${isOverspeeding ? '<div class="absolute -top-2 -right-2 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white dark:border-slate-900 animate-ping shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>' : ''}
      ${isStoppedAnormally ? '<div class="absolute -top-2 -right-2 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>' : ''}
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const createDistributorIcon = (type: string) => L.icon({
  iconUrl: 'https://petro-baraka.octera-demo.com/wp-content/uploads/2025/12/marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to handle map interaction detection
const InteractionHandler = ({ onInteract, onZoom }: { onInteract: () => void, onZoom: (zoom: number) => void }) => {
  const map = useMap();
  useMapEvents({
    movestart: () => onInteract(),
    zoomstart: () => onInteract(),
    zoomend: () => onZoom(map.getZoom()),
  });
  return null;
};

// Component to resize map on fullscreen toggle
const MapResizer = ({ isFullscreen }: { isFullscreen: boolean }) => {
  const map = useMap();
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 300); // Delay to allow CSS transitions to apply
    return () => clearTimeout(timeout);
  }, [isFullscreen, map]);
  return null;
};

// Component to handle map centering only when requested
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface MapViewProps {
  movementsList?: Movement[];
  addNotification?: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
}

export const MapView: React.FC<MapViewProps> = ({ movementsList = [], addNotification }) => {
  const [positions, setPositions] = React.useState<VehiclePosition[]>([]);
  const [selectedVehicle, setSelectedVehicle] = React.useState<VehiclePosition | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [mapStyle, setMapStyle] = React.useState<'standard' | 'dark' | 'light' | 'satellite'>('light');
  const [useRealRoads, setUseRealRoads] = React.useState(true);
  const [routePaths, setRoutePaths] = React.useState<{ [key: string]: [number, number][] }>({});
  const [pathProgress, setPathProgress] = React.useState<{ [key: string]: number }>({});
  const [rotations, setRotations] = React.useState<{ [key: string]: number }>({});

  const fetchRoute = async (id: string, start: [number, number], end: [number, number]) => {
    if (routePaths[id]) return; // Already fetched
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
        setRoutePaths(prev => ({ ...prev, [id]: coords }));
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const [mapCenter, setMapCenter] = React.useState<[number, number]>([36.1900, 5.4100]);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isDirectTrackingMode, setIsDirectTrackingMode] = React.useState(false);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const markerRefs = React.useRef<{ [key: string]: L.Marker | null }>({});

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getWeather = (lat: number) => {
    if (lat < 35) return { icon: '☀️', temp: '28°C', desc: 'Ensoleillé' };
    if (lat < 36) return { icon: '⛅', temp: '24°C', desc: 'Partiellement nuageux' };
    return { icon: '🌧️', temp: '18°C', desc: 'Pluie légère' };
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [isUIHidden, setIsUIHidden] = React.useState(false);

  React.useEffect(() => {
    if (!isFullscreen) {
      setIsUIHidden(false);
    }
  }, [isFullscreen]);

  const centerOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(15);
          setIsMapInteracting(false);
          if (addNotification) {
            addNotification({
              type: 'info',
              title: 'Ma Position',
              message: 'Carte centrée sur votre position actuelle.'
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (addNotification) {
            addNotification({
              type: 'system',
              title: 'Erreur GPS',
              message: 'Impossible de récupérer votre position.'
            });
          }
        }
      );
    }
  };

  const mapStyles = {
    standard: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; OpenStreetMap contributors'
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    light: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
    }
  };
  const [mapZoom, setMapZoom] = React.useState(7);
  const [isMapInteracting, setIsMapInteracting] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date ? date.toISOString().split('T')[0] : '');
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date ? date.toISOString().split('T')[0] : '');
  };

  // Filter movements by the selected date range
  const filteredMovementsList = React.useMemo(() => {
    return movementsList.filter(m => {
      let matchesDate = false;
      
      let date: Date | null = null;
      const createdAt = (m as any).createdAt;
      
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') {
          date = createdAt.toDate();
        } else if (createdAt.seconds) {
          date = new Date(createdAt.seconds * 1000);
        } else if (typeof createdAt === 'string') {
          date = new Date(createdAt);
        }
      }

      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const missionDate = `${year}-${month}-${day}`;
        
        if (startDate && endDate) {
          matchesDate = missionDate >= startDate && missionDate <= endDate;
        } else if (startDate) {
          matchesDate = missionDate === startDate;
        } else if (endDate) {
          matchesDate = missionDate === endDate;
        } else {
          // If no date filter is applied, default to TODAY
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          matchesDate = missionDate === todayStr;
        }
      } else {
        matchesDate = false;
      }
      return matchesDate;
    });
  }, [movementsList, startDate, endDate]);

  // Compute initial positions from movements
  React.useEffect(() => {
    const baseLat = 34.8519; // Biskra
    const baseLng = 5.7273;

    const newPositions: VehiclePosition[] = initialFleet.map(fleetVehicle => {
      // Find if this vehicle has a movement today
      const movement = filteredMovementsList.find(m => m.vehicle === fleetVehicle.vehicle);
      
      if (movement) {
        const client = distributors.find(d => d.name === movement.client);
        let lat = baseLat;
        let lng = baseLng;
        
        let calculatedTotalDistance = movement.distance || 350;
        let calculatedRemainingDistance = calculatedTotalDistance;
        let calculatedTraveledDistance = 0;
        
        if (client) {
          const R = 6371; // Radius of the earth in km
          const dLat = (client.lat - baseLat) * Math.PI / 180;
          const dLon = (client.lng - baseLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(baseLat * Math.PI / 180) * Math.cos(client.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
          // If movement.distance is not provided or 0, use the calculated one
          if (!movement.distance) {
            calculatedTotalDistance = Math.round(R * c * 1.2); // Add 20% for road distance
          }
        } else if (!movement.distance && movement.destination) {
          calculatedTotalDistance = movement.destination.length * 25 + 100;
        }

        if (movement.status === 'En Transit' && client) {
          fetchRoute(movement.id, [baseLat, baseLng], [client.lat, client.lng]);
          lat = baseLat + (client.lat - baseLat) * 0.3;
          lng = baseLng + (client.lng - baseLng) * 0.3;
          calculatedTraveledDistance = Math.round(calculatedTotalDistance * 0.3);
          calculatedRemainingDistance = calculatedTotalDistance - calculatedTraveledDistance;
        } else if (movement.status === 'Retour à Vide' && client) {
          fetchRoute(movement.id, [client.lat, client.lng], [baseLat, baseLng]);
          lat = client.lat + (baseLat - client.lat) * 0.3;
          lng = client.lng + (baseLng - client.lng) * 0.3;
          calculatedTraveledDistance = Math.round(calculatedTotalDistance * 0.3);
          calculatedRemainingDistance = calculatedTotalDistance - calculatedTraveledDistance;
        } else if ((movement.status === 'Livré' || movement.status === 'Déchargement') && client) {
          lat = client.lat;
          lng = client.lng;
          calculatedTraveledDistance = calculatedTotalDistance;
          calculatedRemainingDistance = 0;
        } else if (movement.status === 'En Transit' || movement.status === 'Retour à Vide') {
          calculatedTraveledDistance = Math.round(calculatedTotalDistance * 0.3);
          calculatedRemainingDistance = calculatedTotalDistance - calculatedTraveledDistance;
        } else if (movement.status === 'Livré' || movement.status === 'Déchargement') {
          calculatedTraveledDistance = calculatedTotalDistance;
          calculatedRemainingDistance = 0;
        }

        let eta = undefined;
        if ((movement.status === 'En Transit' || movement.status === 'Retour à Vide') && calculatedRemainingDistance > 0) {
          const speed = 85; // km/h
          const hours = calculatedRemainingDistance / speed;
          const etaDate = new Date(Date.now() + hours * 3600000);
          eta = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        let path: [number, number][] | undefined = undefined;
        if (movement.status === 'En Transit') path = [[baseLat, baseLng], [lat, lng]];
        if (movement.status === 'Retour à Vide' && client) path = [[client.lat, client.lng], [lat, lng]];

        return {
          ...fleetVehicle,
          id: movement.id,
          lat,
          lng,
          speed: (movement.status === 'En Transit' || movement.status === 'Retour à Vide') ? 85 : 0,
          status: (movement.status === 'Chargement' || movement.status === 'En Attente') ? 'Bases / Dépôts' : movement.status,
          lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          destination: movement.destination,
          distance: Number(calculatedTotalDistance.toFixed(1)),
          distanceTraveled: Number(calculatedTraveledDistance.toFixed(2)),
          distanceRemaining: Number(calculatedRemainingDistance.toFixed(2)),
          path,
          eta,
          stoppedTime: movement.status === 'Déchargement' ? Date.now() : undefined,
          load: movement.load,
          ecoScore: movement.ecoScore,
          fuelLevel: 85 + Math.random() * 15,
          fatigueLevel: Math.random() * 20
        };
      }
      
      // If no movement today, return the fleet vehicle at its default position
      // But if it's "En Transit" or has a destination, let's give it some logical mock data
      if (fleetVehicle.status === 'En Transit' && fleetVehicle.destination) {
        // Generate a deterministic mock distance based on the destination string length
        const mockDistance = fleetVehicle.destination.length * 25 + 100; // e.g., "Sétif / Centre" (14 chars) -> 450 km
        const mockTraveled = Math.round(mockDistance * 0.4); // 40% traveled
        
        return {
          ...fleetVehicle,
          distance: Number(mockDistance.toFixed(1)),
          distanceTraveled: Number(mockTraveled.toFixed(2)),
          distanceRemaining: Number((mockDistance - mockTraveled).toFixed(2)),
          path: [[baseLat, baseLng], [fleetVehicle.lat, fleetVehicle.lng]],
          eta: new Date(Date.now() + ((mockDistance - mockTraveled) / 85) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      
      return fleetVehicle;
    });

    setPositions(newPositions);
  }, [filteredMovementsList]);

  // Simulation of movement
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(p => {
        const movement = filteredMovementsList.find(m => m.id === p.id);
        const client = distributors.find(d => d.name === movement?.client);
        const baseLat = 34.8519; // Biskra
        const baseLng = 5.7273;

        if (p.status === 'En Transit' || p.status === 'Retour à Vide') {
          if (client) {
            if (useRealRoads && !routePaths[p.id]) {
              const start: [number, number] = p.status === 'En Transit' ? [baseLat, baseLng] : [client.lat, client.lng];
              const end: [number, number] = p.status === 'En Transit' ? [client.lat, client.lng] : [baseLat, baseLng];
              fetchRoute(p.id, start, end);
            }

            // Determine destination based on status
            const destLat = p.status === 'En Transit' ? client.lat : baseLat;
            const destLng = p.status === 'En Transit' ? client.lng : baseLng;

            // Move towards destination
            let newLat = p.lat;
            let newLng = p.lng;
            let newSpeed = Math.floor(Math.max(60, Math.min(110, p.speed + (Math.random() - 0.5) * 5)));

            if (useRealRoads && routePaths[p.id]) {
              const path = routePaths[p.id];
              const currentIdx = pathProgress[p.id] || 0;
              
              if (currentIdx < path.length - 1) {
                // Move to next point in path
                const nextIdx = currentIdx + 1;
                const p1 = path[currentIdx];
                const p2 = path[nextIdx];
                
                // Calculate rotation
                const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
                setRotations(prev => ({ ...prev, [p.id]: angle + 90 })); // +90 because icon faces up

                newLat = p2[0];
                newLng = p2[1];
                setPathProgress(prev => ({ ...prev, [p.id]: nextIdx }));
              } else {
                // Arrived at destination
                newLat = destLat;
                newLng = destLng;
              }
            } else {
              const dx = destLat - p.lat;
              const dy = destLng - p.lng;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist > 0.001) {
                const distKm = (newSpeed / 3600) * 3;
                const step = distKm / 111;
                newLat = p.lat + (dx/dist) * step;
                newLng = p.lng + (dy/dist) * step;
              } else {
                newLat = destLat;
                newLng = destLng;
              }
            }
            
            const dx = destLat - newLat;
            const dy = destLng - newLng;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist > 0.001) {
              const randomEvent = Math.random();
              if (randomEvent > 0.95) newSpeed = 105; // Overspeed
              if (randomEvent < 0.05) newSpeed = 0; // Stop
              
              // Calculate actual distance moved based on speed
              // newSpeed is km/h. Distance in 3 seconds = (newSpeed / 3600) * 3 km
              const distKm = (newSpeed / 3600) * 3;
              // 1 degree is approx 111 km
              const step = distKm / 111;
              
              const moveDist = Math.min(step, dist);
              const newLat = p.lat + (dx/dist) * moveDist;
              const newLng = p.lng + (dy/dist) * moveDist;
              
              const isOverspeeding = newSpeed > 100;
              const isStoppedAnormally = newSpeed === 0;
              
              let stoppedTime = p.stoppedTime;
              if (isStoppedAnormally && !p.isStoppedAnormally) {
                stoppedTime = Date.now();
              } else if (!isStoppedAnormally) {
                stoppedTime = undefined;
              }

              // Trigger notifications
              if (addNotification) {
                if (isOverspeeding && !p.isOverspeeding) {
                  addNotification({
                    type: 'system',
                    title: 'Alerte Vitesse',
                    message: `Le véhicule ${p.vehicle} roule à ${newSpeed} km/h (limite: 100 km/h).`
                  });
                }
                if (isStoppedAnormally && stoppedTime && (Date.now() - stoppedTime > 10000) && !p.isStoppedAnormally) {
                  // Simulate 10s as "too long" for the demo
                  addNotification({
                    type: 'system',
                    title: 'Arrêt Anormal',
                    message: `Le véhicule ${p.vehicle} est arrêté de manière anormale en plein trajet.`
                  });
                }
              }

              // Calculate ETA
              const R = 6371;
              const dLat = (destLat - newLat) * Math.PI / 180;
              const dLon = (destLng - newLng) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(newLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
              const d = R * c;
              
              const etaSpeed = newSpeed > 0 ? newSpeed : 85;
              const hours = (d * 1.2) / etaSpeed;
              const etaDate = new Date(Date.now() + hours * 3600000);
              const eta = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              // Update distances
              const distRem = d * 1.2;
              const totalDist = Math.max(p.distance || 100, distRem);
              const distTrav = totalDist - distRem;

              // Simulate Fuel Consumption (approx 30L/100km)
              const fuelConsumed = (distKm / 100) * 30;
              const newFuel = Math.max(0, (p.fuelLevel || 100) - (fuelConsumed * 0.5)); // Scale for demo

              // Simulate Fatigue (increases during transit)
              const newFatigue = Math.min(100, (p.fatigueLevel || 0) + 0.05);

              return {
                ...p,
                lat: newLat,
                lng: newLng,
                speed: newSpeed,
                isOverspeeding,
                isStoppedAnormally,
                stoppedTime,
                eta,
                distance: Number(totalDist.toFixed(1)),
                distanceRemaining: Number(distRem.toFixed(2)),
                distanceTraveled: Number(distTrav.toFixed(2)),
                fuelLevel: Number(newFuel.toFixed(1)),
                fatigueLevel: Number(newFatigue.toFixed(1)),
                path: p.path ? [...p.path, [newLat, newLng]] : undefined,
                lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
            } else {
              // Arrived at destination
              if (p.status === 'En Transit') {
                // Start unloading
                if (addNotification) {
                  addNotification({
                    type: 'mission',
                    title: 'Arrivée Client',
                    message: `Le véhicule ${p.vehicle} est arrivé chez ${p.destination || 'le client'} pour déchargement.`
                  });
                }
                return {
                  ...p,
                  lat: client.lat,
                  lng: client.lng,
                  speed: 0,
                  status: 'Déchargement',
                  stoppedTime: Date.now(), // Use stoppedTime to track unloading start
                  distanceRemaining: 0,
                  distanceTraveled: p.distance || 0,
                  lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
              } else if (p.status === 'Retour à Vide') {
                // Arrived back at base
                if (addNotification) {
                  addNotification({
                    type: 'mission',
                    title: 'Retour Base',
                    message: `Le véhicule ${p.vehicle} est de retour à la base de Biskra.`
                  });
                }
                return {
                  ...p,
                  lat: baseLat,
                  lng: baseLng,
                  speed: 0,
                  status: 'Bases / Dépôts',
                  fuelLevel: 100, // Refuel at base
                  fatigueLevel: 0, // Driver rests at base
                  distanceRemaining: 0,
                  distanceTraveled: p.distance || 0,
                  lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
              }
            }
          }
          
          // Fallback random movement if no client found
          const latDiff = (Math.random() - 0.4) * 0.002;
          const lngDiff = (Math.random() - 0.4) * 0.002;
          const newSpeed = Math.floor(Math.max(60, Math.min(110, p.speed + (Math.random() - 0.5) * 5)));
          
          // Simulate a small distance traveled based on speed (km per 3 seconds)
          const distIncrement = (newSpeed / 3600) * 3; 
          const newTraveled = Math.min((p.distance || 0), (p.distanceTraveled || 0) + distIncrement);
          const newRemaining = Math.max(0, (p.distance || 0) - newTraveled);
          
          return {
            ...p,
            lat: p.lat + latDiff,
            lng: p.lng + lngDiff,
            speed: newSpeed,
            distanceTraveled: Number(newTraveled.toFixed(2)),
            distanceRemaining: Number(newRemaining.toFixed(2)),
            fuelLevel: Math.max(0, (p.fuelLevel || 100) - 0.01),
            path: p.path ? [...p.path, [p.lat + latDiff, p.lng + lngDiff]] : undefined,
            lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        } else if (p.status === 'Déchargement') {
          // Ensure stoppedTime is set
          if (!p.stoppedTime) {
            return { ...p, stoppedTime: Date.now() };
          }
          
          // Handle unloading time
          // User requested 30 minutes (1800000ms). 
          // For the demo simulation, we use 30 seconds (30000ms) to make it visible.
          const unloadingDurationMs = 30000; 
          
          if (p.stoppedTime && (Date.now() - p.stoppedTime > unloadingDurationMs)) {
            // Unloading complete, start return trip
            if (addNotification) {
              addNotification({
                type: 'mission',
                title: 'Déchargement Terminé',
                message: `Le véhicule ${p.vehicle} a terminé son déchargement et entame son retour à vide.`
              });
            }

            // Clear route data to force new route calculation for return trip
            setRoutePaths(prev => {
              const next = { ...prev };
              delete next[p.id];
              return next;
            });
            setPathProgress(prev => {
              const next = { ...prev };
              delete next[p.id];
              return next;
            });

            return {
              ...p,
              status: 'Retour à Vide',
              destination: 'Biskra',
              stoppedTime: undefined,
              distanceTraveled: 0, // Reset distance for return trip
              distanceRemaining: p.distance || 0,
              path: [[p.lat, p.lng], [baseLat, baseLng]],
              lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
        } else if (p.status === 'Bases / Dépôts') {
          // Occasionally start a new mission if at base?
          // For now, just stay at base and recover
          return {
            ...p,
            fuelLevel: 100,
            fatigueLevel: 0,
            speed: 0,
            lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return p;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [filteredMovementsList]);

  const filteredPositions = positions.filter(p => {
    const matchesSearch = p.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (isDirectTrackingMode) {
      return matchesSearch && (p.status === 'En Transit' || p.status === 'Déchargement' || p.status === 'Retour à Vide');
    }
    
    return matchesSearch;
  });

  const handleVehicleClick = (pos: VehiclePosition, fromSidebar = false) => {
    setSelectedVehicle(pos);
    setIsMapInteracting(false); // Reset interaction to allow centering
    setMapCenter([pos.lat, pos.lng]);
    
    if (fromSidebar) {
      // Use a tiny timeout just to ensure the map has started panning before opening the popup
      setTimeout(() => {
        const marker = markerRefs.current[pos.id];
        if (marker) {
          marker.openPopup();
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes popup-entrance {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { transform: scale(1.05) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-popup .leaflet-popup-content-wrapper,
        .custom-popup .leaflet-popup-tip-container {
          animation: popup-entrance 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          transform-origin: bottom center;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.3) !important;
          border: 2px solid rgba(16, 185, 129, 0.2);
        }
      `}</style>
      {/* Header with Filters */}
      <div className="bg-brand-green p-5 rounded-[32px] shadow-xl shadow-brand-green/10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Suivi GPS Direct</h2>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Flotte en temps réel</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-2.5 rounded-[20px] border border-white/20 shadow-inner">
          <div className="flex items-center gap-3">
            <CustomDatePicker 
              selected={startDate ? new Date(startDate) : null}
              onChange={handleStartDateChange}
              placeholderText="Date Début"
              className="w-32"
            />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <CustomDatePicker 
              selected={endDate ? new Date(endDate) : null}
              onChange={handleEndDateChange}
              placeholderText="Date Fin"
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Actifs', value: positions.filter(p => p.status === 'En Transit' || p.status === 'Déchargement' || p.status === 'Retour à Vide').length, icon: Navigation, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Chargement', value: positions.filter(p => p.status === 'Chargement').length, icon: Warehouse, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Maintenance', value: positions.filter(p => p.status === 'Maintenance').length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Total Flotte', value: positions.length, icon: Truck, color: 'text-slate-500', bg: 'bg-slate-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className={`p-3 ${stat.bg} dark:bg-slate-800 rounded-xl`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div 
        ref={mapContainerRef}
        className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${isFullscreen ? '!fixed !inset-0 !z-[1000] bg-slate-100 dark:bg-slate-950 !p-0 !m-0 !h-screen !w-screen !block' : ''}`}
      >
        {/* Map Section */}
        <div 
          className={`lg:col-span-3 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative z-0 ${isFullscreen ? '!absolute !inset-0 !z-0 !rounded-none !h-full !w-full !border-none' : 'h-[650px]'}`}
        >
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
            attributionControl={false}
          >
            <MapResizer isFullscreen={isFullscreen} />
            <InteractionHandler onInteract={() => setIsMapInteracting(true)} onZoom={(z) => setMapZoom(z)} />
            {!isMapInteracting && <ChangeView center={mapCenter} zoom={mapZoom} />}
            <TileLayer
              attribution={mapStyles[mapStyle].attribution}
              url={mapStyles[mapStyle].url}
            />
            
            {/* Distributors Markers */}
            {distributors.map((dist) => {
              const nearbyTrucks = positions.filter(p => {
                if (p.status !== 'En Transit') return false;
                const dx = p.lat - dist.lat;
                const dy = p.lng - dist.lng;
                return Math.sqrt(dx*dx + dy*dy) < 0.02; // Approx 2km
              });
              const isAlert = nearbyTrucks.length > 0 && dist.type === 'Client';

              return (
                <React.Fragment key={dist.id}>
                  <Circle 
                    center={[dist.lat, dist.lng]} 
                    radius={isAlert ? 2000 : 500} // 2km if alert
                    pathOptions={{ 
                      color: isAlert ? '#f97316' : '#10b981', 
                      fillColor: isAlert ? '#f97316' : '#10b981', 
                      fillOpacity: isAlert ? 0.2 : 0.1, 
                      weight: isAlert ? 2 : 1,
                      className: isAlert ? 'animate-pulse' : ''
                    }} 
                  />
                  <Marker 
                    position={[dist.lat, dist.lng]} 
                    icon={createDistributorIcon(dist.type)}
                  >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Warehouse className="w-4 h-4 text-slate-500" />
                        <h3 className="font-black text-sm uppercase">{dist.name}</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">{dist.type}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{dist.address}</p>
                      {dist.gpsLink && (
                        <a href={dist.gpsLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-brand-green hover:underline">
                          <MapPin className="w-3 h-3" />
                          Ouvrir dans Google Maps
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            )})}

            {/* Vehicle Markers and Paths */}
            {positions.map((pos) => {
              const fullPath = useRealRoads && routePaths[pos.id] ? routePaths[pos.id] : pos.path;
              const progressIdx = pathProgress[pos.id] || 0;
              const traveledPath = fullPath ? fullPath.slice(0, progressIdx + 1) : [];
              const remainingPath = fullPath ? fullPath.slice(progressIdx) : [];
              const pathColor = pos.status === 'Retour à Vide' ? '#a855f7' : '#10b981';
              const weather = getWeather(pos.lat);

              return (
                <React.Fragment key={pos.id}>
                  {traveledPath.length > 1 && (
                    <Circle 
                      center={traveledPath[0]} 
                      radius={150} 
                      pathOptions={{ color: '#94a3b8', fillColor: '#94a3b8', fillOpacity: 0.3, weight: 1 }} 
                    />
                  )}
                  {traveledPath.length > 1 && (
                    <Polyline 
                      positions={traveledPath} 
                      pathOptions={{ 
                        color: pathColor, 
                        weight: 7, 
                        opacity: 1,
                        lineCap: 'round'
                      }} 
                    />
                  )}
                  {remainingPath.length > 1 && (
                    <Polyline 
                      positions={remainingPath} 
                      pathOptions={{ 
                        color: pathColor, 
                        weight: 4, 
                        opacity: 0.5, 
                        dashArray: '10, 15' 
                      }} 
                    />
                  )}
                  {remainingPath.length > 1 && (
                    <Circle 
                      center={remainingPath[remainingPath.length - 1]} 
                      radius={100} 
                      pathOptions={{ color: pathColor, fillColor: pathColor, fillOpacity: 0.5, weight: 1 }} 
                    />
                  )}
                  <Marker 
                    position={[pos.lat, pos.lng]} 
                    icon={createTruckIcon(pos.status, rotations[pos.id] || 0, pos.isOverspeeding, pos.isStoppedAnormally, pos.load, pos.ecoScore, weather, pos.driver)}
                    ref={(ref) => {
                    if (ref) {
                      markerRefs.current[pos.id] = ref;
                    }
                  }}
                  eventHandlers={{
                    click: () => handleVehicleClick(pos, false),
                  }}
                >
                <Popup className="custom-popup">
                  <div className="p-3 min-w-[200px]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{pos.driver}</p>
                        <h3 className="font-black text-sm uppercase">{pos.vehicle}</h3>
                      </div>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        pos.status === 'En Transit' ? 'bg-emerald-100 text-emerald-600' : 
                        pos.status === 'Maintenance' ? 'bg-red-100 text-red-600' :
                        pos.status === 'Livré' ? 'bg-blue-100 text-blue-600' :
                        pos.status === 'Déchargement' ? 'bg-orange-100 text-orange-600' :
                        pos.status === 'Retour à Vide' ? 'bg-purple-100 text-purple-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {pos.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Vitesse</span>
                        <span className="font-mono font-bold text-emerald-500">{pos.speed} km/h</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Destination</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{pos.destination || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Météo Locale</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{weather.icon}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{weather.temp}</span>
                          <span className="text-[8px] text-slate-400 uppercase">({weather.desc})</span>
                        </div>
                      </div>

                      {/* Maintenance & Hygiene Quick View */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase text-slate-400">Vidange</span>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${pos.oilLife && pos.oilLife < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pos.oilLife || 0}%` }}></div>
                            </div>
                            <span className={`text-[8px] font-bold ${pos.oilLife && pos.oilLife < 20 ? 'text-red-500' : 'text-emerald-500'}`}>{pos.oilLife || 0}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase text-slate-400">Pneumatiques</span>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${pos.tireLife && pos.tireLife < 30 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${pos.tireLife || 0}%` }}></div>
                            </div>
                            <span className={`text-[8px] font-bold ${pos.tireLife && pos.tireLife < 30 ? 'text-red-500' : 'text-amber-500'}`}>{pos.tireLife || 0}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase text-slate-400">Hygiène / Lavage</span>
                          <span className={`text-[8px] font-bold uppercase ${pos.cleanliness === 'PROPRE' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pos.cleanliness || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Parcouru</span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200">{pos.distanceTraveled || 0} km</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Restant</span>
                          <span className="text-xs font-black text-brand-green">{pos.distanceRemaining || 0} km</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Distance Réelle</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{pos.distance || 0} km</span>
                      </div>
                      {pos.eta && (pos.status === 'En Transit' || pos.status === 'Retour à Vide') && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">ETA</span>
                          <span className="font-bold text-emerald-500">{pos.eta}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Dernière MAJ</span>
                        <span className="font-mono text-slate-500">{pos.lastUpdate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <a 
                        href={`tel:${pos.driverPhone}`}
                        className="w-full py-2 bg-emerald-600 !text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <PhoneCall className="w-3 h-3 animate-bounce" />
                        Appeler
                      </a>
                    </div>
                  </div>
                </Popup>
                </Marker>
              </React.Fragment>
            )})}
          </MapContainer>
          
          {/* Fullscreen Search Bar */}
          {isFullscreen && (
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-96 z-[1000] transition-all duration-500 ${isFullscreen && isUIHidden ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <div className="relative shadow-2xl rounded-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher véhicule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-green transition-all shadow-xl text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Map Overlay Controls */}
          <div className={`absolute top-6 left-6 z-[1000] space-y-4 transition-all duration-500 ${isFullscreen && isUIHidden ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'}`}>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 w-48">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Style de Carte</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['standard', 'dark', 'light', 'satellite'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setMapStyle(style)}
                    className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                      mapStyle === style 
                        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => setUseRealRoads(!useRealRoads)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    useRealRoads 
                      ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Navigation className="w-3 h-3" />
                  Tracé Routier {useRealRoads ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 w-48">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Légende SMI</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">En Transit</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Déchargement</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Retour à Vide</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Bases / Dépôts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Alerte Vitesse</span>
                </div>
                {!isDirectTrackingMode && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Chargement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Maintenance</span>
                    </div>
                  </>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-slate-800 dark:bg-white rounded-sm" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Bases / Dépôts</span>
                </div>
              </div>
            </div>
          </div>

          {/* World-Class Navigation Tools */}
          <div className={`absolute top-6 ${isFullscreen && !isUIHidden ? 'right-[350px]' : 'right-6'} z-[1000] flex flex-col items-end gap-3 transition-all duration-500`}>
            <div className="flex flex-col gap-2">
              <button
                onClick={centerOnUser}
                title="Ma Position"
                className="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-brand-green hover:text-white transition-all shadow-xl border border-white/20 dark:border-slate-800"
              >
                <LocateFixed className="w-5 h-5" />
              </button>
              {isFullscreen && (
                <button
                  onClick={() => setIsUIHidden(!isUIHidden)}
                  title={isUIHidden ? "Afficher l'interface" : "Masquer l'interface"}
                  className="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-brand-green hover:text-white transition-all shadow-xl border border-white/20 dark:border-slate-800"
                >
                  {isUIHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={() => setUseRealRoads(!useRealRoads)}
                title="Suivi Routier Réel"
                className={`w-11 h-11 flex items-center justify-center backdrop-blur-md rounded-2xl transition-all shadow-xl border border-white/20 dark:border-slate-800 ${
                  useRealRoads ? 'bg-brand-green text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Navigation className={`w-5 h-5 ${useRealRoads ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Quitter Plein Écran" : "Plein Écran"}
                className="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-brand-green hover:text-white transition-all shadow-xl border border-white/20 dark:border-slate-800"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={() => setIsDirectTrackingMode(!isDirectTrackingMode)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
                isDirectTrackingMode 
                  ? 'bg-brand-green text-white border-brand-green' 
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 border-white/20 dark:border-slate-800'
              }`}
            >
              <Zap className={`w-4 h-4 ${isDirectTrackingMode ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase whitespace-nowrap">
                {isDirectTrackingMode ? 'Mode Suivi Direct Actif' : 'Activer Suivi Direct'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Sidebar List */}
        <div className={`bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col transition-all duration-500 ${isFullscreen ? 'absolute right-6 top-6 bottom-6 w-80 z-[1000] shadow-2xl' : 'h-[650px]'} ${isFullscreen && isUIHidden ? 'opacity-0 pointer-events-none translate-x-8' : 'opacity-100 translate-x-0'}`}>
          <div className="mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Flotte Direct</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg animate-pulse">LIVE</span>
              </div>
            </div>

            {/* Maintenance & Hygiene Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-[8px] font-black text-slate-400 uppercase">Vidange</p>
                </div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200">82% <span className="text-[8px] text-emerald-500 font-bold ml-1">OK</span></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <p className="text-[8px] font-black text-slate-400 uppercase">Hygiène</p>
                </div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200">PROPRE <span className="text-[8px] text-blue-500 font-bold ml-1">100%</span></p>
              </div>
            </div>
            
            {!isFullscreen && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher véhicule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-brand-green transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredPositions.map(pos => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={pos.id} 
                  onClick={() => handleVehicleClick(pos, true)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    selectedVehicle?.id === pos.id 
                      ? 'bg-slate-900 border-slate-900 shadow-lg' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-brand-green'
                  }`}
                >
                  {pos.status === 'En Transit' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  )}
                  {pos.status === 'Déchargement' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                  )}
                  {pos.status === 'Retour à Vide' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className={`text-[10px] font-black uppercase ${selectedVehicle?.id === pos.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {pos.driver}
                      </p>
                      <p className={`text-xs font-black uppercase ${selectedVehicle?.id === pos.id ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {pos.vehicle}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">MAJ: {pos.lastUpdate}</span>
                        <div className="ml-2 flex items-center gap-1">
                          <span className="text-xs">{getWeather(pos.lat).icon}</span>
                          <span className="text-[9px] font-bold text-slate-400">{getWeather(pos.lat).temp}</span>
                        </div>
                      </div>
                      {pos.driverPhone && (
                        <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 ${selectedVehicle?.id === pos.id ? 'text-emerald-400' : 'text-brand-green'}`}>
                          <PhoneCall className="w-2.5 h-2.5" />
                          TEL: {pos.driverPhone}
                        </div>
                      )}
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      pos.status === 'En Transit' ? 'bg-emerald-500/10 text-emerald-500' : 
                      pos.status === 'Maintenance' ? 'bg-red-500/10 text-red-500' :
                      pos.status === 'Déchargement' ? 'bg-orange-500/10 text-orange-500' :
                      pos.status === 'Retour à Vide' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {pos.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-3 h-3 ${selectedVehicle?.id === pos.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-mono ${selectedVehicle?.id === pos.id ? 'text-slate-300' : 'text-slate-500'}`}>
                          {pos.speed} km/h
                        </span>
                      </div>
                      {pos.destination && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className={`text-[9px] font-bold uppercase ${selectedVehicle?.id === pos.id ? 'text-slate-300' : 'text-slate-400'}`}>
                              {pos.destination}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-[9px] font-black ${selectedVehicle?.id === pos.id ? 'text-emerald-400' : 'text-emerald-500'}`}>
                              {pos.distanceTraveled || 0} / {pos.distance || 0} KM
                            </span>
                            <span className={`text-[8px] font-bold uppercase ${selectedVehicle?.id === pos.id ? 'text-white/40' : 'text-slate-400'}`}>
                              Dist. Réelle: {pos.distance || 0} km
                            </span>
                            {pos.eta && (pos.status === 'En Transit' || pos.status === 'Retour à Vide') && (
                              <span className={`text-[8px] font-bold uppercase ${selectedVehicle?.id === pos.id ? 'text-white/50' : 'text-slate-400'}`}>
                                ETA: {pos.eta}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Playback Controls Panel */}
          <AnimatePresence>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
