import { Notification, HistoryEntry, VehiclePosition, Movement } from '../types';

export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'mission',
    title: 'Nouvelle Mission',
    message: 'Mission attribuée à Debi Lakhdar (MARUCH ZIBAN)',
    time: 'Il y a 5 min',
    read: false
  },
  {
    id: 'n2',
    type: 'maintenance',
    title: 'Alerte Maintenance',
    message: 'Maintenance imminente pour PLATEAU ZIBAN (100km restants)',
    time: 'Il y a 1h',
    read: false
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Mise à jour Système',
    message: 'Le système SMI a été mis à jour vers la v2.4',
    time: 'Hier',
    read: true
  }
];

export const historyEntries: HistoryEntry[] = [
  {
    id: 'h1',
    date: '2026-03-03',
    vehicle: 'MARUCH ZIBAN',
    vehicleType: 'truck',
    driver: 'Debi Lakhdar',
    activity: 'Livraison SONATRACH',
    status: 'Livré',
    details: 'Trajet Biskra -> Hassi Messaoud',
    entryTime: '07:30',
    exitTime: '16:45',
    ecoScore: 88
  },
  {
    id: 'h2',
    date: '2026-03-03',
    vehicle: 'MARUCH PB',
    vehicleType: 'truck',
    driver: 'Mehdi Mekhelkhel',
    activity: 'Transfert NAFTAL',
    status: 'En Transit',
    details: 'Trajet Biskra -> Sétif',
    entryTime: '06:45',
    exitTime: '--:--',
    ecoScore: 92
  },
  {
    id: 'h3',
    date: '2026-03-02',
    vehicle: 'PLATEAU ZIBAN',
    vehicleType: 'trailer',
    driver: 'Rezzag Liza Ahmed',
    activity: 'Chargement COSIDER',
    status: 'Chargement',
    details: 'Zone Industrielle Biskra',
    entryTime: '08:15',
    exitTime: '--:--',
    ecoScore: 85
  }
];

export const vehiclePositions: VehiclePosition[] = [
  { id: '1', vehicle: 'MARUCH ZIBAN', lat: 34.85, lng: 5.73, speed: 0, status: 'Maintenance' },
  { id: '2', vehicle: 'MARUCH PB', lat: 36.19, lng: 5.41, speed: 85, status: 'En Transit' },
  { id: '3', vehicle: 'PLATEAU ZIBAN', lat: 34.84, lng: 5.75, speed: 5, status: 'Chargement' },
];

export const movements: Movement[] = [
    {
      id: '1',
      vehicle: 'MARUCH ZIBAN',
      code: '181',
      registration: '000057-523-07',
      client: 'SONATRACH',
      wilaya: 'Biskra',
      entryCompany: '07:30',
      entryDock: '08:00',
      exitDock: '08:30',
      driver: 'Debi Lakhdar',
      status: 'Maintenance',
      load: 0,
      time: '08:00',
      origin: 'Biskra',
      destination: 'Atelier Biskra',
      distance: 5,
      fuel: 32.5,
      ecoScore: 78,
      type: 'truck'
    },
    {
      id: '2',
      vehicle: 'MARUCH PB',
      code: '230',
      registration: 'P311611',
      client: 'NAFTAL',
      wilaya: 'Sétif',
      entryCompany: '06:45',
      entryDock: '07:15',
      exitDock: '07:45',
      driver: 'Mehdi Mekhelkhel',
      status: 'En Transit',
      load: 85,
      time: '07:15',
      origin: 'Biskra',
      destination: 'Sétif / Centre',
      distance: 220,
      fuel: 28.2,
      ecoScore: 94,
      type: 'truck'
    },
    {
      id: '3',
      vehicle: 'PLATEAU ZIBAN',
      code: '183',
      registration: '000059-523-07',
      client: 'COSIDER',
      wilaya: 'Alger',
      entryCompany: '08:15',
      entryDock: '08:45',
      exitDock: '09:15',
      driver: 'Rezzag Liza Ahmed',
      status: 'Chargement',
      load: 45,
      time: '08:45',
      origin: 'Biskra',
      destination: 'Zone Industrielle',
      distance: 12,
      fuel: 30.1,
      ecoScore: 88,
      type: 'trailer'
    }
];
