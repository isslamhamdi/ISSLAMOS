import React from 'react';
import { motion } from 'motion/react';
import { Activity, X } from 'lucide-react';
import { doc, updateDoc, addDoc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { playNotificationSound } from '../utils/audio';
import { Movement, Role, Status, Notification } from '../types';
import { distributors } from '../data/distributors';
import { drivers } from '../data/drivers';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMission: Movement | null;
  setShowSuccess: (show: boolean) => void;
  role: Role;
  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => void;
  movementsList: Movement[];
}

export const MissionModal: React.FC<MissionModalProps> = ({ 
  isOpen, 
  onClose, 
  editingMission, 
  setShowSuccess, 
  role,
  addNotification,
  movementsList
}) => {
  if (!isOpen) return null;

  // Get list of drivers and vehicles already in an active mission
  // Active means status is not 'Livré', 'Maintenance', 'Malade', 'Repos Chauffeur', 'Bases / Dépôts'
  const busyDrivers = movementsList
    .filter(m => !['Livré', 'Maintenance', 'Malade', 'Repos Chauffeur', 'Bases / Dépôts', 'En Attente'].includes(m.status))
    .map(m => m.driver);
  
  const busyVehicles = movementsList
    .filter(m => !['Livré', 'Maintenance', 'Malade', 'Repos Chauffeur', 'Bases / Dépôts', 'En Attente'].includes(m.status))
    .map(m => m.vehicle);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors duration-500 max-h-[90vh] overflow-y-auto"
      >
        <div className="px-8 py-6 bg-brand-green dark:bg-emerald-900 text-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5" />
            <h3 className="font-bold text-lg">{editingMission ? 'Modifier Mission' : 'Nouvelle Programmation'}</h3>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="hover:bg-white/20 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form className="p-8 space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          
          const missionData: any = {
            vehicle: formData.get('vehicle') as string,
            code: formData.get('code') as string,
            registration: formData.get('registration') as string,
            client: formData.get('client') as string,
            wilaya: formData.get('wilaya') as string,
            entryCompany: formData.get('entryCompany') as string,
            entryDock: formData.get('entryDock') as string,
            exitDock: formData.get('exitDock') as string,
            driver: formData.get('driver') as string,
            status: ((role as any) === 'COMMERCIAL' && !editingMission) ? 'En Attente' : (formData.get('status') as Status),
            load: Number(formData.get('load')),
            time: formData.get('entryDock') as string,
            origin: formData.get('origin') as string,
            destination: formData.get('destination') as string,
            distance: Number(formData.get('distance')),
            fuel: Number(formData.get('fuel')),
            blNumber: formData.get('blNumber') as string,
            invoiceNumber: formData.get('invoiceNumber') as string,
            clientPhone: formData.get('clientPhone') as string,
            type: 'truck',
            validatedKm: Number(formData.get('validatedKm')) || 0,
            validatedTonnage: Number(formData.get('validatedTonnage')) || 0
          };

          // Enforce logical load percentages based on status
          if (missionData.status === 'Livré') {
            missionData.load = 100;
          } else if (missionData.status === 'Maintenance') {
            missionData.load = 0;
          }

          try {
            let missionId = '';
            if (editingMission) {
              missionId = editingMission.id;
              const missionRef = doc(db, 'movements', editingMission.id);
              await updateDoc(missionRef, {
                ...missionData,
                updatedAt: Timestamp.now()
              });
              
              // Workflow notification
              if (role === 'SCHEDULER' && missionData.status === 'Chargement') {
                addNotification({
                  type: 'mission',
                  title: 'Mission Programmée',
                  message: `La mission pour ${missionData.client} a été programmée. Prête pour chargement au quai ${missionData.entryDock}.`
                });
              } else if (role === 'WAREHOUSE' && missionData.status === 'En Transit') {
                addNotification({
                  type: 'mission',
                  title: 'Départ Véhicule',
                  message: `Le véhicule ${missionData.vehicle} a quitté le quai. En transit vers ${missionData.destination}.`
                });
              }
            } else {
              const docRef = await addDoc(collection(db, 'movements'), {
                ...missionData,
                ecoScore: 100,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              });
              missionId = docRef.id;
            }

            // ARCHIVE SYSTEM: Create a copy in history collection to ensure data integrity
            // This ensures that even if a mission is deleted from active movements, 
            // the history and leaderboard remain accurate.
            const historyRef = doc(db, 'history', missionId);
            await setDoc(historyRef, {
              ...missionData,
              originalMissionId: missionId,
              archivedAt: Timestamp.now(),
              createdAt: editingMission?.createdAt || Timestamp.now(),
              ecoScore: editingMission?.ecoScore || 100,
              // Add specific fields for leaderboard if needed
              validatedKm: (missionData as any).validatedKm || missionData.distance || 0,
              validatedTonnage: (missionData as any).validatedTonnage || missionData.load || 0
            });

            // Notification logic for Commercial role
            if ((role as any) === 'COMMERCIAL' && !editingMission) {
              addNotification({
                type: 'mission',
                title: 'Nouvelle Mission Saisie',
                message: `Client: ${missionData.client}. Mission envoyée à la planification pour attribution véhicule/chauffeur.`
              });
              
              // Play notification sound
              playNotificationSound();
            }
            
            onClose();
            setShowSuccess(true);
          } catch (error) {
            console.error("Error saving mission:", error);
          }
        }}>
          {role !== 'COMMERCIAL' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Véhicule</label>
                <input 
                  name="vehicle" 
                  defaultValue={editingMission?.vehicle} 
                  required 
                  readOnly={role === 'WAREHOUSE'}
                  placeholder="MARUCH ZIBAN" 
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Code Unité</label>
                <input 
                  name="code" 
                  defaultValue={editingMission?.code} 
                  required 
                  readOnly={role === 'WAREHOUSE'}
                  placeholder="185" 
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Immatriculation</label>
                <input 
                  name="registration" 
                  defaultValue={editingMission?.registration} 
                  required 
                  readOnly={role === 'WAREHOUSE'}
                  placeholder="01234-123-07" 
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                />
              </div>
            </div>
          )}

          {(role as any) === 'COMMERCIAL' && (
             <>
               <input type="hidden" name="vehicle" defaultValue={editingMission?.vehicle || "EN ATTENTE"} />
               <input type="hidden" name="code" defaultValue={editingMission?.code || "000"} />
               <input type="hidden" name="registration" defaultValue={editingMission?.registration || "00000-000-00"} />
             </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Client / Distributeur</label>
              <select 
                name="client" 
                defaultValue={editingMission?.client} 
                required 
                disabled={role === 'WAREHOUSE' || role === 'DRIVER'}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${(role === 'WAREHOUSE' || role === 'DRIVER') ? 'opacity-60 cursor-not-allowed' : ''}`}
                onChange={(e) => {
                  const selectedDistributor = distributors.find(d => d.name === e.target.value);
                  if (selectedDistributor) {
                    const form = e.target.form;
                    if (form) {
                      const wilayaInput = form.querySelector('[name="wilaya"]') as HTMLInputElement;
                      const destinationInput = form.querySelector('[name="destination"]') as HTMLInputElement;
                      const phoneInput = form.querySelector('[name="clientPhone"]') as HTMLInputElement;
                      const distanceInput = form.querySelector('[name="distance"]') as HTMLInputElement;
                      
                      if (wilayaInput) wilayaInput.value = selectedDistributor.wilaya;
                      if (destinationInput) destinationInput.value = selectedDistributor.wilaya;
                      if (phoneInput) phoneInput.value = selectedDistributor.phone;
                      
                      // Calculate approximate distance from base (Sétif: 36.1900, 5.4100)
                      if (distanceInput && selectedDistributor.lat && selectedDistributor.lng) {
                        const R = 6371; // Radius of the earth in km
                        const dLat = (selectedDistributor.lat - 36.1900) * Math.PI / 180;
                        const dLon = (selectedDistributor.lng - 5.4100) * Math.PI / 180;
                        const a = 
                          Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(36.1900 * Math.PI / 180) * Math.cos(selectedDistributor.lat * Math.PI / 180) * 
                          Math.sin(dLon/2) * Math.sin(dLon/2); 
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                        const d = R * c; // Distance in km
                        distanceInput.value = Math.round(d * 1.2).toString(); // Add 20% for road distance
                      }
                    }
                  }
                }}
              >
                <option value="">Sélectionner un client</option>
                {distributors.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Wilaya (Ciblée)</label>
              <input 
                name="wilaya" 
                defaultValue={editingMission?.wilaya} 
                required 
                readOnly={role === 'WAREHOUSE' || role === 'DRIVER'}
                placeholder="Wilaya..." 
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${(role === 'WAREHOUSE' || role === 'DRIVER') ? 'opacity-60 cursor-not-allowed' : ''}`} 
              />
            </div>
          </div>

          {/* Champs Commerciaux */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider">N° Bon Livraison</label>
              <input 
                name="blNumber" 
                defaultValue={editingMission?.blNumber} 
                placeholder="BL-2026-XXXX" 
                readOnly={((role as any) !== 'COMMERCIAL' && role !== 'ADMIN') || ((role as any) === 'COMMERCIAL' && editingMission && editingMission.status !== 'En Attente')}
                className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${(((role as any) !== 'COMMERCIAL' && role !== 'ADMIN') || ((role as any) === 'COMMERCIAL' && editingMission && editingMission.status !== 'En Attente')) ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider">N° Facture</label>
              <input 
                name="invoiceNumber" 
                defaultValue={editingMission?.invoiceNumber} 
                placeholder="FAC-2026-XXXX" 
                readOnly={((role as any) !== 'COMMERCIAL' && role !== 'ADMIN') || ((role as any) === 'COMMERCIAL' && editingMission && editingMission.status !== 'En Attente')}
                className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${(((role as any) !== 'COMMERCIAL' && role !== 'ADMIN') || ((role as any) === 'COMMERCIAL' && editingMission && editingMission.status !== 'En Attente')) ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">N° Téléphone</label>
            <input 
              name="clientPhone" 
              defaultValue={editingMission?.clientPhone} 
              placeholder="05XX XX XX XX" 
              readOnly={role === 'WAREHOUSE' || role === 'DRIVER'}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${(role === 'WAREHOUSE' || role === 'DRIVER') ? 'opacity-60 cursor-not-allowed' : ''}`} 
            />
          </div>

          {role !== 'COMMERCIAL' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Entrée Ent.</label>
                  <input name="entryCompany" type="time" defaultValue={editingMission?.entryCompany} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Entrée Quai</label>
                  <input name="entryDock" type="time" defaultValue={editingMission?.entryDock} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sortie Quai</label>
                  <input name="exitDock" type="time" defaultValue={editingMission?.exitDock} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Chef d'Unité (Chauffeur)</label>
                  <select 
                    name="driver" 
                    defaultValue={editingMission?.driver} 
                    required 
                    disabled={role === 'WAREHOUSE'}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onChange={(e) => {
                      const selectedDriver = drivers.find(d => d.name === e.target.value);
                      if (selectedDriver) {
                        const form = e.target.form;
                        if (form) {
                          const vehicleInput = form.querySelector('[name="vehicle"]') as HTMLInputElement;
                          const codeInput = form.querySelector('[name="code"]') as HTMLInputElement;
                          const registrationInput = form.querySelector('[name="registration"]') as HTMLInputElement;
                          
                          if (vehicleInput) vehicleInput.value = `${selectedDriver.trailerType} ${selectedDriver.brand}`;
                          if (codeInput) codeInput.value = selectedDriver.code;
                          if (registrationInput) registrationInput.value = selectedDriver.registration;
                        }
                      }
                    }}
                  >
                    <option value="">Sélectionner un chauffeur</option>
                    {drivers.map((d, idx) => {
                      const isBusy = busyDrivers.includes(d.name) && d.name !== editingMission?.driver;
                      return (
                        <option 
                          key={idx} 
                          value={d.name} 
                          disabled={isBusy}
                          className={isBusy ? 'text-slate-300 italic' : ''}
                        >
                          {d.name} {isBusy ? '(En mission)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Charge (%)</label>
                  <input name="load" type="number" min="0" max="100" defaultValue={editingMission?.load} required placeholder="85" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Statut Mission</label>
                  <select 
                    name="status" 
                    defaultValue={editingMission?.status || ((role as any) === 'COMMERCIAL' ? "En Attente" : "Chargement")} 
                    required 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200"
                  >
                    {(role as any) === 'COMMERCIAL' && <option value="En Attente">En Attente</option>}
                    {(role === 'ADMIN' || role === 'SCHEDULER') && (
                      <>
                        <option value="En Attente">En Attente</option>
                        <option value="Chargement">Chargement</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Repos Chauffeur">Repos Chauffeur</option>
                      </>
                    )}
                    {role === 'WAREHOUSE' && (
                      <>
                        <option value="Chargement">Chargement</option>
                        <option value="En Transit">En Transit</option>
                      </>
                    )}
                    {role === 'DRIVER' && (
                      <>
                        <option value="En Transit">En Transit</option>
                        <option value="Déchargement">Déchargement</option>
                        <option value="Livré">Livré</option>
                        <option value="Retour à Vide">Retour à Vide</option>
                      </>
                    )}
                    {role === 'ADMIN' && (
                      <>
                        <option value="Livré">Livré</option>
                        <option value="Déchargement">Déchargement</option>
                        <option value="Retour à Vide">Retour à Vide</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Destination (GPS)</label>
                  <input 
                    name="destination" 
                    defaultValue={editingMission?.destination} 
                    required 
                    readOnly={role === 'WAREHOUSE'}
                    placeholder="Sétif / Alger..." 
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Origine</label>
                  <input 
                    name="origin" 
                    defaultValue={editingMission?.origin} 
                    required 
                    readOnly={role === 'WAREHOUSE'}
                    placeholder="Biskra..." 
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dist. (km)</label>
                  <input 
                    name="distance" 
                    type="number" 
                    defaultValue={editingMission?.distance} 
                    required 
                    readOnly={role === 'WAREHOUSE'}
                    placeholder="220" 
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Consommation (L/100km)</label>
                  <input 
                    name="fuel" 
                    type="number" 
                    step="0.1" 
                    defaultValue={editingMission?.fuel} 
                    required 
                    readOnly={role === 'WAREHOUSE'}
                    placeholder="28.5" 
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200 ${role === 'WAREHOUSE' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                  />
                </div>
              </div>
            </>
          )}

          {(role as any) === 'COMMERCIAL' && (
            <>
              <input type="hidden" name="entryCompany" defaultValue={editingMission?.entryCompany} />
              <input type="hidden" name="entryDock" defaultValue={editingMission?.entryDock} />
              <input type="hidden" name="exitDock" defaultValue={editingMission?.exitDock} />
              <input type="hidden" name="driver" defaultValue={editingMission?.driver} />
              <input type="hidden" name="load" defaultValue={editingMission?.load} />
              <input type="hidden" name="status" defaultValue={editingMission?.status || "Chargement"} />
              <input type="hidden" name="destination" defaultValue={editingMission?.destination} />
              <input type="hidden" name="origin" defaultValue={editingMission?.origin} />
              <input type="hidden" name="distance" defaultValue={editingMission?.distance} />
              <input type="hidden" name="fuel" defaultValue={editingMission?.fuel} />
            </>
          )}

          {/* Validation Metrics (Only for Admin/Warehouse when mission is advanced) */}
          {(role === 'ADMIN' || role === 'WAREHOUSE') && editingMission && (
            <div className="grid grid-cols-2 gap-3 bg-brand-green/5 p-3 rounded-xl border border-brand-green/20">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider">Kilométrage Réel (Validé)</label>
                <input 
                  type="number"
                  name="validatedKm" 
                  defaultValue={(editingMission as any).validatedKm || editingMission.distance} 
                  placeholder="KM réels..." 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-green uppercase tracking-wider">Tonnage Réel (Validé)</label>
                <input 
                  type="number"
                  name="validatedTonnage" 
                  defaultValue={(editingMission as any).validatedTonnage || editingMission.load} 
                  placeholder="Tonnage réel..." 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-brand-green dark:text-slate-200"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: '#10b981' }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full py-3 bg-brand-green text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-brand-green/20"
            >
              {editingMission ? 'ENREGISTRER LES MODIFICATIONS' : 'VALIDER LA MISSION'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
