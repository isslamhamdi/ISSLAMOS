export interface Driver {
  code: string;
  registration: string;
  type: string;
  brand: string;
  trailerMat: string;
  trailerBrand: string;
  trailerType: string;
  phone: string;
  name: string;
  product: string;
  licenseType: string;
  medicalVisitDate: string;
  joinDate: string;
  illnessStartDate?: string;
  illnessEndDate?: string;
}

export type Status = 'Maintenance' | 'En Transit' | 'Chargement' | 'Déchargement' | 'Livré' | 'En Attente' | 'Retour à Vide' | 'Repos Chauffeur' | 'Bases / Dépôts' | 'Malade';
export type Role = 'ADMIN' | 'VIEWER' | 'SCHEDULER' | 'DRIVER' | 'COMMERCIAL' | 'WAREHOUSE';
export type View = 'DASHBOARD' | 'DRIVERS' | 'SETTINGS' | 'HISTORY' | 'MAP' | 'LEADERBOARD' | 'OIL_CHANGE' | 'HYGIENE';

export interface Notification {
  id: string;
  type: 'mission' | 'maintenance' | 'system' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string;
  vehicle: string;
  vehicleType: 'truck' | 'bus' | 'trailer';
  driver: string;
  activity: string;
  status: Status;
  details: string;
  entryTime: string;
  exitTime: string;
  ecoScore: number;
}

export interface VehiclePosition {
  id: string;
  vehicle: string;
  driver: string;
  driverPhone?: string;
  lat: number;
  lng: number;
  speed: number;
  status: Status;
  lastUpdate: string;
  destination?: string;
  distance?: number; // Total distance
  distanceTraveled?: number;
  distanceRemaining?: number;
  path?: [number, number][];
  eta?: string;
  isOverspeeding?: boolean;
  isStoppedAnormally?: boolean;
  stoppedTime?: number; // timestamp of when it stopped
  oilLife?: number;
  tireLife?: number;
  cleanliness?: 'PROPRE' | 'À LAVER';
  currentKm?: number;
  nextOilChangeKm?: number;
  load?: number;
  ecoScore?: number;
}

export interface Distributor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'Base' | 'Client' | 'Relais';
  address: string;
  gpsLink?: string;
}

export interface Movement {
  id: string;
  vehicle: string;
  code: string;
  registration: string;
  client: string;
  wilaya: string;
  entryCompany: string;
  entryDock: string;
  exitDock: string;
  driver: string;
  driverPhone?: string;
  status: Status;
  load: number;
  time: string;
  origin: string;
  destination: string;
  distance: number; // km
  fuel: number; // L/100km
  ecoScore: number; // 0-100
  type: 'truck' | 'bus' | 'trailer';
  oilLife?: number;
  tireLife?: number;
  cleanliness?: 'PROPRE' | 'À LAVER';
  currentKm?: number;
  nextOilChangeKm?: number;
  blNumber?: string;
  invoiceNumber?: string;
  clientPhone?: string;
  createdAt?: any;
  updatedAt?: any;
}
