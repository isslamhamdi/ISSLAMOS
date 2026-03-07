import React from 'react';
import { ShieldCheck, Database, Key, BarChart3, Activity, Trash2 } from 'lucide-react';
import { UserRow } from '../components/UserRow';
import { Role } from '../types';
import { drivers } from '../data/drivers';

interface SettingsViewProps {
  role: Role;
  handlePasswordChange: () => void;
  handleAuditLogs: () => void;
  onSeedData: () => Promise<void>;
  onResetData: () => Promise<void>;
  onForceAdd: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  role, 
  handlePasswordChange, 
  handleAuditLogs,
  onSeedData,
  onResetData,
  onForceAdd
}) => {
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [isForcing, setIsForcing] = React.useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    await onSeedData();
    setIsSeeding(false);
  };

  const handleReset = async () => {
    setIsResetting(true);
    await onResetData();
    setIsResetting(false);
  };

  const handleForce = async () => {
    setIsForcing(true);
    await onForceAdd();
    setIsForcing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-extrabold flex items-center gap-2 uppercase tracking-tight dark:text-slate-100">
              <ShieldCheck className="w-5 h-5 text-brand-green dark:text-emerald-400" />
              Gestion des Accès & Rôles
            </h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Utilisateurs Actifs</h3>
              <UserRow name="Administrateur Principal" role="ADMIN" lastLogin="Aujourd'hui, 08:45" status="online" />
              <UserRow name="Responsable Programmation" role="SCHEDULER" lastLogin="Aujourd'hui, 07:30" status="online" />
              <UserRow name={drivers[0]?.name || "Chauffeur"} role="DRIVER" lastLogin="Hier, 16:20" status="offline" />
              <UserRow name="Service Facturation" role="VIEWER" lastLogin="02 Mars 2026" status="offline" />
            </div>
          </div>
        </div>

        {role === 'ADMIN' && (
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold flex items-center gap-2 uppercase tracking-tight dark:text-slate-100">
                <Database className="w-5 h-5 text-accent dark:text-emerald-400" />
                Base de Données & Système
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={handlePasswordChange}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-accent dark:hover:border-emerald-500 transition-all group"
              >
                <Key className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-accent dark:group-hover:text-emerald-400 mb-3" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Changer Mot de Passe</span>
              </button>
              <button 
                onClick={handleAuditLogs}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-accent dark:hover:border-emerald-500 transition-all group"
              >
                <BarChart3 className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-accent dark:group-hover:text-emerald-400 mb-3" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Logs d'Audit</span>
              </button>
              <button 
                onClick={handleSeed}
                disabled={isSeeding || isResetting}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-brand-green dark:hover:border-emerald-500 transition-all group disabled:opacity-50"
              >
                <Database className={`w-8 h-8 ${isSeeding ? 'animate-spin' : ''} text-slate-400 dark:text-slate-500 group-hover:text-brand-green dark:group-hover:text-emerald-400 mb-3`} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isSeeding ? 'Génération...' : 'Générer Données Test (Aléatoire)'}
                </span>
              </button>

              <button 
                onClick={handleReset}
                disabled={isResetting || isSeeding}
                className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 hover:border-red-500 dark:hover:border-red-500 transition-all group disabled:opacity-50"
              >
                <Trash2 className={`w-8 h-8 ${isResetting ? 'animate-pulse' : ''} text-red-400 dark:text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400 mb-3`} />
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {isResetting ? 'Suppression...' : 'Réinitialiser Base de Données'}
                </span>
              </button>

              <button 
                onClick={handleForce}
                disabled={isForcing}
                className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:border-blue-500 dark:hover:border-blue-500 transition-all group disabled:opacity-50"
              >
                <Activity className={`w-8 h-8 ${isForcing ? 'animate-pulse' : ''} text-blue-400 dark:text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-3`} />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {isForcing ? 'Ajout...' : 'Forcer Ajout (Debug)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="bg-brand-green dark:bg-emerald-900 rounded-[28px] p-8 text-white shadow-xl shadow-brand-green/20 relative overflow-hidden transition-colors duration-500">
          <div className="relative z-10 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight">État du Serveur</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold tracking-widest">SMI CLOUD ACTIF</span>
            </div>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Toutes les données sont synchronisées avec le serveur central de Biskra. Sauvegarde automatique effectuée il y a 5 minutes.
            </p>
          </div>
          <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-500">
          <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100 tracking-tight">Support Technique</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">En cas de problème avec le système de pilotage, contactez l'unité IT.</p>
          <a 
            href="mailto:support@baraka-logistique.dz"
            className="block w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-all text-center"
          >
            Ouvrir un Ticket
          </a>
        </div>
      </div>
    </div>
  );
};
