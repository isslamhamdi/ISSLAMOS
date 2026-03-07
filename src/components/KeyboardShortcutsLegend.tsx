import React from 'react';
import { Command, Search, Plus, RotateCcw, LayoutDashboard, History, Map as MapIcon, Users, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const KeyboardShortcutsLegend = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-3 bg-brand-green text-white rounded-full shadow-lg hover:bg-brand-green/90 transition-all"
        title="Raccourcis clavier"
      >
        <Command className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-0 bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-700 w-72"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Command className="w-5 h-5 text-brand-green" />
              Raccourcis Clavier
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">N</span>
                  </div>
                  <span>Nouvelle Mission</span>
                </div>
                <Plus className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">S</span>
                  </div>
                  <span>Rechercher</span>
                </div>
                <Search className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">R</span>
                  </div>
                  <span>Réinitialiser</span>
                </div>
                <RotateCcw className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">D</span>
                  </div>
                  <span>Dashboard</span>
                </div>
                <LayoutDashboard className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">H</span>
                  </div>
                  <span>Historique</span>
                </div>
                <History className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">M</span>
                  </div>
                  <span>Carte</span>
                </div>
                <MapIcon className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">C</span>
                  </div>
                  <span>Chauffeurs</span>
                </div>
                <Users className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt</span>
                    <span className="text-slate-400">+</span>
                    <span className="px-1.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">P</span>
                  </div>
                  <span>Paramètres</span>
                </div>
                <Settings className="w-4 h-4 text-brand-green" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
