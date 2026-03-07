import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const UserRow = ({ name, role, lastLogin, status }: { name: string, role: string, lastLogin: string, status: 'online' | 'offline' }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-8 h-8 bg-brand-green/10 rounded-lg flex items-center justify-center text-brand-green">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{name}</p>
        <p className="text-[9px] text-slate-400 font-medium">{role}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Dernier accès</p>
      <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">{lastLogin}</p>
    </div>
  </div>
);
