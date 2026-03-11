import React from 'react';
import { Users, FileText, Phone } from 'lucide-react';
import { motion } from 'motion/react';

export const DriverCard = ({ name, status, unit, license, phone, loyalty }: { name: string, status: 'Actif' | 'Repos' | 'Mission' | 'Malade', unit: string, license: string, phone?: string, loyalty?: 'OR' | 'ARGENT' | 'BRONZE' }) => (
  <motion.div 
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-brand-green dark:hover:border-emerald-500 transition-all group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="relative w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-green/10 dark:group-hover:bg-emerald-500/10 group-hover:text-brand-green dark:group-hover:text-emerald-400 transition-colors">
        <Users className="w-6 h-6" />
        {loyalty && (
          <div className="absolute -top-2 -right-2 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill={loyalty === 'OR' ? '#fbbf24' : loyalty === 'ARGENT' ? '#94a3b8' : '#b45309'}>
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
            </svg>
          </div>
        )}
      </div>
      <div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{name}</h4>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Permis: {license}</p>
          {phone && phone !== '-' && (
            <a 
              href={`tel:${phone}`} 
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-brand-green font-black flex items-center gap-1 hover:underline"
            >
              <Phone className="w-3 h-3" />
              {phone}
            </a>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
        status === 'Actif' ? 'bg-emerald-50 text-success' : 
        status === 'Repos' ? 'bg-slate-50 text-slate-400' : 
        status === 'Malade' ? 'bg-rose-50 text-rose-600' :
        'bg-amber-50 text-warning'
      }`}>
        {status}
      </div>
      <div className="flex items-center gap-1">
        {phone && phone !== '-' && (
          <motion.a 
            href={`tel:${phone}`}
            whileHover={{ scale: 1.2, color: '#10b981' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-slate-300 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </motion.a>
        )}
        <motion.button 
          whileHover={{ scale: 1.2, color: '#10b981' }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-slate-300 transition-colors"
        >
          <FileText className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);
