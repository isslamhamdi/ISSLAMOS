import React from 'react';
import { Movement } from '../types';

export const OilChangeView: React.FC<{ movementsList: Movement[] }> = ({ movementsList }) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6">Suivi des Vidanges</h2>
      <p className="text-slate-500">Gestion de l'entretien et de l'huile des camions.</p>
      {/* Add logic to display oil change status here */}
    </div>
  );
};
