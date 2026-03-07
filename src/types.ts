export type Status = 'Maintenance' | 'En Transit' | 'Chargement' | 'Livré' | 'En Attente' | 'Retour à Vide' | 'Repos Chauffeur';
export type Role = 'ADMIN' | 'VIEWER' | 'SCHEDULER' | 'DRIVER' | 'COMMERCIAL' | 'WAREHOUSE';
export type View = 'DASHBOARD' | 'DRIVERS' | 'SETTINGS' | 'HISTORY' | 'MAP';

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
  lat: number;
  lng: number;
  speed: number;
  status: Status;
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
  status: Status;
  load: number;
  time: string;
  origin: string;
  destination: string;
  distance: number; // km
  fuel: number; // L/100km
  ecoScore: number; // 0-100
  type: 'truck' | 'bus' | 'trailer';
  blNumber?: string;
  invoiceNumber?: string;
  clientPhone?: string;
}
