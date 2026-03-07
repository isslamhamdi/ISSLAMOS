import React from 'react';
import { motion } from 'motion/react';
import { Activity, FileText, ChevronDown, Table, FileSpreadsheet, File, MapPin, X, Search, Filter, Truck, RotateCcw, Clock } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { KPICard } from '../components/KPICard';
import { VehicleIcon } from '../components/VehicleIcon';
import { StatusPill } from '../components/StatusPill';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { Movement, Role } from '../types';

interface DashboardViewProps {
  movementsList: Movement[];
  role: Role;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  vehicleTypeFilter: string;
  setVehicleTypeFilter: (type: string) => void;
  exportToPDF: () => void;
  exportToExcel: () => void;
  exportToCSV: () => void;
  exportToWord: () => void;
  showExportMenu: boolean;
  setShowExportMenu: (show: boolean) => void;
  handleNewMissionClick: () => void;
  handleEditMission: (mission: Movement) => void;
  onSeedData?: () => Promise<void>;
  searchRef?: React.RefObject<HTMLInputElement>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  movementsList,
  role,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  vehicleTypeFilter,
  setVehicleTypeFilter,
  exportToPDF,
  exportToExcel,
  exportToCSV,
  exportToWord,
  showExportMenu,
  setShowExportMenu,
  handleNewMissionClick,
  handleEditMission,
  onSeedData,
  searchRef
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeed = async () => {
    if (onSeedData) {
      setIsSeeding(true);
      await onSeedData();
      setIsSeeding(false);
    }
  };

  const handleDeleteMission = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'movements', id));
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting mission:", error);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setVehicleTypeFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date ? date.toISOString().split('T')[0] : '');
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date ? date.toISOString().split('T')[0] : '');
  };

  // Filter movements by the selected date range and other filters
  const filteredMovements = movementsList.filter(m => {
    // Date Filter
    let matchesDate = false;
    if (startDate || endDate) {
      // Robust date extraction
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
        // Normalize dates to YYYY-MM-DD for comparison
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
          matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    } else {
      matchesDate = false;
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

  // Calculate KPIs based on filtered data
  const totalMissions = filteredMovements.length;
  const deliveredMissions = filteredMovements.filter(m => m.status === 'Livré').length;
  const maintenanceMissions = filteredMovements.filter(m => m.status === 'Maintenance').length;
  
  const availabilityRate = totalMissions > 0 
    ? ((totalMissions - maintenanceMissions) / totalMissions * 100).toFixed(1) + '%' 
    : '100%';
    
  const operationalPerformance = totalMissions > 0
    ? (deliveredMissions / totalMissions * 100).toFixed(1) + '%'
    : '100%';

  return (
    <>
      {/* Confirmation Modal for Deletion */}
      {deletingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                ANNULER
              </button>
              <button 
                onClick={() => handleDeleteMission(deletingId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                SUPPRIMER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Taux Disponibilité" 
          value={availabilityRate} 
          chartData={[
            { name: 'Lun', value: 85 },
            { name: 'Mar', value: 88 },
            { name: 'Mer', value: 92 },
            { name: 'Jeu', value: 90 },
            { name: 'Ven', value: 94 },
            { name: 'Sam', value: 92 },
            { name: 'Dim', value: 95 },
          ]}
        />
        <KPICard 
          label="Consommation Moyenne" 
          value="30.2" 
          subtext="L/100km (Flotte Totale)" 
          chartData={[
            { name: '1', value: 32 },
            { name: '2', value: 31 },
            { name: '3', value: 30 },
            { name: '4', value: 30.5 },
            { name: '5', value: 30.2 },
          ]}
        />
        <KPICard 
          label="Performance Opérationnelle" 
          value={operationalPerformance} 
          subtext="Objectif mensuel atteint." 
        />
        <KPICard 
          label="Alertes Maintenance" 
          value={maintenanceMissions.toString().padStart(2, '0')} 
          subtext={maintenanceMissions > 0 ? `${maintenanceMissions} Unité(s) en attente.` : "Aucune unité en attente."} 
        />
      </div>

      {/* Main Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-500">
        <div className="px-8 py-6 bg-brand-green border-b border-brand-green/20">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-base font-extrabold flex items-center gap-2 text-white whitespace-nowrap">
                <Activity className="w-5 h-5 text-white" />
                PROGRAMME DES MOUVEMENTS
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative">
                <div className="flex items-center gap-0 bg-white/10 border border-white/20 rounded-xl p-1 shadow-sm">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/20 rounded-l-lg text-white transition-colors text-[11px] font-bold"
                  >
                    <FileText className="w-4 h-4" />
                    EXPORTER SMI
                  </motion.button>
                  <div className="w-px h-4 bg-white/20"></div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 hover:bg-white/20 rounded-r-lg text-white/70 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                </div>

                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                    <div className="p-1">
                      <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <FileText className="w-4 h-4 text-red-500" />
                        Format PDF (SMI)
                      </button>
                      <button onClick={() => { exportToExcel(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Table className="w-4 h-4 text-green-600" />
                        Format Excel
                      </button>
                      <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                        Format CSV
                      </button>
                      <button onClick={() => { exportToWord(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <File className="w-4 h-4 text-blue-700" />
                        Format Word
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {(role === 'ADMIN' || role === 'SCHEDULER' || role === 'COMMERCIAL') && (
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: '#f8fafc' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewMissionClick}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-brand-green rounded-xl text-[11px] font-bold transition-colors shadow-sm ml-auto xl:ml-0"
                >
                  <Activity className="w-4 h-4" />
                  NOUVELLE MISSION
                </motion.button>
              )}
            </div>
          </div>

            {/* Filters Row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  ref={searchRef}
                  type="text" 
                  placeholder="Rechercher..."
                  className="w-full pl-11 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 dark:text-slate-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

            <div className="flex items-center gap-2">
              <CustomDatePicker 
                selected={startDate ? new Date(startDate) : null}
                onChange={handleStartDateChange}
                placeholderText="jj/mm/aaaa"
              />
              <span className="text-white font-bold px-1">-</span>
              <CustomDatePicker 
                selected={endDate ? new Date(endDate) : null}
                onChange={handleEndDateChange}
                placeholderText="jj/mm/aaaa"
              />
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Filter className="w-4 h-4 text-white" />
              <select 
                className="w-full bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs px-4 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 dark:text-slate-800"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">Tous les statuts</option>
                <option value="Livré">Livré</option>
                <option value="En Transit">En Transit</option>
                <option value="Chargement">Chargement</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Truck className="w-4 h-4 text-white" />
              <select 
                className="w-full bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs px-4 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 dark:text-slate-800"
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
              >
                <option value="All">Tous les types</option>
                <option value="truck">Camion</option>
                <option value="bus">Bus</option>
                <option value="trailer">Remorque</option>
              </select>
            </div>

            <button 
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-2xl text-[11px] font-bold hover:bg-white/20 transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RÉINITIALISER
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Camion</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Client / Wilaya</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Chauffeur</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Statut</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Charge</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Horaires (E/Q/S)</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Destination</th>
                {(role === 'ADMIN' || role === 'SCHEDULER' || role === 'COMMERCIAL' || role === 'WAREHOUSE') && <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length > 0 ? (
                filteredMovements.map((m, idx) => (
                  <motion.tr 
                    key={m.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                          <VehicleIcon type={m.type} />
                        </div>
                        <div>
                          <p className="font-bold text-sm dark:text-slate-200">{m.vehicle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-sm dark:text-slate-200">{m.client}</p>
                        <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider">{m.wilaya}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <motion.div 
                        whileHover={{ x: 2 }}
                        className="font-bold text-sm text-primary dark:text-slate-300 hover:text-accent dark:hover:text-emerald-400 cursor-pointer transition-all duration-200 flex items-center gap-2 group/driver"
                      >
                        {m.driver}
                        <div className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover/driver:opacity-100 transition-opacity" />
                      </motion.div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusPill status={m.status} />
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-mono font-bold uppercase text-slate-500">
                            Charge
                          </p>
                          <p className="text-[10px] font-mono font-bold text-accent dark:text-emerald-400">
                            {m.load}%
                          </p>
                        </div>
                        <div className="w-32 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative border border-slate-200/50 dark:border-slate-700/50">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${m.load}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-accent dark:bg-emerald-500 rounded-full relative shadow-[0_0_10px_rgba(243,156,18,0.3)]"
                          >
                            <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent" />
                          </motion.div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1 text-[10px] font-mono font-bold">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="w-8">ENT:</span>
                          <span className="text-slate-600 dark:text-slate-400">{m.entryCompany}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="w-8">QUAI:</span>
                          <span className="text-slate-600 dark:text-slate-400">{m.entryDock}</span>
                        </div>
                        <div className="flex items-center gap-2 text-accent dark:text-emerald-400">
                          <span className="w-8">SORT:</span>
                          <span className="animate-pulse">{m.exitDock}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-primary dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-accent dark:text-emerald-400" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-mono leading-none mb-1">De: {m.origin}</span>
                          <span>{m.destination}</span>
                        </div>
                      </div>
                    </td>
                    {(role === 'ADMIN' || role === 'SCHEDULER' || role === 'COMMERCIAL' || role === 'WAREHOUSE') && (
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button 
                            whileHover={{ scale: 1.2, color: '#10b981' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditMission(m)}
                            className="p-2 text-slate-300 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <FileText className="w-4 h-4" />
                          </motion.button>
                          {(role === 'ADMIN' || role === 'SCHEDULER') && (
                            <motion.button 
                              whileHover={{ scale: 1.2, color: '#ef4444' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setDeletingId(m.id)}
                              className="p-2 text-slate-300 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        {new Date(startDate) > new Date() ? (
                          <Clock className="w-6 h-6 text-slate-300" />
                        ) : (
                          <Table className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {new Date(startDate) > new Date() 
                            ? "Programme à venir" 
                            : "Aucun mouvement trouvé"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(startDate) > new Date()
                            ? `Le planning pour la période du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')} n'a pas encore été établi.`
                            : (startDate || endDate) 
                              ? `Il n'y a pas de données enregistrées pour la période du ${startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '...'} au ${endDate ? new Date(endDate).toLocaleDateString('fr-FR') : '...'}.`
                              : "Aucune donnée n'est disponible pour les filtres sélectionnés."}
                        </p>
                        
                        <div className="mt-4 flex flex-col gap-2 items-center">
                          {movementsList.length > 0 && (
                            <button 
                              onClick={resetFilters}
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-wider"
                            >
                              Afficher toutes les missions
                            </button>
                          )}
                          
                          {onSeedData && (role === 'ADMIN' || role === 'SCHEDULER') && (
                            <button 
                              onClick={handleSeed}
                              disabled={isSeeding}
                              className="px-3 py-1.5 text-brand-green text-[10px] font-bold uppercase tracking-wider hover:underline disabled:opacity-50"
                            >
                              {isSeeding ? 'Génération...' : 'Générer des données de test'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
