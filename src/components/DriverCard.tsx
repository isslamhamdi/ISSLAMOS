import React from 'react';
import { Users, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export const DriverCard = ({ name, status, unit, license }: { name: string, status: 'Actif' | 'Repos' | 'Mission', unit: string, license: string }) => (
  <motion.div 
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-brand-green dark:hover:border-emerald-500 transition-all group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-green/10 dark:group-hover:bg-emerald-500/10 group-hover:text-brand-green dark:group-hover:text-emerald-400 transition-colors">
        <Users className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{name}</h4>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Permis: {license}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
        status === 'Actif' ? 'bg-emerald-50 text-success' : 
        status === 'Repos' ? 'bg-slate-50 text-slate-400' : 
        'bg-amber-50 text-warning'
      }`}>
        {status}
      </div>
      <motion.button 
        whileHover={{ scale: 1.2, color: '#10b981' }}
        whileTap={{ scale: 0.9 }}
        className="p-2 text-slate-300 transition-colors"
      >
        <FileText className="w-4 h-4" />
      </motion.button>
    </div>
  </motion.div>
);
