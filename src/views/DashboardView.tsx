import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, FileText, ChevronDown, Table, FileSpreadsheet, File, MapPin, X, Search, Filter, Truck, RotateCcw, Clock, Droplets, Sparkles, Info, PhoneCall, Wrench, CheckCircle2, AlertTriangle, Wind } from 'lucide-react';
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
  const [showOilModal, setShowOilModal] = React.useState(false);
  const [showHygieneModal, setShowHygieneModal] = React.useState(false);

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
        // If no date filter is applied, default to TODAY
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        matchesDate = missionDate === todayStr;
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

  // Calculate aggregated stats per vehicle based on filtered movements (period)
  const vehicleStats = React.useMemo(() => {
    const stats: Record<string, any> = {};
    
    // Process filtered movements to get history for the selected period
    filteredMovements.forEach(m => {
      if (!stats[m.vehicle]) {
        stats[m.vehicle] = {
          id: m.vehicle,
          vehicle: m.vehicle,
          driver: m.driver,
          totalDistance: 0,
          missionCount: 0,
          currentKm: m.currentKm || 0,
          nextOilChangeKm: m.nextOilChangeKm || 0,
          oilLife: m.oilLife || 0,
          cleanliness: m.cleanliness || 'PROPRE',
        };
      }
      
      // Add distance
      stats[m.vehicle].totalDistance += (m.distance || 0);
      stats[m.vehicle].missionCount += 1;
      
      // Update with most recent data if this movement is newer
      // We assume higher currentKm means more recent
      if (m.currentKm && m.currentKm > stats[m.vehicle].currentKm) {
        stats[m.vehicle].currentKm = m.currentKm;
        stats[m.vehicle].nextOilChangeKm = m.nextOilChangeKm || stats[m.vehicle].nextOilChangeKm;
        stats[m.vehicle].oilLife = m.oilLife || stats[m.vehicle].oilLife;
        stats[m.vehicle].driver = m.driver;
        stats[m.vehicle].cleanliness = m.cleanliness || stats[m.vehicle].cleanliness;
      }
    });

    // Calculate dynamic hygiene based on period distance
    Object.values(stats).forEach(v => {
      if (v.totalDistance > 1000) {
        v.cleanliness = 'À LAVER';
      }
    });

    return Object.values(stats).sort((a, b) => b.totalDistance - a.totalDistance);
  }, [filteredMovements]);

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

  // Calculate dynamic stats for the buttons
  const avgOilLife = vehicleStats.length > 0 
    ? Math.round(vehicleStats.reduce((acc, v) => acc + (v.oilLife || 0), 0) / vehicleStats.length)
    : 0;
  const cleanVehiclesCount = vehicleStats.filter(v => v.cleanliness === 'PROPRE').length;
  const cleanPercentage = vehicleStats.length > 0 
    ? Math.round((cleanVehiclesCount / vehicleStats.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
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
              <div className="flex items-center gap-2 mr-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOilModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all text-[11px] font-bold border border-white/20 shadow-sm hover:shadow-md"
                >
                  <Droplets className="w-5 h-5 text-emerald-300" />
                  Vidanges
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHygieneModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all text-[11px] font-bold border border-white/20 shadow-sm hover:shadow-md"
                >
                  <Sparkles className="w-5 h-5 text-blue-300" />
                  Hygiène
                </motion.button>
              </div>

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

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              <CustomDatePicker 
                selected={startDate ? new Date(startDate) : null}
                onChange={handleStartDateChange}
                placeholderText="jj/mm/aaaa"
                className="w-32"
              />
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <CustomDatePicker 
                selected={endDate ? new Date(endDate) : null}
                onChange={handleEndDateChange}
                placeholderText="jj/mm/aaaa"
                className="w-32"
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
                      <div className="flex flex-col">
                        <motion.div 
                          whileHover={{ x: 2 }}
                          className="font-bold text-sm text-primary dark:text-slate-300 hover:text-accent dark:hover:text-emerald-400 cursor-pointer transition-all duration-200 flex items-center gap-2 group/driver"
                        >
                          {m.driver}
                          <div className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover/driver:opacity-100 transition-opacity" />
                        </motion.div>
                        {m.driverPhone && (
                          <a href={`tel:${m.driverPhone}`} className="text-[10px] font-bold text-brand-green hover:underline flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {m.driverPhone}
                          </a>
                        )}
                      </div>
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

      {/* Oil Change Drawer */}
      <AnimatePresence>
        {showOilModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowOilModal(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="relative p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 overflow-hidden shrink-0">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />
                
                <div className="relative flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                      <Droplets className="w-6 h-6 text-emerald-100" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Vidange</h3>
                      <p className="text-[10px] text-emerald-100/80 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3" />
                        État technique (Période)
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowOilModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                {vehicleStats.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Aucun véhicule actif dans cette période.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {vehicleStats.map((v, idx) => (
                      <motion.div 
                        key={v.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-3 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${v.oilLife && v.oilLife < 20 ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-500 border border-red-200' : 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 border border-emerald-200'}`}>
                                <Truck className="w-5 h-5" />
                              </div>
                              {v.oilLife && v.oilLife < 20 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">{v.vehicle}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{v.driver}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Km Parcourus</span>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">+{v.totalDistance.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-left">
                              <span className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Km Actuel</span>
                              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{v.currentKm?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Dernière Vidange</span>
                              {/* Simulated last oil change date based on current km and distance traveled */}
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {new Date(Date.now() - (v.totalDistance * 1000 * 60 * 60 * 24 / 500)).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Prochaine Vidange</span>
                              {(() => {
                                const remaining = (v.nextOilChangeKm || 0) - (v.currentKm || 0);
                                const isOverdue = remaining <= 0;
                                return (
                                  <span className={`text-xs font-mono font-bold ${isOverdue || (v.oilLife && v.oilLife < 20) ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {isOverdue 
                                      ? `Dépassement de ${Math.abs(remaining).toLocaleString()} KM` 
                                      : `- ${remaining.toLocaleString()} KM`}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden shadow-inner relative mb-3">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${v.oilLife || 0}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full relative ${v.oilLife && v.oilLife < 20 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]" />
                            </motion.div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Statut Actuel:</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                v.status === 'En Transit' ? 'bg-emerald-50 text-emerald-600' :
                                v.status === 'Livré' ? 'bg-blue-50 text-blue-600' :
                                v.status === 'Chargement' ? 'bg-amber-50 text-amber-600' :
                                v.status === 'Déchargement' ? 'bg-orange-50 text-orange-600' :
                                v.status === 'Retour à Vide' ? 'bg-purple-50 text-purple-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {v.status || 'En Attente'}
                              </span>
                            </div>
                            <button className="text-[9px] font-black uppercase px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200">
                              Planifier Vidange
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">Règles de Vidange</h4>
                  </div>
                  <ul className="space-y-2 text-[10px] text-amber-700/90 dark:text-amber-300/90 font-medium">
                    <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Intervalle standard : Tous les 10,000 KM.</li>
                    <li className="flex items-center gap-2"><Droplets className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Huile certifiée SMI (Par rapport au constructeur de votre véhicule).</li>
                    <li className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Remplacement des filtres obligatoire.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hygiene Drawer */}
      <AnimatePresence>
        {showHygieneModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowHygieneModal(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="relative p-6 bg-gradient-to-br from-blue-600 to-indigo-800 overflow-hidden shrink-0">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 h-48 bg-blue-400/30 rounded-full blur-3xl animate-[pulse_4s_infinite]" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
                
                <div className="relative flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                      <Sparkles className="w-6 h-6 text-blue-100" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Hygiène & Lavage</h3>
                      <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <Wind className="w-3 h-3" />
                        Propreté de la flotte
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowHygieneModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                {vehicleStats.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Aucun véhicule actif dans cette période.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {vehicleStats.map((v, idx) => (
                      <motion.div 
                        key={v.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${v.cleanliness === 'PROPRE' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500 border border-blue-200' : 'bg-gradient-to-br from-red-100 to-red-50 text-red-500 border border-red-200'}`}>
                              {v.cleanliness === 'PROPRE' ? <Sparkles className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">{v.vehicle}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{v.driver}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase flex items-center gap-1.5 shadow-sm ${
                              v.cleanliness === 'PROPRE' 
                                ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            }`}>
                              {v.cleanliness === 'PROPRE' && <CheckCircle2 className="w-3 h-3" />}
                              {v.cleanliness || 'N/A'}
                            </span>
                            <div className="text-right flex flex-col items-end">
                              <span className="block text-[9px] font-black text-slate-400 uppercase mb-0.5">Km Parcourus</span>
                              <span className={`text-xs font-mono font-bold ${v.totalDistance > 1000 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                +{v.totalDistance.toLocaleString()} KM
                              </span>
                              {v.totalDistance > 1000 && (
                                <span className="text-[8px] font-black text-red-500 uppercase mt-0.5 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded animate-pulse">
                                  Dépassement (&gt;1000 KM)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Dernier Lavage</span>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {new Date(Date.now() - (v.totalDistance * 1000 * 60 * 60 * 24 / 800)).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                            <div>
                              <span className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Statut Actuel</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                v.status === 'En Transit' ? 'bg-emerald-50 text-emerald-600' :
                                v.status === 'Livré' ? 'bg-blue-50 text-blue-600' :
                                v.status === 'Chargement' ? 'bg-amber-50 text-amber-600' :
                                v.status === 'Déchargement' ? 'bg-orange-50 text-orange-600' :
                                v.status === 'Retour à Vide' ? 'bg-purple-50 text-purple-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {v.status || 'En Attente'}
                              </span>
                            </div>
                          </div>
                          <button className="text-[9px] font-black uppercase px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors border border-slate-200 hover:border-blue-200">
                            Planifier Lavage
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-tight">Logique de Contrôle</h4>
                  </div>
                  <ul className="space-y-2 text-[10px] text-blue-700/90 dark:text-blue-300/90 font-medium leading-relaxed">
                    <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" /> Le statut d'hygiène est réévalué dynamiquement.</li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" /> Un lavage complet est recommandé après 1000 KM parcourus dans la période sélectionnée pour maintenir l'image de marque SMI.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
