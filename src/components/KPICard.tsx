import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const KPICard = ({ label, value, subtext, chartData }: { label: string, value: string, subtext?: string, chartData?: any[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, translateY: -5 }}
    className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-transparent hover:border-accent dark:hover:border-emerald-500 transition-all duration-300 flex flex-col h-full"
  >
    <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`block text-3xl font-mono font-bold tracking-tighter my-2 ${label.includes('Alertes') ? 'text-danger' : 'text-primary dark:text-slate-100'}`}>
      {value}
    </span>
    {subtext && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{subtext}</p>}
    {chartData && (
      <div className="h-16 mt-auto pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f39c12" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f39c12" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#f39c12" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </motion.div>
);
