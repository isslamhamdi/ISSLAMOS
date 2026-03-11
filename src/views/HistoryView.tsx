import React from 'react';
import { motion } from 'motion/react';
import { History, Download, Search, Clock, Filter, Truck, RotateCcw, RefreshCw } from 'lucide-react';
import { Status, Movement, Role, Notification } from '../types';
import { StatusPill } from '../components/StatusPill';
import { VehicleIcon } from '../components/VehicleIcon';
import { CustomDatePicker } from '../components/CustomDatePicker';

interface HistoryViewProps {
  movementsList: Movement[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  vehicleTypeFilter: string;
  setVehicleTypeFilter: (type: string) => void;
  onSeedData?: () => Promise<void>;
  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => Promise<void>;
  role?: Role;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  movementsList,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  vehicleTypeFilter,
  setVehicleTypeFilter,
  onSeedData,
  addNotification,
  role
}) => {
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeed = async () => {
    if (onSeedData) {
      setIsSeeding(true);
      await onSeedData();
      setIsSeeding(false);
    }
  };

  const filteredHistory = movementsList.filter(entry => {
    const matchesSearch = entry.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         entry.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
    
    // Date comparison
    let matchesDate = false;
    
    let date: Date | null = null;
    const createdAt = (entry as any).createdAt;
    
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
      const entryDate = `${year}-${month}-${day}`;

      if (startDate && endDate) {
        matchesDate = entryDate >= startDate && entryDate <= endDate;
      } else if (startDate) {
        matchesDate = entryDate === startDate;
      } else if (endDate) {
        matchesDate = entryDate === endDate;
      } else {
        matchesDate = false;
      }
    } else {
      matchesDate = false;
    }

    const matchesType = vehicleTypeFilter === 'All' || entry.type === vehicleTypeFilter;
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  });

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

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Vehicule', 'Type', 'Chauffeur', 'Client', 'Statut', 'Entree Quai', 'Sortie Quai', 'Eco-Score', 'BL', 'Facture'];
    const rows = filteredHistory.map(e => [
      e.id, 
      (e as any).createdAt?.toDate ? (e as any).createdAt.toDate().toLocaleDateString() : '', 
      e.vehicle, 
      e.type, 
      e.driver, 
      e.client, 
      e.status, 
      e.entryDock, 
      e.exitDock, 
      e.ecoScore, 
      e.blNumber || '',
      e.invoiceNumber || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_baraka_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-green p-6 rounded-[24px] border border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
            <History className="w-4 h-4 text-white" />
            HISTORIQUE DES MOUVEMENTS
          </h2>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-[11px] font-bold hover:bg-white/20 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            EXPORTER SMI
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-11 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 dark:text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 col-span-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <CustomDatePicker 
              selected={startDate ? new Date(startDate) : null}
              onChange={handleStartDateChange}
              placeholderText="jj/mm/aaaa"
              className="w-full"
            />
            <div className="w-1 h-1 rounded-full bg-white/30" />
            <CustomDatePicker 
              selected={endDate ? new Date(endDate) : null}
              onChange={handleEndDateChange}
              placeholderText="jj/mm/aaaa"
              className="w-full"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-green" />
            <select 
              className="w-full pl-11 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-brand-green/50 text-slate-800 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Tous les statuts</option>
              <option value="Livré">Livré</option>
              <option value="En Transit">En Transit</option>
              <option value="Déchargement">Déchargement</option>
              <option value="Retour à Vide">Retour à Vide</option>
              <option value="Chargement">Chargement</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="relative">
            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-green" />
            <select 
              className="w-full pl-11 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-brand-green/50 text-slate-800 appearance-none"
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
            >
              <option value="All">Tous les types</option>
              <option value="truck">Camion</option>
              <option value="bus">Bus</option>
              <option value="trailer">Remorque</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-[11px] font-bold hover:bg-white/20 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            RÉINITIALISER
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.location.reload()}
            className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            title="Actualiser la page"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Date / Heures</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Camion</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Chauffeur</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Client / Wilaya</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Eco-Score</th>
                <th className="px-8 py-5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((entry, idx) => (
                  <motion.tr 
                    key={entry.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <td className="px-8 py-6">
                      <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        {(entry as any).createdAt?.toDate ? (entry as any).createdAt.toDate().toLocaleDateString('fr-FR') : 'N/A'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{entry.entryDock} - {entry.exitDock}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <VehicleIcon type={entry.type} />
                        <span className="font-bold text-sm dark:text-slate-200">{entry.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-300 font-medium">{entry.driver}</td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-medium dark:text-slate-200">{entry.client}</p>
                      <p className="text-[10px] text-slate-400 italic mt-1">{entry.wilaya}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${entry.ecoScore > 90 ? 'bg-success' : entry.ecoScore > 80 ? 'bg-warning' : 'bg-danger'}`} />
                        <span className="text-xs font-mono font-bold dark:text-slate-300">{entry.ecoScore}/100</span>
                      </div>
                    </td>
                    <td className="px-8 py-6"><StatusPill status={entry.status} /></td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <History className="w-6 h-6 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {movementsList.length === 0 ? "Aucune donnée disponible" : "Aucun résultat pour ces filtres"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {movementsList.length === 0 
                            ? "La base de données est vide. Veuillez ajouter une mission ou attendre l'initialisation." 
                            : `Nous avons ${movementsList.length} missions au total, mais aucune ne correspond à la date ou aux critères sélectionnés.`}
                        </p>
                        
                        <div className="flex flex-col gap-2 mt-4 items-center">
                          {movementsList.length > 0 && (
                            <button 
                              onClick={resetFilters}
                              className="text-xs font-bold text-brand-green hover:underline"
                            >
                              Afficher tout l'historique ({movementsList.length} missions)
                            </button>
                          )}
                          
                          {onSeedData && (role === 'ADMIN' || role === 'SCHEDULER') && (
                            <button 
                              onClick={handleSeed}
                              disabled={isSeeding}
                              className="px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-green/20 transition-colors disabled:opacity-50"
                            >
                              {isSeeding ? 'Génération...' : 'Générer Données Test (Aléatoire)'}
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
    </div>
  );
};
