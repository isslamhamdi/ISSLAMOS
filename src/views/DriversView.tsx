import React from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { DriverCard } from '../components/DriverCard';
import { Role } from '../types';
import { drivers } from '../data/drivers';

interface DriversViewProps {
  role: Role;
  handleNewMissionClick: () => void;
}

export const DriversView: React.FC<DriversViewProps> = ({ role, handleNewMissionClick }) => {
  const displayDrivers = drivers.filter(d => d.name !== "Sans chauffeur");
  const totalDrivers = displayDrivers.length;
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="Total Conducteurs" value={totalDrivers.toString()} subtext="Effectif opérationnel." />
        <KPICard label="En Mission" value={Math.floor(totalDrivers / 3).toString()} subtext="Sur les routes." />
        <KPICard label="En Repos" value={(totalDrivers - Math.floor(totalDrivers / 3)).toString()} subtext="Disponibles demain." />
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-extrabold flex items-center gap-2 uppercase tracking-tight dark:text-slate-100">
            <Users className="w-5 h-5 text-brand-green dark:text-emerald-400" />
            Liste des Conducteurs
          </h2>
          {(role === 'ADMIN') && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewMissionClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-xl text-[11px] font-bold hover:bg-brand-green/90 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              AJOUTER CONDUCTEUR
            </motion.button>
          )}
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayDrivers.map((d, i) => (
            <DriverCard 
              key={d.code} 
              name={d.name} 
              status={i % 3 === 0 ? "Mission" : i % 3 === 1 ? "Actif" : "Repos"} 
              unit={d.code} 
              license="C1, E" 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
