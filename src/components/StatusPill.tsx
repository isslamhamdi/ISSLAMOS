import React from 'react';
import { motion } from 'motion/react';
import { Status } from '../types';

export const StatusPill = ({ status }: { status: Status }) => {
  const styles: Record<Status, string> = {
    'Maintenance': 'bg-red-50 dark:bg-red-500/10 text-danger',
    'En Transit': 'bg-emerald-50 dark:bg-emerald-500/10 text-success',
    'Chargement': 'bg-amber-50 dark:bg-amber-500/10 text-warning',
    'Livré': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'En Attente': 'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400',
    'Retour à Vide': 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'Repos Chauffeur': 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
  };

  const pulseColors: Record<Status, string> = {
    'Maintenance': 'bg-danger',
    'En Transit': 'bg-success',
    'Chargement': 'bg-warning',
    'Livré': 'bg-blue-500',
    'En Attente': 'bg-slate-400',
    'Retour à Vide': 'bg-purple-500',
    'Repos Chauffeur': 'bg-indigo-500'
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-bold ${styles[status]}`}
    >
      <div className={`relative w-2 h-2 rounded-full ${pulseColors[status]} animate-pulse-subtle shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
      {status}
    </motion.div>
  );
};
