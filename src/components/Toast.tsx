import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Notification } from '../types';

export const Toast: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, x: 50, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 50, scale: 0.9 }}
    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex gap-4 items-start w-80 pointer-events-auto"
  >
    <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
      notification.type === 'mission' ? 'bg-brand-green' : 
      notification.type === 'maintenance' ? 'bg-brand-red' : 'bg-blue-500'
    }`} />
    <div className="flex-1">
      <p className="text-xs font-black uppercase tracking-tight dark:text-slate-100">{notification.title}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notification.message}</p>
    </div>
    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);
