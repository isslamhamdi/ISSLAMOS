import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Truck, FileText, Calendar, AlertCircle, CheckCircle, Edit2, HeartPulse } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { Movement, Driver } from '../types';

interface DriverDetailModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  movements: Movement[];
  onUpdateDriver: (updatedDriver: Driver) => void;
}

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({ driver, isOpen, onClose, movements, onUpdateDriver }) => {
  const [range, setRange] = useState<DateRange | undefined>({
    from: driver?.illnessStartDate ? new Date(driver.illnessStartDate) : undefined,
    to: driver?.illnessEndDate ? new Date(driver.illnessEndDate) : undefined,
  });

  if (!isOpen || !driver) return null;

  const driverMovements = movements
    .filter(m => m.driver === driver.name)
    .sort((a, b) => (new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()))
    .slice(0, 5);

  const yearsOfService = new Date().getFullYear() - new Date(driver.joinDate).getFullYear();
  const loyaltyCardStatus = yearsOfService >= 5 ? 'OR' : yearsOfService >= 3 ? 'ARGENT' : 'BRONZE';

  const handleApplyIllness = () => {
    onUpdateDriver({ 
      ...driver, 
      illnessStartDate: range?.from ? format(range.from, 'yyyy-MM-dd') : '', 
      illnessEndDate: range?.to ? format(range.to, 'yyyy-MM-dd') : '' 
    });
  };

  const daysCount = range?.from && range?.to ? differenceInDays(range.to, range.from) + 1 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                <User className="w-6 h-6" />
              </div>
              {driver.name}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Véhicule Assigné</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="w-4 h-4 text-brand-green" />
                  {driver.brand} - {driver.registration}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Carte Fidélité</p>
                <div className="text-sm font-semibold text-brand-green">
                  {loyaltyCardStatus} ({yearsOfService} ans)
                </div>
              </div>
            </div>

            {/* Documents & Illness */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents & Conformité
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-sm font-medium">Permis de conduire ({driver.licenseType})</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Valide</span>
                  </div>
                </div>
              </div>

              {/* Illness Management */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" />
                  Gestion Maladie
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-4">
                  <div className="flex justify-center">
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      numberOfMonths={2}
                      locale={fr}
                      className="border-none"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-600">Durée de l'arrêt :</span>
                    <span className="text-lg font-black text-brand-green">{daysCount} jours</span>
                  </div>
                  <button onClick={handleApplyIllness} className="w-full py-3 bg-brand-green text-white rounded-xl text-sm font-bold hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20">
                    Enregistrer l'arrêt
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Missions */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Historique Récent
              </h3>
              <div className="space-y-2">
                {driverMovements.length > 0 ? driverMovements.map((m) => {
                  const date = (m.createdAt as any)?.toDate ? (m.createdAt as any).toDate() : new Date(m.createdAt);
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                      <span className="font-medium">{date.toLocaleDateString()} - {m.destination}</span>
                      <span className="font-bold text-brand-green">{m.status}</span>
                    </div>
                  );
                }) : <p className="text-sm text-slate-400">Aucune mission récente.</p>}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
