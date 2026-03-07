import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, X } from 'lucide-react';

const GAS_PRICE = 31.00;
const FRAIS = 1500;

const destinations = [
    {id:"01", name:"Adrar", dist:1200, conso:29.5}, {id:"02", name:"Chlef", dist:580, conso:33.0},
    {id:"03", name:"Laghouat", dist:350, conso:31.0}, {id:"04", name:"Oum El Bouaghi", dist:160, conso:32.5},
    {id:"05", name:"Batna", dist:115, conso:34.0}, {id:"06", name:"Béjaïa", dist:280, conso:35.5},
    {id:"07", name:"Biskra", dist:0, conso:0}, {id:"08", name:"Béchar", dist:950, conso:30.0},
    {id:"09", name:"Blida", dist:420, conso:33.5}, {id:"10", name:"Bouira", dist:310, conso:34.0},
    {id:"11", name:"Tamanrasset", dist:1700, conso:30.5}, {id:"12", name:"Tébessa", dist:300, conso:33.0},
    {id:"13", name:"Tlemcen", dist:850, conso:32.5}, {id:"14", name:"Tiaret", dist:500, conso:33.5},
    {id:"15", name:"Tizi Ouzou", dist:360, conso:35.0}, {id:"16", name:"Alger", dist:400, conso:34.5},
    {id:"17", name:"Djelfa", dist:280, conso:31.5}, {id:"18", name:"Jijel", dist:250, conso:36.0},
    {id:"19", name:"Sétif", dist:220, conso:32.0}, {id:"20", name:"Saïda", dist:650, conso:32.0},
    {id:"21", name:"Skikda", dist:330, conso:34.5}, {id:"22", name:"Sidi Bel Abbès", dist:780, conso:32.5},
    {id:"23", name:"Annaba", dist:420, conso:33.0}, {id:"24", name:"Guelma", dist:340, conso:33.5},
    {id:"25", name:"Constantine", dist:230, conso:34.0}, {id:"26", name:"Médéa", dist:380, conso:35.0},
    {id:"27", name:"Mostaganem", dist:730, conso:32.0}, {id:"28", name:"M'Sila", dist:180, conso:31.5},
    {id:"29", name:"Mascara", dist:710, conso:33.0}, {id:"30", name:"Ouargla", dist:350, conso:28.5},
    {id:"31", name:"Oran", dist:830, conso:31.0}, {id:"32", name:"El Bayadh", dist:600, conso:31.5},
    {id:"33", name:"Illizi", dist:1300, conso:30.0}, {id:"34", name:"B.B. Arreridj", dist:240, conso:33.0},
    {id:"35", name:"Boumerdès", dist:410, conso:33.5}, {id:"36", name:"El Tarf", dist:490, conso:33.5},
    {id:"37", name:"Tindouf", dist:1850, conso:31.0}, {id:"38", name:"Tissemsilt", dist:530, conso:34.5},
    {id:"39", name:"El Oued", dist:220, conso:28.0}, {id:"40", name:"Khenchela", dist:180, conso:34.5},
    {id:"41", name:"Souk Ahras", dist:390, conso:35.0}, {id:"42", name:"Tipaza", dist:480, conso:34.0},
    {id:"43", name:"Mila", dist:260, conso:34.5}, {id:"44", name:"Aïn Defla", dist:520, conso:34.0},
    {id:"45", name:"Naâma", dist:720, conso:31.5}, {id:"46", name:"Aïn Témouchent", dist:890, conso:32.0},
    {id:"47", name:"Ghardaïa", dist:360, conso:29.0}, {id:"48", name:"Relizane", dist:650, conso:33.0},
    {id:"49", name:"El M'Ghair", dist:160, conso:28.5}, {id:"50", name:"Ouled Djellal", dist:100, conso:28.2},
    {id:"51", name:"Béni Abbès", dist:1100, conso:30.0}, {id:"52", name:"In Salah", dist:950, conso:29.5},
    {id:"53", name:"In Guezzam", dist:2100, conso:31.0}, {id:"54", name:"Touggourt", dist:210, conso:28.2},
    {id:"55", name:"Djanet", dist:1800, conso:30.5}, {id:"56", name:"El Meghaier", dist:160, conso:28.5},
    {id:"57", name:"El Meniaa", dist:630, conso:29.0}, {id:"58", name:"Bordj Badji Mokhtar", dist:2400, conso:32.0}
];

export const FuelCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDest, setSelectedDest] = useState<typeof destinations[0] | null>(null);

  const filteredDestinations = useMemo(() => {
    return destinations
      .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }, [search]);

  const calculation = useMemo(() => {
    if (!selectedDest) return null;
    const fuel = ((selectedDest.dist * selectedDest.conso) / 100).toFixed(1);
    const fuelCost = Math.round(parseFloat(fuel) * GAS_PRICE);
    const total = fuelCost + FRAIS;
    return { fuel, total };
  }, [selectedDest]);

  return (
    <div className="fixed bottom-4 right-20 z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-brand-green text-white rounded-full shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center"
        title="Analyse Financière"
        style={{ width: '48px', height: '48px' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <svg viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 stroke-white fill-none">
            <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="8" y1="10" x2="16" y2="10"/>
          </svg>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-700 w-[410px] max-h-[700px] flex flex-col overflow-hidden"
          >
            <div className="p-6 pb-4 flex justify-center">
              <div className="border border-brand-green px-5 py-3 rounded-xl font-mono text-brand-green dark:text-emerald-400 text-sm font-bold text-center">
                Total = [ (Dist × Conso) / 100 × 31.00 ] + 1500
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <span className="text-xs font-extrabold text-brand-green dark:text-emerald-400 uppercase tracking-widest mb-4 display-block">
                Analyse Financière
              </span>
              
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sélection Wilaya (01-58)..."
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl font-semibold outline-none mb-4 text-slate-800 dark:text-slate-200 focus:border-brand-green transition-colors"
              />

              <div className="max-h-[240px] overflow-y-auto scrollbar-hide space-y-1">
                {filteredDestinations.map(d => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDest(d)}
                    className={`p-3 px-4 rounded-xl cursor-pointer flex justify-between items-center transition-colors ${
                      selectedDest?.id === d.id 
                        ? 'bg-brand-green text-white' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs ${selectedDest?.id === d.id ? 'opacity-80' : 'opacity-50'}`}>
                        {d.id}
                      </span>
                      <strong className="font-bold">{d.name}</strong>
                    </div>
                    <span className="text-sm font-medium">{d.dist} KM</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedDest && calculation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span>Distance Réelle</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedDest.dist} KM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span>Consommation Indice</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{calculation.fuel} L</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span>Frais de Mission</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">1 500 DA</span>
                  </div>
                </div>

                <div className="bg-brand-green rounded-2xl p-6 text-center text-white">
                  <span className="text-[10px] font-extrabold opacity-80 uppercase tracking-widest block mb-1">
                    Montant Total Autorisé
                  </span>
                  <span className="text-4xl font-black tracking-tight">
                    {calculation.total.toLocaleString()} DA
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
