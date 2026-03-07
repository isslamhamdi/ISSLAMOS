import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard,
  Settings,
  Users,
  History,
  Map as MapIcon,
  Bell,
  CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  setDoc,
  Timestamp,
  getDocs,
  limit,
  where,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { playNotificationSound } from './utils/audio';

import { Role, View, Notification, Movement, Status } from './types';
import { WeatherWidget } from './components/WeatherWidget';
import { KeyboardShortcutsLegend } from './components/KeyboardShortcutsLegend';
import { FuelCalculator } from './components/FuelCalculator';
import { Toast } from './components/Toast';
import { LoginModal } from './components/LoginModal';
import { MissionModal } from './components/MissionModal';
import { DashboardView } from './views/DashboardView';
import { DriversView } from './views/DriversView';
import { HistoryView } from './views/HistoryView';
import { MapView } from './views/MapView';
import { SettingsView } from './views/SettingsView';
import { Loader } from './components/Loader';
import { Onboarding } from './components/Onboarding';
import { distributors } from './data/distributors';
import { drivers as driversData } from './data/drivers';

// Fix Leaflet default icon issue
import L from 'leaflet';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function App() {
  const [role, setRole] = React.useState<Role>('VIEWER');
  const [currentView, setCurrentView] = React.useState<View>('DASHBOARD');
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Use Alt key to avoid browser conflicts
      if (e.altKey && e.key.toLowerCase() === 'n') {
        handleNewMissionClick();
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.altKey && e.key.toLowerCase() === 'r') {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setStatusFilter('All');
        setVehicleTypeFilter('All');
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        setCurrentView('DASHBOARD');
      } else if (e.altKey && e.key.toLowerCase() === 'h') {
        setCurrentView('HISTORY');
      } else if (e.altKey && e.key.toLowerCase() === 'm') {
        setCurrentView('MAP');
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        setCurrentView('DRIVERS');
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        setCurrentView('SETTINGS');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [vehicleTypeFilter, setVehicleTypeFilter] = React.useState('All');
  const [toasts, setToasts] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback(async (notif: Omit<Notification, 'id' | 'read' | 'time'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notif,
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  }, []);

  const [movementsList, setMovementsList] = React.useState<Movement[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingMission, setEditingMission] = React.useState<Movement | null>(null);
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Auth State Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const email = user.email;
        if (email?.endsWith('@petrobaraka.com')) {
          if (email === 'admin@petrobaraka.com') setRole('ADMIN');
          else if (email === 'planification@petrobaraka.com') setRole('SCHEDULER');
          else if (email === 'commercial@petrobaraka.com') setRole('COMMERCIAL');
          else if (email === 'logistique@petrobaraka.com') setRole('WAREHOUSE');
          else if (email === 'chauffeur@petrobaraka.com') setRole('DRIVER');
          else setRole('VIEWER');
        } else if (email === 'izzlemovic@gmail.com') {
          setRole('ADMIN');
        } else {
          setRole('VIEWER');
        }
      } else {
        setIsAuthenticated(false);
        setRole('VIEWER');
      }
    });
    return () => unsubscribe();
  }, []);

  // Debug: Monitor movements list
  React.useEffect(() => {
    console.log("Current movements list size:", movementsList.length);
  }, [movementsList]);

  // Force Add Single Mission (Debug)
  const forceAddMission = async () => {
    try {
      const randomDriverObj = driversData[0]; // Take the first driver
      const testMission = {
        vehicle: `${randomDriverObj.trailerType} ${randomDriverObj.brand}`,
        code: randomDriverObj.code,
        registration: randomDriverObj.registration,
        driver: randomDriverObj.name,
        client: 'TEST CLIENT',
        status: 'En Attente',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        blNumber: `TEST-${Date.now()}`,
        type: randomDriverObj.type === '6X4' ? 'truck' : 'trailer',
        wilaya: 'ALGER'
      };
      await addDoc(collection(db, 'movements'), testMission);
      addNotification({
        type: 'system',
        title: 'Debug',
        message: 'Mission test ajoutée avec succès.'
      });
    } catch (error) {
      console.error("Force add error:", error);
      addNotification({
        type: 'system',
        title: 'Erreur Debug',
        message: `Erreur ajout test: ${error}`
      });
    }
  };

  // Seed Historical Data (Random Generator)
  const seedData = React.useCallback(async () => {
    addNotification({
      type: 'system',
      title: 'Initialisation...',
      message: 'Génération des données en cours...'
    });

    try {
      // On récupère les missions existantes pour vérifier les doublons en mémoire
      const q = query(collection(db, 'movements'));
      const snapshot = await getDocs(q);
      const existingBLs = new Set(snapshot.docs.map(doc => doc.data().blNumber));
      
      console.log(`Nombre de missions trouvées : ${snapshot.size}`);

      // Helper data for random generation
      const clients = distributors.map(d => d.name);
      const statuses: Status[] = ['Livré', 'En Transit', 'Chargement', 'Maintenance', 'En Attente'];
      const activeDrivers = driversData.filter(d => !d.trailerType.toLowerCase().includes('citerne') && d.name !== 'Sans chauffeur');

      const historicalMissions = [];
      const startDate = new Date('2026-02-01'); // Start from Feb 1st
      const endDate = new Date('2026-03-05');   // Until today

      // Generate random missions for each day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Generate 3 to 8 missions per day
        const dailyCount = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < dailyCount; i++) {
          const dateStr = d.toISOString().split('T')[0];
          const randomDriverObj = activeDrivers[Math.floor(Math.random() * activeDrivers.length)];
          const randomClientName = clients[Math.floor(Math.random() * clients.length)];
          const distributor = distributors.find(d => d.name === randomClientName);
          const randomWilaya = distributor ? distributor.wilaya : 'ALGER';
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Random times
          const hourStart = Math.floor(Math.random() * 12) + 4; // 4am to 4pm
          const minStart = Math.floor(Math.random() * 4) * 15;
          const duration = Math.floor(Math.random() * 8) + 2; // 2 to 10 hours
          
          const entryTime = new Date(d);
          entryTime.setHours(hourStart, minStart);
          
          const exitTime = new Date(entryTime);
          exitTime.setHours(hourStart + duration, minStart + 30);

          const blNum = `BL-${dateStr.replace(/-/g, '')}-${String(i + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;

          historicalMissions.push({
            vehicle: `${randomDriverObj.trailerType} ${randomDriverObj.brand}`,
            code: randomDriverObj.code,
            registration: randomDriverObj.registration,
            client: randomClientName,
            wilaya: randomWilaya,
            entryCompany: entryTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
            entryDock: new Date(entryTime.getTime() + 30*60000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
            exitDock: new Date(entryTime.getTime() + 90*60000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
            driver: randomDriverObj.name,
            status: randomStatus,
            load: Math.floor(Math.random() * 40) + 60, // 60-100%
            time: entryTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
            origin: 'Biskra',
            destination: randomWilaya.charAt(0) + randomWilaya.slice(1).toLowerCase(),
            distance: Math.floor(Math.random() * 800) + 50,
            fuel: Math.floor(Math.random() * 30) + 10,
            ecoScore: Math.floor(Math.random() * 30) + 70,
            type: randomDriverObj.type === '6X4' ? 'truck' : 'trailer',
            blNumber: blNum,
            invoiceNumber: `FAC-${dateStr.replace(/-/g, '')}-${String(i + 1).padStart(2, '0')}`,
            createdAt: Timestamp.fromDate(entryTime),
            updatedAt: Timestamp.fromDate(exitTime)
          });
        }
      }

      // --- FORCE SPECIFIC DATA FOR MARCH 2ND, 2026 ---
      const specificDate = new Date('2026-03-02T10:00:00');
      const specificDateStr = '2026-03-02';
      
      // Add 5 specific missions for March 2nd
      for (let i = 0; i < 5; i++) {
        const entryTime = new Date(specificDate);
        entryTime.setHours(8 + i, 0); // 8:00, 9:00, etc.
        const exitTime = new Date(entryTime);
        exitTime.setHours(entryTime.getHours() + 4);

        const blNum = `BL-MARCH2-${String(i + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;
        const randomDriverObj = activeDrivers[i % activeDrivers.length];

        const randomClientName = clients[i % clients.length];
        const distributor = distributors.find(d => d.name === randomClientName);
        const randomWilaya = distributor ? distributor.wilaya : 'ALGER';

        historicalMissions.push({
          vehicle: `${randomDriverObj.trailerType} ${randomDriverObj.brand}`,
          code: randomDriverObj.code,
          registration: randomDriverObj.registration,
          client: randomClientName,
          wilaya: randomWilaya,
          entryCompany: entryTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
          entryDock: new Date(entryTime.getTime() + 30*60000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
          exitDock: new Date(entryTime.getTime() + 90*60000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
          driver: randomDriverObj.name,
          status: 'Livré', // Force status to Livré for visibility
          load: 100,
          time: entryTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
          origin: 'Biskra',
          destination: randomWilaya.charAt(0) + randomWilaya.slice(1).toLowerCase(),
          distance: 300,
          fuel: 50,
          ecoScore: 95,
          type: 'truck',
          blNumber: blNum,
          invoiceNumber: `FAC-MARCH2-${String(i + 1).padStart(2, '0')}`,
          createdAt: Timestamp.fromDate(entryTime),
          updatedAt: Timestamp.fromDate(exitTime)
        });
      }
      // ------------------------------------------------

      let addedCount = 0;
      for (const mission of historicalMissions) {
        if (!existingBLs.has(mission.blNumber)) {
          try {
            await setDoc(doc(db, 'movements', mission.blNumber), mission);
            addedCount++;
          } catch (e) {
            console.warn(`Skipping duplicate or error for ${mission.blNumber}`, e);
          }
        }
      }
      
      if (addedCount > 0) {
        addNotification({
          type: 'system',
          title: 'Succès',
          message: `${addedCount} missions ajoutées.`
        });
      } else {
        addNotification({
          type: 'info',
          title: 'Info',
          message: 'Aucune nouvelle donnée à ajouter (déjà présentes).'
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification({
        type: 'system',
        title: 'Erreur',
        message: `Erreur lors de la génération: ${error}`
      });
    }
  }, [addNotification]);

  // Movements Listener
  React.useEffect(() => {
    // On retire le orderBy pour être sûr de récupérer TOUS les documents, 
    // même ceux qui n'auraient pas de champ createdAt (ce qui arrive si ajoutés manuellement sans ce champ)
    const q = query(collection(db, 'movements'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movementsData: Movement[] = [];
      
      snapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data() as Movement;
        
        // Identify old randomly generated fake vehicles by their names
        const isFakeVehicle = data.vehicle && (
          data.vehicle.includes('VOLVO') || 
          data.vehicle.includes('RENAULT') || 
          data.vehicle.includes('SCANIA') || 
          data.vehicle.includes('MERCEDES') || 
          data.vehicle.includes('IVECO') || 
          data.vehicle.includes('DAF') || 
          data.vehicle.includes('MAN') ||
          data.vehicle.includes('MARUCHI') ||
          data.vehicle.includes('PLATEAU 01') ||
          data.vehicle.includes('CITERNE 02') ||
          data.vehicle.includes('Citerne')
        );

        if (!isFakeVehicle) {
          let needsUpdate = false;
          let updateData: Partial<Movement> = {};

          if (data.vehicle && data.vehicle.includes('Notre Marque')) {
            const updatedVehicle = data.vehicle.replace(/Notre Marque/gi, 'PB');
            data.vehicle = updatedVehicle;
            updateData.vehicle = updatedVehicle;
            needsUpdate = true;
          }

          const clientName = data.client ? data.client.trim() : '';
          const knownDistributor = distributors.find(d => d.name === clientName);
          
          if (knownDistributor) {
            if (data.wilaya !== knownDistributor.wilaya) {
              data.wilaya = knownDistributor.wilaya;
              updateData.wilaya = knownDistributor.wilaya;
              needsUpdate = true;
            }
            if (data.client !== knownDistributor.name) {
              data.client = knownDistributor.name;
              updateData.client = knownDistributor.name;
              needsUpdate = true;
            }
          } else {
            // Client is not in our distributors list. Replace it with a valid one.
            // Use docSnapshot.id to pick a deterministic random distributor
            let charSum = 0;
            for (let i = 0; i < docSnapshot.id.length; i++) {
              charSum += docSnapshot.id.charCodeAt(i);
            }
            const randomDistributor = distributors[charSum % distributors.length];
            
            data.client = randomDistributor.name;
            data.wilaya = randomDistributor.wilaya;
            
            updateData.client = randomDistributor.name;
            updateData.wilaya = randomDistributor.wilaya;
            needsUpdate = true;
          }

          // Enforce logical load percentages based on status
          if (data.status === 'Livré' && data.load !== 100) {
            data.load = 100;
            updateData.load = 100;
            needsUpdate = true;
          } else if (data.status === 'Maintenance' && data.load !== 0) {
            data.load = 0;
            updateData.load = 0;
            needsUpdate = true;
          }

          if (needsUpdate) {
            updateDoc(doc(db, 'movements', docSnapshot.id), updateData).catch(console.error);
          }
          
          movementsData.push({
            id: docSnapshot.id,
            ...data
          });
        } else {
          // If it's an old randomly generated fake vehicle, delete it from Firestore
          // We do this silently in the background
          deleteDoc(doc(db, 'movements', docSnapshot.id)).catch(console.error);
        }
      });
      
      // On trie en mémoire pour plus de robustesse
      const sortedMovements = [...movementsData].sort((a, b) => {
        const dateA = (a as any).createdAt?.toDate ? (a as any).createdAt.toDate().getTime() : 0;
        const dateB = (b as any).createdAt?.toDate ? (b as any).createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      
      setMovementsList(sortedMovements);
    }, (error) => {
      console.error("Movements listener error:", error);
      addNotification({
        type: 'system',
        title: 'Erreur de connexion',
        message: 'Impossible de récupérer les données du serveur.'
      });
    });
    return () => unsubscribe();
  }, []);

  // Notifications Listener
  React.useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
        let timeStr = 'À l\'instant';
        if (diff > 0 && diff < 60) timeStr = `Il y a ${diff} min`;
        else if (diff >= 60 && diff < 1440) timeStr = `Il y a ${Math.floor(diff / 60)} h`;
        else if (diff >= 1440) timeStr = `Il y a ${Math.floor(diff / 1440)} j`;

        return {
          id: doc.id,
          ...data,
          time: timeStr
        };
      }) as Notification[];
      
      setNotifications(notifsData);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
           const newNotif = { id: change.doc.id, ...change.doc.data(), time: 'À l\'instant' } as Notification;
           const created = change.doc.data().createdAt?.toDate();
           if (created && (new Date().getTime() - created.getTime()) < 10000) {
             setToasts(prev => [...prev, newNotif]);
             playNotificationSound();
             setTimeout(() => {
               setToasts(prev => prev.filter(t => t.id !== newNotif.id));
             }, 5000);
           }
        }
      });
    }, (error) => {
      console.error("Notifications listener error:", error);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleNewMissionClick = () => {
    setEditingMission(null);
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (role === 'VIEWER') {
      addNotification({
        type: 'system',
        title: 'Accès refusé',
        message: 'Vous n\'avez pas les droits pour ajouter une mission.'
      });
      return;
    }
    setIsAdding(true);
  };

  const handleEditMission = (mission: Movement) => {
    setEditingMission(mission);
    if (isAuthenticated) {
      setIsAdding(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  React.useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getFilteredMovements = () => {
    return movementsList.filter(m => {
      // Date Filter
      let matchesDate = true;
      if (startDate && endDate) {
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
          matchesDate = missionDate >= startDate && missionDate <= endDate;
        } else {
          matchesDate = false;
        }
      }

      // Search Filter
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        m.vehicle.toLowerCase().includes(searchStr) || 
        m.driver.toLowerCase().includes(searchStr) || 
        m.client.toLowerCase().includes(searchStr) || 
        m.registration.toLowerCase().includes(searchStr) ||
        m.wilaya.toLowerCase().includes(searchStr);

      // Status Filter
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;

      // Vehicle Type Filter
      const matchesType = vehicleTypeFilter === 'All' || m.type === vehicleTypeFilter;

      return matchesDate && matchesSearch && matchesStatus && matchesType;
    });
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getFormattedDateForFilename = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR').replace(/\//g, '-');
  };

  const getDateRangeTitle = (start: string, end: string) => {
    const startF = getFormattedDate(start);
    const endF = getFormattedDate(end);
    
    if (startF && endF) return `${startF} au ${endF}`;
    if (startF) return startF;
    if (endF) return endF;
    return 'Toutes les dates';
  };

  const getDateRangeFilename = (start: string, end: string) => {
    const startF = getFormattedDateForFilename(start);
    const endF = getFormattedDateForFilename(end);
    
    if (startF && endF) return `${startF}-au-${endF}`;
    if (startF) return startF;
    if (endF) return endF;
    return 'Toutes_les_dates';
  };

  const exportToCSV = () => {
    const filtered = getFilteredMovements();
    const headers = ["Véhicule", "Matricule", "Client", "Wilaya", "Chauffeur", "Statut", "Charge", "Départ", "Arrivée"];
    const rows = filtered.map(m => [
      m.vehicle, m.registration, m.client, m.wilaya, m.driver, m.status, m.load, m.entryCompany, m.destination
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = getDateRangeFilename(startDate, endDate);
    const timeStr = new Date().toLocaleTimeString('fr-FR').replace(/:/g, '-');
    link.download = `Rapport_Mouvements_${dateStr}_${timeStr}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const filtered = getFilteredMovements();
    const tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
      <table border="1">
        <thead>
          <tr>
            <th style="background-color: #28a745; color: white;">Véhicule</th>
            <th style="background-color: #28a745; color: white;">Matricule</th>
            <th style="background-color: #28a745; color: white;">Client</th>
            <th style="background-color: #28a745; color: white;">Wilaya</th>
            <th style="background-color: #28a745; color: white;">Chauffeur</th>
            <th style="background-color: #28a745; color: white;">Statut</th>
            <th style="background-color: #28a745; color: white;">Charge</th>
            <th style="background-color: #28a745; color: white;">Départ</th>
            <th style="background-color: #28a745; color: white;">Arrivée</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(m => `
            <tr>
              <td>${m.vehicle}</td><td>${m.registration}</td><td>${m.client}</td><td>${m.wilaya}</td><td>${m.driver}</td><td>${m.status}</td><td>${m.load}</td><td>${m.entryCompany}</td><td>${m.destination}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = getDateRangeFilename(startDate, endDate);
    const timeStr = new Date().toLocaleTimeString('fr-FR').replace(/:/g, '-');
    link.download = `Rapport_Mouvements_${dateStr}_${timeStr}.xls`;
    link.click();
  };

  const exportToWord = () => {
    const filtered = getFilteredMovements();
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Rapport</title></head>
      <body>
        <h1 style="color: #28a745;">Rapport de Pilotage - Mouvements</h1>
        <p><strong>Période du programme :</strong> ${getDateRangeTitle(startDate, endDate)}</p>
        <p><strong>Généré le :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <br/>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th>Véhicule</th><th>Client</th><th>Chauffeur</th><th>Statut</th><th>Charge</th><th>Départ</th><th>Arrivée</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(m => `
              <tr>
                <td>${m.vehicle}</td><td>${m.client}</td><td>${m.driver}</td><td>${m.status}</td><td>${m.load}</td><td>${m.entryCompany}</td><td>${m.destination}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <br/>
        <p><em>Baraka Logistique - Document Interne</em></p>
      </body></html>
    `;
    const blob = new Blob([content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = getDateRangeFilename(startDate, endDate);
    const timeStr = new Date().toLocaleTimeString('fr-FR').replace(/:/g, '-');
    link.download = `Rapport_Mouvements_${dateStr}_${timeStr}.doc`;
    link.click();
  };

  const exportToPDF = async () => {
    // A5 Paysage : 210mm x 148mm
    const doc = new jsPDF({ orientation: 'landscape', format: 'a5' });
    
    // --- 1. CHARGEMENT DES IMAGES ---
    const logoUrl = "https://i.ibb.co/qL0cpf7q/BARAKA-LOGISTIQUE-LOGO.png";
    const signatureUrl = "https://i.ibb.co/Df76zR0q/signature-soulayman.png";
    let imgData: string | null = null;
    let signatureImgData: string | null = null;
    let logoWidth = 50;
    let logoHeight = 12;
    
    try {
      const [responseLogo, responseSig] = await Promise.all([fetch(logoUrl), fetch(signatureUrl)]);
      const [blobLogo, blobSig] = await Promise.all([responseLogo.blob(), responseSig.blob()]);
      
      [imgData, signatureImgData] = await Promise.all([
        new Promise<string>((resolve) => { const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(blobLogo); }),
        new Promise<string>((resolve) => { const r = new FileReader(); r.onloadend = () => resolve(r.result as string); r.readAsDataURL(blobSig); })
      ]);

      if (imgData) {
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
        const ratio = img.width / img.height;
        logoHeight = 14;
        logoWidth = logoHeight * ratio;
        if (logoWidth > 70) { logoWidth = 70; logoHeight = logoWidth / ratio; }
      }
    } catch (error) {
      console.error("Error loading images for PDF:", error);
    }

    const filtered = getFilteredMovements();

    // --- 2. DESSINER LE CONTENU DE LA PREMIÈRE PAGE ---
    // Logo
    if (imgData) {
      doc.addImage(imgData, 'PNG', 10, 8, logoWidth, logoHeight); 
    } else {
      doc.setFontSize(16);
      doc.setTextColor(40, 167, 69);
      doc.text("BARAKA LOGISTIQUE", 10, 15);
    }
    
    // Titre et Date
    const headerY = imgData ? 10 + logoHeight + 5 : 25;
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(`Rapport de Pilotage - Mouvements (${getDateRangeTitle(startDate, endDate)})`, 10, headerY);
    
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    const now = new Date();
    doc.text(`Généré le : ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, 10, headerY + 5);

    // Stats
    const totalVehicules = filtered.length;
    const enTransit = filtered.filter(m => m.status === 'En Transit').length;
    const maintenance = filtered.filter(m => m.status === 'Maintenance').length;
    const chargeMoyenne = Math.round(filtered.reduce((acc, curr) => acc + Number(curr.load), 0) / totalVehicules) || 0;

    const stats = [
      { label: "TOTAL FLOTTE", value: totalVehicules.toString(), color: [37, 99, 235] },
      { label: "EN MISSION", value: enTransit.toString(), color: [22, 163, 74] },
      { label: "CHARGE MOY.", value: `${chargeMoyenne}%`, color: [234, 88, 12] },
      { label: "MAINTENANCE", value: maintenance.toString(), color: [220, 38, 38] }
    ];

    const statsStartX = 105;
    const statsStartY = 8;
    const cardWidth = 24;
    const cardHeight = 18;
    const cardGap = 2;

    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "bold");
    doc.text("SYNTHÈSE DE LA FLOTTE", statsStartX, statsStartY - 2);

    stats.forEach((stat, i) => {
        const x = statsStartX + (i * (cardWidth + cardGap));
        const y = statsStartY;

        // Ombre portée
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(x + 0.5, y + 0.5, cardWidth, cardHeight, 1, 1, 'F');

        // Fond de carte
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1, 1, 'FD');

        // Barre de couleur supérieure
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.rect(x, y, cardWidth, 2, 'F');

        // Valeur
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth/2, y + 10, { align: 'center' });

        // Libellé
        doc.setFontSize(6);
        doc.setTextColor(107, 114, 128);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth/2, y + 15, { align: 'center' });
    });

    // --- 3. TABLEAU AVEC AUTOTABLE ---
    const totalPagesExp = "{total_pages_count_string}";
    autoTable(doc, {
      head: [['Véhicule', 'Matricule', 'Client', 'Wilaya', 'Chauffeur', 'Statut', 'Charge', 'Départ', 'Arrivée']],
      body: filtered.map(m => [m.vehicle, m.registration, m.client, m.wilaya, m.driver, m.status, m.load, m.entryCompany, m.destination]),
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 167, 69] },
      didDrawPage: (data) => {
        // --- PIED DE PAGE ---
        const footerText = "Baraka Logistique - La confiance en mouvement ! - Document Interne";
        doc.setFontSize(8);
        doc.setTextColor(150);
        
        // Page number
        doc.text(`Page ${data.pageNumber}/${totalPagesExp}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
        
        // Footer text
        doc.text(footerText, 10, doc.internal.pageSize.height - 10);
      }
    });
    
    doc.putTotalPages(totalPagesExp);
    
    // --- 4. SIGNATURE & KPIs (SUR LA DERNIÈRE PAGE) ---
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    const pageHeight = doc.internal.pageSize.height;

    // Calcul des KPIs
    const totalMissions = filtered.length;
    const maintenanceMissions = filtered.filter(m => m.status === 'Maintenance').length;
    const tauxDispo = totalMissions > 0 ? ((totalMissions - maintenanceMissions) / totalMissions * 100) : 100;
    const consoMoyenne = totalMissions > 0 ? (filtered.reduce((acc, curr) => acc + (curr.fuel || 0), 0) / totalMissions) : 0;

    // Positionner les éléments après le tableau avec un espacement fixe suffisant
    // On s'assure de ne pas dépasser le bas de la page
    let chartY = Math.min(finalY + 70, pageHeight - 40); // Increased spacing (finalY + 70 instead of + 55)
    
    // 1. En-têtes (Alignés)
    doc.setFontSize(6);
    doc.setTextColor(0);
    doc.text("Indicateurs de Performance (Dernière Période)", 10, chartY);
    doc.text("Visa Chef de Parc / Exploitation :", 150, chartY);
    doc.text("Saidi Souleyman", 150, chartY + 4);
    if (signatureImgData) {
        doc.addImage(signatureImgData, 'PNG', 150, chartY + 6, 30, 15);
    }
    
    // 2. Signature (Ligne)
    doc.setDrawColor(150);
    doc.line(150, chartY + 22, 200, chartY + 22);
    
    // 3. Indicateurs (Sous l'en-tête gauche)
    const indY = chartY + 4; // Reduced spacing (chartY + 4 instead of + 6)
    doc.setFontSize(7);
    doc.text(`Taux Disponibilité : ${tauxDispo.toFixed(1)}%`, 10, indY);
    doc.setFillColor(40, 167, 69);
    doc.rect(10, indY + 2, (tauxDispo / 100) * 60, 3, 'F');
    
    doc.text(`Consommation Moyenne : ${consoMoyenne.toFixed(1)} L/100km`, 10, indY + 10);
    doc.setFillColor(234, 88, 12);
    doc.rect(10, indY + 12, (Math.min(consoMoyenne / 50, 1)) * 60, 3, 'F');
    
    doc.save(`Rapport_Mouvements_${getDateRangeFilename(startDate, endDate)}.pdf`);
  };

  const handlePasswordChange = () => {
    alert("Fonctionnalité de changement de mot de passe en cours de développement (Backend requis).");
  };

  const handleAuditLogs = () => {
    alert("Les logs d'audit nécessitent une connexion à la base de données centrale.");
  };

  // Reset Data (Delete from Firestore)
  const handleReset = React.useCallback(async () => {
    try {
      addNotification({
        type: 'system',
        title: 'Réinitialisation...',
        message: 'Suppression des données en cours...'
      });

      const movementsSnapshot = await getDocs(collection(db, 'movements'));
      const deletePromises = movementsSnapshot.docs.map(d => deleteDoc(doc(db, 'movements', d.id)));
      
      const notifsSnapshot = await getDocs(collection(db, 'notifications'));
      const notifsPromises = notifsSnapshot.docs.map(d => deleteDoc(doc(db, 'notifications', d.id)));

      await Promise.all([...deletePromises, ...notifsPromises]);

      setStartDate('');
      setEndDate('');
      setSearchTerm('');
      setStatusFilter('All');
      setVehicleTypeFilter('All');
      
      addNotification({
        type: 'system',
        title: 'Succès',
        message: 'Toutes les données de test ont été supprimées.'
      });
    } catch (error) {
      console.error("Reset error:", error);
      addNotification({
        type: 'system',
        title: 'Erreur',
        message: 'Erreur lors de la suppression des données.'
      });
    }
  }, [addNotification]);

  return (
    <div className="min-h-screen transition-colors duration-500 overflow-x-hidden">
      {isLoading && (
        <Loader 
          onComplete={() => {
            setIsLoading(false);
            const skip = localStorage.getItem('baraka_skip_onboarding') === 'true';
            if (!skip) {
              setShowOnboarding(true);
            }
          }} 
        />
      )}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding 
            onComplete={() => {
              setShowOnboarding(false);
              addNotification({
                type: 'info',
                title: 'Bienvenue',
                message: 'Bienvenue sur l\'espace opérationnel de PB.'
              });
            }} 
          />
        )}
      </AnimatePresence>
      <div className="min-h-screen h-screen overflow-y-auto bg-[#f8fafc] dark:bg-slate-950 text-primary dark:text-slate-200 flex justify-center p-2 md:p-4 lg:p-8 transition-colors duration-500">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-[1600px] space-y-8 pt-32"
        >
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-white dark:border-slate-800 gap-6 transition-colors duration-500">
            <div className="flex items-center gap-4">
              <div className="h-20 w-56 flex items-center justify-center relative overflow-hidden group">
                {/* Logo Image */}
                <img 
                  src="https://i.ibb.co/qL0cpf7q/BARAKA-LOGISTIQUE-LOGO.png" 
                  alt="BARAKA LOGISTIQUE" 
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center w-full h-full bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
                          <div class="relative">
                            <span class="text-brand-green font-black text-3xl italic tracking-tighter leading-none" style="-webkit-text-stroke: 1px white;">BARAKA</span>
                            <div class="absolute -bottom-1 -right-2 bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded italic transform -rotate-3 shadow-sm">LOGISTIQUE</div>
                          </div>
                          <p class="text-[8px] text-slate-400 mt-2 font-medium italic">"La confiance en mouvement!"</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="brand-info border-l border-slate-200 dark:border-slate-700 pl-4 hidden sm:block">
                <span className="text-sm font-arabic font-normal text-brand-red tracking-widest uppercase">حكاية ثقة</span>
                <h1 className="text-xl font-extrabold tracking-tighter uppercase text-brand-green dark:text-emerald-400">Système de Pilotage</h1>
              </div>
            </div>

            {/* Navigation Subtile */}
            <nav className="hidden xl:flex items-center gap-1 bg-slate-50/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('DASHBOARD')}
                className={`p-2.5 transition-all rounded-xl border ${
                  currentView === 'DASHBOARD' 
                  ? 'text-brand-green bg-white dark:bg-slate-700 shadow-xs border-slate-200 dark:border-slate-600' 
                  : 'text-slate-400 hover:text-brand-green hover:bg-white dark:hover:bg-slate-700 border-transparent'
                }`} 
                title="Tableau de Bord"
              >
                <LayoutDashboard className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('DRIVERS')}
                className={`p-2.5 transition-all rounded-xl border ${
                  currentView === 'DRIVERS' 
                  ? 'text-brand-green bg-white dark:bg-slate-700 shadow-xs border-slate-200 dark:border-slate-600' 
                  : 'text-slate-400 hover:text-brand-green hover:bg-white dark:hover:bg-slate-700 border-transparent'
                }`} 
                title="Conducteurs"
              >
                <Users className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('HISTORY')}
                className={`p-2.5 transition-all rounded-xl border ${
                  currentView === 'HISTORY' 
                  ? 'text-brand-green bg-white dark:bg-slate-700 shadow-xs border-slate-200 dark:border-slate-600' 
                  : 'text-slate-400 hover:text-brand-green hover:bg-white dark:hover:bg-slate-700 border-transparent'
                }`} 
                title="Historique"
              >
                <History className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('MAP')}
                className={`p-2.5 transition-all rounded-xl border ${
                  currentView === 'MAP' 
                  ? 'text-brand-green bg-white dark:bg-slate-700 shadow-xs border-slate-200 dark:border-slate-600' 
                  : 'text-slate-400 hover:text-brand-green hover:bg-white dark:hover:bg-slate-700 border-transparent'
                }`} 
                title="Suivi GPS"
              >
                <MapIcon className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('SETTINGS')}
                className={`p-2.5 transition-all rounded-xl border ${
                  currentView === 'SETTINGS' 
                  ? 'text-brand-green bg-white dark:bg-slate-700 shadow-xs border-slate-200 dark:border-slate-600' 
                  : 'text-slate-400 hover:text-brand-green hover:bg-white dark:hover:bg-slate-700 border-transparent'
                }`} 
                title="Paramètres"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </nav>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
              {/* Theme Toggle, Notifications & Role Switcher */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-white dark:border-slate-800" />
                    )}
                  </button>

                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-tight dark:text-slate-100">Notifications</h3>
                        <button 
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                          className="text-[10px] font-bold text-brand-green hover:underline"
                        >
                          Tout marquer comme lu
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.read ? 'bg-brand-green/5' : ''}`}>
                              <div className="flex gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                  n.type === 'mission' ? 'bg-brand-green' : 
                                  n.type === 'maintenance' ? 'bg-brand-red' : 'bg-blue-500'
                                }`} />
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                                  <p className="text-[9px] text-slate-400 mt-2 font-mono">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-xs text-slate-400 italic">Aucune notification</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    if (isAuthenticated) {
                      try {
                        await signOut(auth);
                      } catch (e) {
                        console.error("Sign out error", e);
                      }
                      // Manually reset state for Demo Mode / Fallback compatibility
                      setIsAuthenticated(false);
                      setRole('VIEWER');
                      setCurrentView('DASHBOARD');
                      
                      addNotification({
                        type: 'system',
                        title: 'Déconnexion',
                        message: 'Vous avez été déconnecté avec succès.'
                      });
                    } else {
                      setIsLoginOpen(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                    isAuthenticated 
                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                    : 'bg-brand-green text-white border-brand-green hover:bg-brand-green/90 shadow-lg shadow-brand-green/20'
                  }`}
                >
                  {isAuthenticated ? 'SE DÉCONNECTER' : 'SE CONNECTER'}
                </button>
              </div>
              <WeatherWidget />
              <div className="text-right ml-auto">
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{today}</p>
                <p className="text-[11px] text-success font-bold flex items-center justify-end gap-1">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  SYSTÈME EN DIRECT
                </p>
              </div>
            </div>
          </header>

          {/* Content Area */}
          {currentView === 'DASHBOARD' ? (
            <DashboardView 
              key={`dashboard-${startDate}-${endDate}`}
              movementsList={movementsList}
              role={role}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              vehicleTypeFilter={vehicleTypeFilter}
              setVehicleTypeFilter={setVehicleTypeFilter}
              exportToPDF={exportToPDF}
              exportToExcel={exportToExcel}
              exportToCSV={exportToCSV}
              exportToWord={exportToWord}
              showExportMenu={showExportMenu}
              setShowExportMenu={setShowExportMenu}
              handleNewMissionClick={handleNewMissionClick}
              handleEditMission={handleEditMission}
              onSeedData={seedData}
              searchRef={searchRef}
            />
          ) : currentView === 'DRIVERS' ? (
            <DriversView role={role} handleNewMissionClick={handleNewMissionClick} />
          ) : currentView === 'HISTORY' ? (
            <HistoryView 
              key={`history-${startDate}-${endDate}`}
              movementsList={movementsList}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              vehicleTypeFilter={vehicleTypeFilter}
              setVehicleTypeFilter={setVehicleTypeFilter}
              onSeedData={seedData}
              addNotification={addNotification}
              role={role}
            />
          ) : currentView === 'MAP' ? (
            <MapView />
          ) : (
            <SettingsView 
              role={role} 
              handlePasswordChange={handlePasswordChange} 
              handleAuditLogs={handleAuditLogs} 
              onSeedData={seedData}
              onResetData={handleReset}
              onForceAdd={forceAddMission}
            />
          )}

          {/* Footer */}
          <footer className="pt-8 pb-12 text-center space-y-4">
            <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <motion.span whileHover={{ color: '#1e5f38' }} className="cursor-default transition-colors">Logistique Intégrée</motion.span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <motion.span whileHover={{ color: '#1e5f38', x: 2 }} className="cursor-default transition-colors">Biskra, Algérie</motion.span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <motion.p 
                whileHover={{ scale: 1.05 }}
                className="text-[11px] text-slate-400 italic cursor-default"
              >
                "La confiance en mouvement!"
              </motion.p>
              <p className="text-[11px] text-slate-400">
                © 2026 <strong className="text-brand-green">BARAKA LOGISTIQUE</strong> | SMI Logistics Management System
              </p>
            </div>
          </footer>

          {/* Toast Container */}
          <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
            {toasts.map(t => (
              <Toast key={t.id} notification={t} onClose={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} />
            ))}
          </div>

          {/* Notification Succès */}
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-brand-green text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm">Mission programmée avec succès !</span>
            </motion.div>
          )}

          <LoginModal 
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            setIsAuthenticated={setIsAuthenticated}
            setIsAdding={setIsAdding}
            setRole={setRole}
            loginError={loginError}
            setLoginError={setLoginError}
          />

          <MissionModal 
            isOpen={isAdding || !!editingMission}
            onClose={() => {
              setIsAdding(false);
              setEditingMission(null);
            }}
            editingMission={editingMission}
            setShowSuccess={setShowSuccess}
            role={role}
            addNotification={addNotification}
          />
        </motion.div>
        <FuelCalculator />
        <KeyboardShortcutsLegend />
      </div>
    </div>
  );
}
