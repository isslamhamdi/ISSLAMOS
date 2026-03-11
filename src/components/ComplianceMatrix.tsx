import React, { useState, useEffect } from 'react';
import { Fuel, X, Plus, Printer, Download, Check, ListChecks } from 'lucide-react';
import ComplianceDatePicker from './ComplianceDatePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from "motion/react";
import { auth, db, signIn } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Mission, TRAILERS, PALETTES, PRODUCTS, ProductKey, PaletteKey, TrailerKey } from '../types/compliance';

const ManLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C5.372 5 0 10.261 0 16.75c0 .421.023.84.067 1.25h1.252c-.049-.41-.075-.827-.075-1.25C1.245 10.934 6.06 6.219 12 6.219s10.755 4.715 10.755 10.532c0 .423-.025.84-.075 1.25h1.253c.044-.411.067-.829.067-1.251C24 10.261 18.628 5 12 5z" fill="#34a853"></path>
    <path d="m5.26 15.645-1.246-1.22H2.247V18H4.13v-1.419l1.13 1.107 1.13-1.107V18h1.884v-3.575H6.506zM11.004 14.422 8.626 18h1.942l.265-.4h2.342l.264.4h1.943l-2.378-3.578h-2zm1 1.396.551.835h-1.102l.551-.835zM19.836 16.056l-2.246-1.631h-1.869V18h1.884v-1.617L19.836 18h1.883v-3.575h-1.883z" fill="#34a853"></path>
  </svg>
);

export const ComplianceMatrix = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [trailerType, setTrailerType] = useState<TrailerKey>('MARUCH');

  useEffect(() => {
    const handleToolOpen = (e: any) => {
      if (e.detail !== 'compliance') setIsOpen(false);
    };
    window.addEventListener('tool:open', handleToolOpen);
    return () => window.removeEventListener('tool:open', handleToolOpen);
  }, []);

  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      window.dispatchEvent(new CustomEvent('tool:open', { detail: 'compliance' }));
    }
  };

  const [paletteType, setPaletteType] = useState<PaletteKey>('EURO');
  const [items, setItems] = useState<Record<ProductKey, number>>({
    CARTON_05L: 0,
    CARTON_1L: 0,
    CARTON_5L: 0,
    BIDON_20L: 0,
    FUT_200L: 0,
  });
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<Mission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/missions`), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missions: Mission[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Mission));
      setHistory(missions);
    }, (error) => {
      console.error("Firestore error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('logistics_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedDraft = localStorage.getItem('logistics_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.items) setItems(draft.items);
        if (draft.trailerType) setTrailerType(draft.trailerType);
        if (draft.paletteType) setPaletteType(draft.paletteType);
        if (draft.notes) setNotes(draft.notes);
        if (draft.selectedDate) setSelectedDate(draft.selectedDate);
      } catch (e) {
        console.error("Erreur chargement brouillon", e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = { items, trailerType, paletteType, notes, selectedDate };
    localStorage.setItem('logistics_draft', JSON.stringify(draft));
  }, [items, trailerType, paletteType, notes, selectedDate]);

  const saveMission = async () => {
    const newMission: Omit<Mission, 'id'> = {
      date: selectedDate,
      trailerType,
      paletteType,
      items,
      notes,
      uid: user?.uid || 'anonymous',
    };

    if (user) {
      try {
        await addDoc(collection(db, `users/${user.uid}/missions`), newMission);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } catch (e) {
        console.error("Erreur enregistrement mission Firestore", e);
      }
    } else {
      // Fallback to localStorage if not logged in
      const updatedHistory = [{ ...newMission, id: Date.now().toString() }, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('logistics_history', JSON.stringify(updatedHistory));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const loadMission = (mission: Mission) => {
    if (TRAILERS[mission.trailerType]) setTrailerType(mission.trailerType);
    if (PALETTES[mission.paletteType]) setPaletteType(mission.paletteType);
    
    const defaultItems: Record<ProductKey, number> = {
      CARTON_05L: 0,
      CARTON_1L: 0,
      CARTON_5L: 0,
      BIDON_20L: 0,
      FUT_200L: 0,
    };

    if (mission.items) {
      const mergedItems = { ...defaultItems };
      (Object.entries(mission.items) as [string, number][]).forEach(([key, val]) => {
        if (key in defaultItems) {
          mergedItems[key as ProductKey] = Number(val) || 0;
        }
      });
      setItems(mergedItems);
    } else {
      setItems(defaultItems);
    }
    
    setNotes(mission.notes || '');
  };

  const maxWeight = TRAILERS[trailerType]?.weight || 25000;
  const maxVol = PALETTES[paletteType]?.max || 33;
  const weightMult = PALETTES[paletteType]?.weightMult || 1.0;

  const totalWeightKg = (Object.entries(items) as [ProductKey, number][]).reduce((acc: number, [key, q]) => {
    const product = PRODUCTS[key];
    if (!product) return acc;
    return acc + ((Number(q) || 0) * product.weight * weightMult);
  }, 0);
    
  const totalPalettes = (Object.values(items) as number[]).reduce((acc: number, q) => acc + (Number(q) || 0), 0);

  const weightPercent = Math.min((totalWeightKg / maxWeight) * 100, 100);
  const volPercent = Math.min((totalPalettes / maxVol) * 100, 100);

  const isWeightOver = totalWeightKg > maxWeight;
  const isVolOver = totalPalettes > maxVol;

  const getColorClass = (percent: number, isOver: boolean) => {
    if (isOver) return 'text-red-500 bg-red-500 border-red-500';
    if (percent === 0) return 'text-slate-500 bg-slate-500 border-slate-500';
    if (percent >= 90) return 'text-emerald-800 bg-emerald-800 border-emerald-800';
    if (percent >= 75) return 'text-green-500 bg-green-500 border-green-500';
    return 'text-amber-500 bg-amber-500 border-amber-500';
  };

  const vColorClasses = getColorClass(volPercent, isVolOver);
  const wColorClasses = getColorClass(weightPercent, isWeightOver);

  const vTextColor = vColorClasses.split(' ')[0];
  const vBgColor = vColorClasses.split(' ')[1];
  
  const wTextColor = wColorClasses.split(' ')[0];
  const wBgColor = wColorClasses.split(' ')[1];

  let statusInfo = {
    title: 'EN ATTENTE',
    desc: 'Sélectionnez le matériel et la quantité.',
    boxClass: 'bg-transparent border-slate-200',
    titleClass: 'text-slate-500'
  };

  if (totalPalettes === 0) {
    statusInfo = {
      title: 'VÉHICULE VIDE',
      desc: 'Saisissez la charge pour évaluer la conformité.',
      boxClass: 'bg-transparent border-slate-200',
      titleClass: 'text-slate-500'
    };
  } else if (isVolOver && isWeightOver) {
    statusInfo = {
      title: 'INFRACTION CRITIQUE',
      desc: `Dépassement du nombre de palettes (${maxVol} max) ET de la charge utile nette (${TRAILERS[trailerType].label}).`,
      boxClass: 'bg-red-50 border-red-500',
      titleClass: 'text-red-500'
    };
  } else if (isVolOver) {
    statusInfo = {
      title: 'REFUSÉ : DÉBORDEMENT GABARIT',
      desc: `Impossible d'insérer ${totalPalettes} palettes. La capacité sol est limitée à ${maxVol}.`,
      boxClass: 'bg-red-50 border-red-500',
      titleClass: 'text-red-500'
    };
  } else if (isWeightOver) {
    statusInfo = {
      title: 'REFUSÉ : SURCHARGE PONDÉRALE',
      desc: `Le poids dépasse la charge utile autorisée (${TRAILERS[trailerType].label}) pour un PTRA de 44T.`,
      boxClass: 'bg-red-50 border-red-500',
      titleClass: 'text-red-500'
    };
  } else if ((totalPalettes / maxVol) * 100 >= 90 || (totalWeightKg / maxWeight) * 100 >= 85) {
    statusInfo = {
      title: 'VALIDÉ : CHARGE OPTIMISÉE',
      desc: 'Conformité PTRA respectée. Excellente rentabilité logistique.',
      boxClass: 'bg-green-50 border-emerald-800',
      titleClass: 'text-emerald-800'
    };
  } else {
    const volPercentLocal = (totalPalettes / maxVol) * 100;
    const isGreen = volPercentLocal >= 75;
    statusInfo = {
      title: isGreen ? 'SOUS-CHARGE ACCEPTABLE' : 'ALERTE : SOUS-CHARGE CRITIQUE',
      desc: isGreen ? 'Optimisation satisfaisante.' : 'Transport validé mais non optimisé. Perte de rentabilité sur le trajet.',
      boxClass: isGreen ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500',
      titleClass: isGreen ? 'text-green-500' : 'text-amber-500'
    };
  }

  const handlePrint = async () => {
    setIsGenerating(true);
    setPdfError(null);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      });

      const logoUrl = "https://i.ibb.co/qL0cpf7q/BARAKA-LOGISTIQUE-LOGO.png";
      const logoImg = new Image();
      logoImg.crossOrigin = "Anonymous";
      logoImg.src = logoUrl;
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      
      const logoHeight = 14;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      doc.addImage(logoImg, 'PNG', 10, 8, logoWidth, logoHeight);

      const headerY = 27;
      doc.setFontSize(10);
      doc.setTextColor(22, 163, 74);
      doc.text("Rapport de Conformité Logistique", 10, headerY);

      doc.setFontSize(9);
      doc.setTextColor(108, 117, 125);
      const dateStr = new Date(selectedDate).toLocaleDateString('fr-FR');
      const timeStr = new Date().toLocaleTimeString('fr-FR');
      doc.text(`Mission du : ${dateStr} (Généré à ${timeStr})`, 10, headerY + 5);

      const statsStartX = 105;
      const statsStartY = 8;
      const cardWidth = 24;
      const cardHeight = 18;
      const cardGap = 2;

      doc.setFontSize(8);
      doc.setTextColor(108, 117, 125);
      doc.setFont("helvetica", "bold");
      doc.text("SYNTHÈSE DE LA CONFORMITÉ", statsStartX, statsStartY - 2);
      doc.setFont("helvetica", "normal");

      const cards = [
        { title: "PTRA MAX", value: "44 T", color: [37, 99, 235] },
        { title: "VOL. SOL", value: `${Math.round(volPercent)}%`, color: isVolOver ? [239, 68, 68] : [40, 167, 69] },
        { title: "CH. UTILE", value: `${Math.round(weightPercent)}%`, color: isWeightOver ? [239, 68, 68] : (weightPercent >= 85 ? [40, 167, 69] : [245, 158, 11]) },
        { title: "PALETTES", value: `${totalPalettes}`, color: [108, 117, 125] }
      ];

      cards.forEach((card, index) => {
        const x = statsStartX + index * (cardWidth + cardGap);
        const y = statsStartY;
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(x + 0.5, y + 0.5, cardWidth, cardHeight, 1, 1, 'F');
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1, 1, 'FD');
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.rect(x, y, cardWidth, 2, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(card.value, x + cardWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(6);
        doc.setTextColor(108, 117, 125);
        doc.text(card.title, x + cardWidth / 2, y + 15, { align: 'center' });
      });

      autoTable(doc, {
        head: [['Marque', 'Équipement', 'PALETTES', 'TOTAL', 'Poids Net', 'Statut de Conformité']],
        body: [
          [
            'MAN',
            TRAILERS[trailerType].desc,
            Object.entries(items)
              .filter(([_, q]) => (Number(q) || 0) > 0)
              .map(([k, q]) => `${q}x ${PRODUCTS[k as ProductKey].label}`)
              .join('\n') || 'Aucun',
            `${totalPalettes} Palettes (${paletteType})`,
            `${(totalWeightKg / 1000).toFixed(2)} T`,
            statusInfo.title
          ]
        ],
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
        headStyles: { fillColor: [40, 167, 69] },
        columnStyles: {
          0: { cellWidth: 15, fontStyle: 'bold', textColor: [52, 168, 83] },
          2: { textColor: [40, 167, 69], fontStyle: 'bold' },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 5) {
            data.cell.styles.fontStyle = 'bold';
            if (statusInfo.titleClass.includes('red')) {
              data.cell.styles.textColor = [239, 68, 68];
            } else if (statusInfo.titleClass.includes('emerald') || statusInfo.titleClass.includes('green')) {
              data.cell.styles.textColor = [40, 167, 69];
            } else if (statusInfo.titleClass.includes('amber')) {
              data.cell.styles.textColor = [245, 158, 11];
            }
          }
        },
        didDrawPage: function (data) {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${data.pageNumber}/${pageCount}`, 190, 138);
          doc.text("Baraka Logistique - La confiance en mouvement ! - Document Interne", 10, 138);
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY + 10;
      if (notes.trim()) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50, 50, 50);
        doc.text("Notes de mission :", 10, finalY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        const splitNotes = doc.splitTextToSize(notes, 180);
        doc.text(splitNotes, 10, finalY + 5);
        finalY += 10 + (splitNotes.length * 4);
      }

      const pageHeight = 148;
      if (finalY > pageHeight - 40) {
        doc.addPage();
        finalY = 20;
      }

      const securityText = trailerType === 'MARUCH' 
        ? "Veillez à bien répartir le centre de gravité. Les liquides (Huile conditionnée) peuvent créer des transferts de charge critiques au freinage."
        : "Plateau ouvert. Un arrimage rigoureux par sangles est obligatoire. Attention à la charge sur l'essieu moteur du tracteur MAN.";

      const boxX = 10;
      const boxY = finalY - 4;
      const boxWidth = 120;
      
      doc.setFontSize(9);
      const splitText = doc.splitTextToSize(securityText, boxWidth - 10);
      const boxHeight = 14 + (splitText.length * 4.5); 

      doc.setFillColor(249, 250, 251);
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
      doc.setFillColor(34, 197, 94);
      doc.rect(boxX, boxY, 2, boxHeight, 'F');
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text("Consignes de sécurité obligatoires :", boxX + 6, boxY + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      doc.text(splitText, boxX + 6, boxY + 13);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Visa Chef de Parc / Exploitation :", 140, finalY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Saidi Souleyman", 140, finalY + 5);
      
      const signatureImgData = "https://i.ibb.co/Df76zR0q/signature-soulayman.png";
      doc.addImage(signatureImgData, 'PNG', 140, finalY + 8, 30, 15);
      doc.setDrawColor(50, 50, 50);
      doc.line(140, finalY + 25, 190, finalY + 25);

      doc.save(`Rapport_Conformite_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF", error);
      setPdfError("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredHistory = history.filter(h => {
    const matchesSearch = searchTerm === '' || h.notes.toLowerCase().includes(searchTerm.toLowerCase()) || h.date.includes(searchTerm);
    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;
    
    const missionDate = new Date(h.date);
    const today = new Date();
    
    if (dateFilter === 'today') {
      return missionDate.toDateString() === today.toDateString();
    }
    
    if (dateFilter === 'week') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      firstDayOfWeek.setHours(0, 0, 0, 0);
      return missionDate >= firstDayOfWeek;
    }
    
    if (dateFilter === 'month') {
      return missionDate.getMonth() === today.getMonth() && missionDate.getFullYear() === today.getFullYear();
    }
    
    if (dateFilter === 'year') {
      return missionDate.getFullYear() === today.getFullYear();
    }
    
    return true;
  });

  return (
    <div className="fixed bottom-4 right-36 z-[100]">
      <button
        onClick={toggleOpen}
        className="p-3 bg-emerald-800 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center"
        title="Matrice de Conformité"
        style={{ width: '48px', height: '48px' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <ListChecks className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-700 w-[480px] max-h-[85vh] flex flex-col overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900">
              <h3 className="m-0 text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Matrice de Chargement</h3>
              <span className="font-mono text-[10px] px-3 py-1.5 rounded-md font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">PTRA: 44 TONNES</span>
            </div>

            <div className="p-8 overflow-y-auto flex-grow scrollbar-hide">
              <div className="mb-5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">Date de la mission</span>
                <ComplianceDatePicker 
                  selected={selectedDate ? new Date(selectedDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setSelectedDate(`${year}-${month}-${day}`);
                    }
                  }}
                />
              </div>

              <div className="flex gap-4 mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 h-4">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Équipement</span>
                    <ManLogo />
                  </div>
                  <select 
                    value={trailerType}
                    onChange={(e) => setTrailerType(e.target.value as TrailerKey)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-sans text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-emerald-800"
                  >
                    <option value="MARUCH">MARUCH (~26.5T)</option>
                    <option value="TIRSAM">PLATEAU (~28.0T)</option>
                    <option value="MAN_TGL">MAN TGL (~12.0T)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2 h-4">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Gabarit Palette</span>
                  </div>
                  <select 
                    value={paletteType}
                    onChange={(e) => setPaletteType(e.target.value as PaletteKey)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-sans text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-emerald-800"
                  >
                    <option value="EURO">Europe 80x120 (Max 33)</option>
                    <option value="ISO">ISO/US 100x120 (Max 26)</option>
                    <option value="DOUBLE">Double Deck (Max 66)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Marchandise</span>
                  <button 
                    onClick={() => setItems({ CARTON_05L: 0, CARTON_1L: 0, CARTON_5L: 0, BIDON_20L: 0, FUT_200L: 0 })}
                    className="text-[10px] font-extrabold text-red-500 hover:text-red-700 uppercase tracking-wider"
                  >
                    Vider
                  </button>
                </div>
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {Object.entries(PRODUCTS).map(([key, product]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{product.label}</span>
                        <span className="text-[9px] text-slate-500">~{Math.round(product.weight * weightMult)} kg/pal</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setItems(prev => ({ ...prev, [key]: Math.max(0, prev[key as ProductKey] - 1) }))}
                          className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-emerald-800"
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          value={items[key as ProductKey] || 0}
                          onChange={(e) => setItems(prev => ({ ...prev, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-10 text-center font-mono font-bold text-sm bg-transparent border-none outline-none dark:text-slate-200"
                        />
                        <button 
                          onClick={() => setItems(prev => ({ ...prev, [key]: prev[key as ProductKey] + 1 }))}
                          className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-emerald-800"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-extrabold uppercase text-slate-500">Occupation Sol</span>
                    <span className={`font-mono text-3xl font-black transition-colors ${vTextColor}`}>
                      {Math.round((totalPalettes / maxVol) * 100)}%
                    </span>
                  </div>
                  <span className="font-mono text-slate-800 dark:text-slate-300 text-xs font-bold mt-1">{totalPalettes} / {maxVol}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${vBgColor}`} style={{ width: `${volPercent}%` }}></div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-extrabold uppercase text-slate-500">Charge Utile Nette</span>
                    <span className={`font-mono text-3xl font-black transition-colors ${wTextColor}`}>
                      {Math.round((totalWeightKg / maxWeight) * 100)}%
                    </span>
                  </div>
                  <span className="font-mono text-slate-800 dark:text-slate-300 text-xs font-bold mt-1">{(totalWeightKg / 1000).toFixed(2)} T / {(maxWeight / 1000).toFixed(2)} T</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${wBgColor}`} style={{ width: `${weightPercent}%` }}></div>
                </div>
              </div>

              <div className={`mt-6 p-5 rounded-2xl text-center border-2 transition-colors ${statusInfo.boxClass}`}>
                <div className={`text-[15px] font-black tracking-wider mb-1.5 ${statusInfo.titleClass}`}>{statusInfo.title}</div>
                <div className="text-[11px] font-bold opacity-80 leading-relaxed text-slate-600 dark:text-slate-400">{statusInfo.desc}</div>
                
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={saveMission}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-800' : 'bg-emerald-800 text-white hover:bg-emerald-700'}`}
                  >
                    {isSaved ? <Check size={16} /> : <Plus size={16} />}
                    {isSaved ? 'Mission Enregistrée' : 'Valider et Enregistrer'}
                  </button>

                  <button 
                    onClick={handlePrint}
                    disabled={isGenerating}
                    className="w-full py-3 text-slate-800 dark:text-slate-200 border-2 border-slate-800 dark:border-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    {isGenerating ? 'Génération...' : 'Télécharger le Rapport'}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase mb-2 tracking-wider block">Notes libres</span>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-sans text-xs text-slate-800 dark:text-slate-200 outline-none min-h-[80px]"
                  placeholder="Ex: Attention, palettes endommagées..."
                />
              </div>

              {history.length > 0 && (
                <div className="mt-8 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">HISTORIQUE ({history.length})</span>
                      <button
                        onClick={() => {
                          setIsSelectionMode(!isSelectionMode);
                          if (isSelectionMode) setSelectedHistoryIds(new Set());
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${isSelectionMode ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title={isSelectionMode ? "Quitter le mode sélection" : "Mode sélection"}
                      >
                        <ListChecks size={16} />
                      </button>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500"
                      >
                        <option value="all">Tout</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="year">Cette année</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const itemsToExport = selectedHistoryIds.size > 0 
                            ? history.filter(h => selectedHistoryIds.has(h.id))
                            : filteredHistory;
                          
                          const headers = ['Date', 'Type Remorque', 'Type Palette', 'Produit', 'Quantité', 'Notes'];
                          const csv = [
                            headers.join(','),
                            ...itemsToExport.map(h => `${h.date},${h.trailerType},${h.paletteType},"${Object.entries(h.items || {}).map(([k, q]) => `${q}x ${k}`).join('; ')}",${Object.values(h.items || {}).reduce((a: number, b) => a + (Number(b) || 0), 0)},"${h.notes.replace(/"/g, '""')}"`)
                          ].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
                          a.download = `Historique_Conformite_${dateStr}.csv`;
                          a.click();
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-emerald-200 dark:border-emerald-800 active:scale-95"
                      >
                        CSV {selectedHistoryIds.size > 0 ? `(${selectedHistoryIds.size})` : ''}
                      </button>
                      <button 
                          onClick={async () => {
                            const itemsToExport = selectedHistoryIds.size > 0 
                              ? history.filter(h => selectedHistoryIds.has(h.id))
                              : filteredHistory;

                            const doc = new jsPDF({
                              orientation: 'landscape',
                              unit: 'mm',
                              format: 'a5'
                            });

                            const logoUrl = "https://i.ibb.co/qL0cpf7q/BARAKA-LOGISTIQUE-LOGO.png";
                            const logoImg = new Image();
                            logoImg.crossOrigin = "Anonymous";
                            logoImg.src = logoUrl;
                            await new Promise((resolve) => {
                              logoImg.onload = resolve;
                              logoImg.onerror = resolve;
                            });
                            const logoHeight = 14;
                            const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
                            doc.addImage(logoImg, 'PNG', 10, 8, logoWidth, logoHeight);

                            doc.setFontSize(10);
                            doc.setTextColor(22, 163, 74);
                            doc.text("Rapport de Conformité Logistique (Historique)", 10, 27);
                            doc.setFontSize(9);
                            doc.setTextColor(108, 117, 125);
                            doc.text(`Généré le : ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`, 10, 32);

                            doc.setFontSize(8);
                            doc.setTextColor(108, 117, 125);
                            doc.setFont("helvetica", "bold");
                            doc.text("SYNTHÈSE DE LA SÉLECTION", 105, 6);
                            doc.setFont("helvetica", "normal");

                            const totalPalettesHistory = itemsToExport.reduce((acc, h) => acc + Object.values(h.items || {}).reduce((a: number, b) => a + (Number(b) || 0), 0), 0);
                            const cards = [
                              { title: "MISSIONS", value: itemsToExport.length.toString(), color: [22, 163, 74] },
                              { title: "PALETTES", value: totalPalettesHistory.toString(), color: [40, 167, 69] },
                              { title: "CARTONS", value: itemsToExport.reduce((acc, h) => acc + (Number(h.items?.CARTON_05L) || 0) + (Number(h.items?.CARTON_1L) || 0) + (Number(h.items?.CARTON_5L) || 0), 0).toString(), color: [22, 163, 74] },
                              { title: "FÛTS", value: itemsToExport.reduce((acc, h) => acc + (Number(h.items?.FUT_200L) || 0), 0).toString(), color: [22, 163, 74] },
                            ];

                            cards.forEach((card, index) => {
                              const x = 105 + index * 26;
                              const y = 8;
                              doc.setFillColor(220, 220, 220);
                              doc.roundedRect(x + 0.5, y + 0.5, 24, 18, 1, 1, 'F');
                              doc.setFillColor(255, 255, 255);
                              doc.setDrawColor(200, 200, 200);
                              doc.roundedRect(x, y, 24, 18, 1, 1, 'FD');
                              doc.setFillColor(card.color[0], card.color[1], card.color[2]);
                              doc.rect(x, y, 24, 2, 'F');
                              doc.setFontSize(10);
                              doc.setTextColor(50, 50, 50);
                              doc.text(card.value, x + 12, y + 10, { align: 'center' });
                              doc.setFontSize(6);
                              doc.setTextColor(108, 117, 125);
                              doc.text(card.title, x + 12, y + 15, { align: 'center' });
                            });

                            autoTable(doc, {
                              head: [['Date', 'Remorque', 'Palette', 'PALETTES', 'TOTAL', 'Notes']],
                              body: itemsToExport.map(h => [
                                new Date(h.date).toLocaleDateString(),
                                h.trailerType,
                                h.paletteType,
                                Object.entries(h.items || {})
                                  .filter(([_, q]) => (Number(q) || 0) > 0)
                                  .map(([k, q]) => `${q}x ${PRODUCTS[k as ProductKey]?.label || k}`)
                                  .join('\n') || 'Vide',
                                Object.values(h.items || {}).reduce((a: number, b) => a + (Number(b) || 0), 0).toString(),
                                h.notes
                              ]),
                              startY: 40,
                              theme: 'grid',
                              styles: { fontSize: 7, cellPadding: 1 },
                              headStyles: { fillColor: [40, 167, 69] },
                              columnStyles: {
                                3: { textColor: [40, 167, 69], fontStyle: 'bold' },
                                4: { fontStyle: 'bold' }
                              }
                            });

                            const finalY = (doc as any).lastAutoTable.finalY + 10;
                            if (finalY > 110) {
                              doc.addPage();
                              doc.setFontSize(9);
                              doc.text("Visa Chef de Parc / Exploitation :", 150, 20);
                              doc.text("Saidi Souleyman", 150, 24);
                              const sigUrl = "https://i.ibb.co/Df76zR0q/signature-soulayman.png";
                              doc.addImage(sigUrl, 'PNG', 150, 26, 30, 15);
                              doc.line(150, 42, 200, 42);
                            } else {
                              doc.setFontSize(9);
                              doc.text("Visa Chef de Parc / Exploitation :", 150, finalY);
                              doc.text("Saidi Souleyman", 150, finalY + 4);
                              const sigUrl = "https://i.ibb.co/Df76zR0q/signature-soulayman.png";
                              doc.addImage(sigUrl, 'PNG', 150, finalY + 6, 30, 15);
                              doc.line(150, finalY + 22, 200, finalY + 22);
                            }

                            const pageCount = (doc as any).internal.getNumberOfPages();
                            for (let i = 1; i <= pageCount; i++) {
                              doc.setPage(i);
                              doc.setFontSize(8);
                              doc.setTextColor(150, 150, 150);
                              doc.text("Baraka Logistique - La confiance en mouvement ! - Document Interne", 10, 138);
                              doc.text(`Page ${i}/${pageCount}`, 200, 138, { align: 'right' });
                            }

                            const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
                            doc.save(`Historique_Rapport_Conformite_${dateStr}.pdf`);
                          }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-emerald-200 dark:border-emerald-800 active:scale-95"
                      >
                        PDF {selectedHistoryIds.size > 0 ? `(${selectedHistoryIds.size})` : ''}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text"
                      placeholder="Rechercher dans les notes ou dates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-emerald-800 bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredHistory.map((mission) => (
                      <div 
                        key={mission.id}
                        onClick={() => {
                          if (isSelectionMode) {
                            const newSet = new Set(selectedHistoryIds);
                            if (newSet.has(mission.id)) {
                              newSet.delete(mission.id);
                            } else {
                              newSet.add(mission.id);
                            }
                            setSelectedHistoryIds(newSet);
                          } else {
                            loadMission(mission);
                          }
                        }}
                        className={`w-full p-5 text-left bg-white dark:bg-slate-900 border hover:border-emerald-800 hover:shadow-md rounded-[20px] text-xs transition-all flex justify-between items-center cursor-pointer ${selectedHistoryIds.has(mission.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                      >
                        <div className="flex items-center gap-4">
                          {isSelectionMode && (
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedHistoryIds.has(mission.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                              {selectedHistoryIds.has(mission.id) && <Check size={12} className="text-white" />}
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-[13px]">
                              {new Date(mission.date).toLocaleDateString()} - <span className="text-emerald-600 dark:text-emerald-400 font-black">{Object.values(mission.items || {}).reduce((a: number, b) => a + (Number(b) || 0), 0)} Pal.</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                              {Object.entries(mission.items || {})
                                .filter(([_, q]) => (Number(q) || 0) > 0)
                                .map(([k, q]) => `${q}x ${PRODUCTS[k as ProductKey]?.label || k}`)
                                .join(', ') || 'Vide'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (user) {
                              try {
                                await deleteDoc(doc(db, `users/${user.uid}/missions`, mission.id));
                              } catch (err) {
                                console.error("Error deleting mission", err);
                              }
                            } else {
                              const updatedHistory = history.filter(h => h.id !== mission.id);
                              setHistory(updatedHistory);
                              localStorage.setItem('logistics_history', JSON.stringify(updatedHistory));
                            }
                          }}
                          className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          title="Supprimer la mission"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-l-[6px] text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm ${trailerType === 'MARUCH' ? 'border-amber-500' : 'border-red-500'}`}>
                {trailerType === 'MARUCH' ? (
                  <><span className="text-emerald-800 dark:text-emerald-400 font-black uppercase tracking-wider block mb-1">SÉCURITÉ MARUCH :</span> Veillez à bien répartir le centre de gravité. Les liquides (Huile conditionnée) peuvent créer des transferts de charge critiques au freinage.</>
                ) : (
                  <><span className="text-emerald-800 dark:text-emerald-400 font-black uppercase tracking-wider block mb-1">SÉCURITÉ TIRSAM :</span> Plateau ouvert. Un <strong className="font-black text-red-600 dark:text-red-400">arrimage rigoureux par sangles</strong> est obligatoire. Attention à la charge sur l'essieu moteur du tracteur MAN.</>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
