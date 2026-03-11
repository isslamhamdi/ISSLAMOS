import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Award, Medal, Calendar, FileDown, Search, TrendingUp, TrendingDown, Minus, User, Zap, Route, Leaf, Rocket, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Legend, ReferenceLine, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Movement } from '../types';

interface LeaderboardViewProps {
  movementsList: Movement[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ movementsList }) => {
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [currentImproverIndex, setCurrentImproverIndex] = useState(0);

  // Helper to get stats for a given month
  const getStatsForMonth = (month: string) => {
    const filtered = movementsList.filter(m => {
      if (m.status !== 'Livré') return false;
      const createdAt = (m as any).createdAt;
      let date: Date | null = null;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
        else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
        else if (typeof createdAt === 'string') date = new Date(createdAt);
      }
      if (!date) return false;
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === month;
    });

    const stats: Record<string, { totalEcoScore: number, totalFuel: number, count: number, totalKm: number, totalTonnage: number }> = {};
    filtered.forEach(m => {
      if (!m.driver || m.driver === 'Sans chauffeur') return;
      if (!stats[m.driver]) {
        stats[m.driver] = { totalEcoScore: 0, totalFuel: 0, count: 0, totalKm: 0, totalTonnage: 0 };
      }
      stats[m.driver].totalEcoScore += m.ecoScore || 0;
      stats[m.driver].totalFuel += m.fuel || 0;
      stats[m.driver].totalKm += (m as any).validatedKm || 0;
      stats[m.driver].totalTonnage += (m as any).validatedTonnage || 0;
      stats[m.driver].count += 1;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      avgEcoScore: data.totalEcoScore / data.count,
      avgFuel: data.totalFuel / data.count,
      missions: data.count,
      totalKm: data.totalKm,
      totalTonnage: data.totalTonnage
    }));
  };

  // Helper to get stats for a given trimester (e.g., "2026-Q1")
  const getStatsForTrimester = (trimester: string) => {
    const [year, q] = trimester.split('-Q');
    const startMonth = (parseInt(q) - 1) * 3;
    
    const filtered = movementsList.filter(m => {
      if (m.status !== 'Livré') return false;
      const createdAt = (m as any).createdAt;
      let date: Date | null = null;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
        else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
        else if (typeof createdAt === 'string') date = new Date(createdAt);
      }
      if (!date) return false;
      
      return date.getFullYear() === parseInt(year) && 
             date.getMonth() >= startMonth && 
             date.getMonth() < startMonth + 3;
    });

    const stats: Record<string, { totalEcoScore: number, totalFuel: number, count: number, totalKm: number, totalTonnage: number }> = {};
    filtered.forEach(m => {
      if (!m.driver || m.driver === 'Sans chauffeur') return;
      if (!stats[m.driver]) {
        stats[m.driver] = { totalEcoScore: 0, totalFuel: 0, count: 0, totalKm: 0, totalTonnage: 0 };
      }
      stats[m.driver].totalEcoScore += m.ecoScore || 0;
      stats[m.driver].totalFuel += m.fuel || 0;
      stats[m.driver].totalKm += (m as any).validatedKm || 0;
      stats[m.driver].totalTonnage += (m as any).validatedTonnage || 0;
      stats[m.driver].count += 1;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      avgEcoScore: data.totalEcoScore / data.count,
      avgFuel: data.totalFuel / data.count,
      missions: data.count,
      totalKm: data.totalKm,
      totalTonnage: data.totalTonnage
    }));
  };

  const [selectedTrimester, setSelectedTrimester] = React.useState<string>(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${q}`;
  });

  // Extract unique trimesters from movements
  const availableTrimesters = React.useMemo(() => {
    const trimesters = new Set<string>();
    movementsList.forEach(m => {
      const createdAt = (m as any).createdAt;
      let date: Date | null = null;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
        else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
        else if (typeof createdAt === 'string') date = new Date(createdAt);
      }
      if (date) {
        const q = Math.floor(date.getMonth() / 3) + 1;
        trimesters.add(`${date.getFullYear()}-Q${q}`);
      }
    });
    return Array.from(trimesters).sort().reverse();
  }, [movementsList]);

  const { top3, others, allDrivers, driverHistory, correlationData, fleetAvgEco, fleetAvgFuel, podiumDistributionData, topImprover, improvers } = React.useMemo(() => {
    const currentStats = getStatsForTrimester(selectedTrimester);
    
    // Calculate monthly trend (latest month of trimester vs previous month)
    const [year, qStr] = selectedTrimester.split('-Q');
    const lastMonthOfQ = parseInt(qStr) * 3;
    const currentMonthStr = `${year}-${String(lastMonthOfQ).padStart(2, '0')}`;
    
    const prevMonthDate = new Date(parseInt(year), lastMonthOfQ - 2, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    const currentMonthStats = getStatsForMonth(currentMonthStr);
    const prevMonthStats = getStatsForMonth(prevMonthStr);
    const prevMonthStatsMap = new Map(prevMonthStats.map(s => [s.name, s.avgEcoScore]));
    const currentMonthStatsMap = new Map(currentMonthStats.map(s => [s.name, s.avgEcoScore]));

    const sorted = currentStats.map(driver => {
      const currentMonthScore = currentMonthStatsMap.get(driver.name);
      const prevMonthScore = prevMonthStatsMap.get(driver.name);
      return {
        ...driver,
        trend: (currentMonthScore !== undefined && prevMonthScore !== undefined)
          ? currentMonthScore - prevMonthScore
          : 0
      };
    }).sort((a, b) => b.avgEcoScore - a.avgEcoScore);

    const improvers = [...sorted].filter(d => d.trend > 0).sort((a, b) => b.trend - a.trend);
    const topImprover = improvers[0];

    const filtered = sorted.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Driver History (Daily data for the selected trimester)
    const driverHistory = selectedDriver ? (() => {
      const [year, q] = selectedTrimester.split('-Q');
      const startMonth = (parseInt(q) - 1) * 3;
      
      const filteredMovements = movementsList.filter(m => {
        if (m.driver !== selectedDriver || m.status !== 'Livré') return false;
        const createdAt = (m as any).createdAt;
        let date: Date | null = null;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
          else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
          else if (typeof createdAt === 'string') date = new Date(createdAt);
        }
        if (!date) return false;
        return date.getFullYear() === parseInt(year) && 
               date.getMonth() >= startMonth && 
               date.getMonth() < startMonth + 3;
      });

      // Group by day index within trimester (1-92)
      const dailyStats: Record<number, { total: number, count: number, date: string }> = {};
      const startDate = new Date(parseInt(year), startMonth, 1);

      filteredMovements.forEach(m => {
        const createdAt = (m as any).createdAt;
        let date: Date | null = null;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
          else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
          else if (typeof createdAt === 'string') date = new Date(createdAt);
        }
        if (date) {
          const diffTime = Math.abs(date.getTime() - startDate.getTime());
          const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          if (!dailyStats[dayIndex]) dailyStats[dayIndex] = { total: 0, count: 0, date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) };
          dailyStats[dayIndex].total += m.ecoScore || 0;
          dailyStats[dayIndex].count += 1;
        }
      });

      return Object.entries(dailyStats)
        .map(([day, data]) => ({ day: parseInt(day), score: data.total / data.count, date: data.date }))
        .sort((a, b) => a.day - b.day);
    })() : [];

    // Correlation Data
    const correlationData = filtered.map(d => ({ eco: d.avgEcoScore, fuel: d.avgFuel, name: d.name }));

    // Fleet Average for comparison
    const fleetAvgEco = filtered.length > 0 ? filtered.reduce((sum, d) => sum + d.avgEcoScore, 0) / filtered.length : 0;
    const fleetAvgFuel = filtered.length > 0 ? filtered.reduce((sum, d) => sum + d.avgFuel, 0) / filtered.length : 0;

    // Fleet History (Average of all drivers per day)
    const fleetHistory = (() => {
      const [year, q] = selectedTrimester.split('-Q');
      const startMonth = (parseInt(q) - 1) * 3;
      
      const trimesterMovements = movementsList.filter(m => {
        if (m.status !== 'Livré') return false;
        const createdAt = (m as any).createdAt;
        let date: Date | null = null;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
          else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
          else if (typeof createdAt === 'string') date = new Date(createdAt);
        }
        if (!date) return false;
        return date.getFullYear() === parseInt(year) && 
               date.getMonth() >= startMonth && 
               date.getMonth() < startMonth + 3;
      });

      const dailyStats: Record<number, { total: number, count: number }> = {};
      const startDate = new Date(parseInt(year), startMonth, 1);

      trimesterMovements.forEach(m => {
        const createdAt = (m as any).createdAt;
        let date: Date | null = null;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
          else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
          else if (typeof createdAt === 'string') date = new Date(createdAt);
        }
        if (date) {
          const diffTime = Math.abs(date.getTime() - startDate.getTime());
          const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          if (!dailyStats[dayIndex]) dailyStats[dayIndex] = { total: 0, count: 0 };
          dailyStats[dayIndex].total += m.ecoScore || 0;
          dailyStats[dayIndex].count += 1;
        }
      });

      return Object.entries(dailyStats)
        .map(([day, data]) => ({ day: parseInt(day), fleetScore: data.total / data.count }))
        .sort((a, b) => a.day - b.day);
    })();

    // Merge driver history with fleet history
    const combinedHistory = fleetHistory.map(fh => {
      const driverPoint = driverHistory.find(dh => dh.day === fh.day);
      return {
        ...fh,
        driverScore: driverPoint ? driverPoint.score : null,
        date: driverPoint ? driverPoint.date : null
      };
    });

    // Badges logic
    const maxMissions = Math.max(...filtered.map(d => d.missions), 0);
    const minFuel = Math.min(...filtered.map(d => d.avgFuel), 100);

    const driversWithBadges = filtered.map((d, index) => {
      const badges = [];
      if (d.avgEcoScore >= 90) badges.push({ icon: Zap, label: 'Eco-Expert', color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' });
      if (d.missions === maxMissions && maxMissions > 0) badges.push({ icon: Route, label: 'Gros Rouleur', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' });
      if (d.avgFuel === minFuel && filtered.length > 1) badges.push({ icon: Leaf, label: 'Économe', color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' });
      if (d.trend > 5) badges.push({ icon: Rocket, label: 'Progression', color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' });
      
      // Calculate consistency (standard deviation approximation)
      const driverMovements = movementsList.filter(m => m.driver === d.name && m.status === 'Livré' && m.ecoScore);
      const scores = driverMovements.map(m => m.ecoScore!);
      const avg = d.avgEcoScore;
      const variance = scores.length > 1 ? scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length : 0;
      const consistency = Math.max(0, 100 - Math.sqrt(variance) * 2);

      // Mock driving style sub-scores based on ecoScore for visual variety
      const anticipation = Math.min(100, Math.max(0, d.avgEcoScore + (Math.random() * 10 - 5)));
      const speedControl = Math.min(100, Math.max(0, d.avgEcoScore + (Math.random() * 10 - 5)));
      const braking = Math.min(100, Math.max(0, d.avgEcoScore + (Math.random() * 10 - 5)));

      const nextDriver = index > 0 ? filtered[index - 1] : null;
      const distanceToNext = nextDriver ? nextDriver.avgEcoScore - d.avgEcoScore : 0;

      return { ...d, badges, consistency, distanceToNext, rank: index + 1, style: { anticipation, speedControl, braking } };
    });

    // Mission Distribution (Contextual)
    const missionDistribution = selectedDriver ? (() => {
      const [year, q] = selectedTrimester.split('-Q');
      const startMonth = (parseInt(q) - 1) * 3;
      const data = [];
      const colors = ['#22c55e', '#eab308', '#ef4444'];
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      
      for (let i = 0; i < 3; i++) {
        const monthIndex = startMonth + i;
        
        // Count missions for this driver in this month
        const monthMissions = movementsList.filter(m => {
          if (m.driver !== selectedDriver || m.status !== 'Livré') return false;
          const createdAt = (m as any).createdAt;
          let date: Date | null = null;
          if (createdAt) {
            if (typeof createdAt.toDate === 'function') date = createdAt.toDate();
            else if (createdAt.seconds) date = new Date(createdAt.seconds * 1000);
            else if (typeof createdAt === 'string') date = new Date(createdAt);
          }
          return date && date.getFullYear() === parseInt(year) && date.getMonth() === monthIndex;
        }).length;

        data.push({ 
          name: months[monthIndex], 
          value: monthMissions || 0,
          color: colors[i]
        });
      }
      return data;
    })() : (() => {
      const top1Missions = filtered.length > 0 ? filtered[0].missions : 0;
      const top23Missions = filtered.slice(1, 3).reduce((sum, d) => sum + d.missions, 0);
      const othersMissions = filtered.slice(3).reduce((sum, d) => sum + d.missions, 0);
      return [
        { name: 'N°1 Fleet', value: top1Missions, color: '#22c55e' },
        { name: 'Top 2-3', value: top23Missions, color: '#eab308' },
        { name: 'Autres', value: othersMissions, color: '#ef4444' }
      ];
    })();

    return {
      top3: driversWithBadges.slice(0, 3),
      others: driversWithBadges.slice(3),
      allDrivers: driversWithBadges,
      driverHistory: combinedHistory,
      correlationData,
      fleetAvgEco,
      fleetAvgFuel,
      podiumDistributionData: missionDistribution,
      topImprover,
      improvers
    };
  }, [movementsList, selectedTrimester, searchTerm, selectedDriver]);

  // Carousel effect for improvers
  React.useEffect(() => {
    if (improvers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImproverIndex(prev => (prev + 1) % improvers.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [improvers.length]);

  const currentImprover = improvers[currentImproverIndex];
  const isBestImprover = currentImproverIndex === 0;

  const gradients = [
    'from-purple-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-blue-600 to-cyan-600',
    'from-orange-600 to-amber-600',
    'from-rose-600 to-pink-600'
  ];
  const currentGradient = gradients[currentImproverIndex % gradients.length];

  const exportAllCertificates = async () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    
    // Fetch background image once
    const bgUrl = "https://i.ibb.co/1JGTHQH/arrie-re-plan.png";
    let bgData = "";
    try {
        const response = await fetch(bgUrl);
        const blob = await response.blob();
        bgData = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Background load error", e);
    }
    
    for (let index = 0; index < top3.length; index++) {
        const driver = top3[index];
        if (index > 0) doc.addPage();
        
        // 1. White Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 297, 210, 'F');

        // Add background image with opacity
        if (bgData) {
            // @ts-ignore
            doc.setGState(new doc.GState({ opacity: 0.2 }));
            
            // Calculate dimensions to maintain aspect ratio and center
            const pageWidth = 297;
            const pageHeight = 210;
            const imgWidth = 200; // Adjust as needed
            const imgHeight = 150; // Adjust as needed
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            doc.addImage(bgData, 'PNG', x, y, imgWidth, imgHeight);
            // @ts-ignore
            doc.setGState(new doc.GState({ opacity: 1.0 }));
        }

        // 2. Gold Border
        doc.setDrawColor(212, 175, 55); // Gold
        doc.setLineWidth(5);
        doc.rect(10, 10, 277, 190);
        doc.setLineWidth(1);
        doc.rect(15, 15, 267, 180);
        
        // 3. Logo
        const logoUrl = "https://i.ibb.co/HpRC5QKG/Logo-petro-baraka.png";
        try {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const imgData = await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result as string);
                r.readAsDataURL(blob);
            });
            doc.addImage(imgData, 'PNG', 20, 20, 30, 15);
        } catch (e) {
            console.error("Logo load error", e);
        }

        // 4. Icon (Trophy for 1st, Medal for 2nd/3rd)
        if (index === 0) {
            doc.setDrawColor(234, 179, 8); // yellow-500
            doc.setLineWidth(1);
            doc.line(140, 30, 156, 30); // top
            doc.line(144, 30, 144, 35); // left handle
            doc.line(152, 30, 152, 35); // right handle
            doc.circle(148, 38, 5, 'S'); // cup
        } else {
            doc.setDrawColor(index === 1 ? 148 : 180, index === 1 ? 163 : 83, index === 1 ? 184 : 9); // slate-400 or amber-700
            doc.setLineWidth(2);
            doc.circle(148, 35, 8, 'S'); // Medal
            doc.line(148, 27, 144, 20); // Ribbon left
            doc.line(148, 27, 152, 20); // Ribbon right
        }

        // 5. Text (Times font)
        doc.setTextColor(212, 175, 55); // Gold
        doc.setFont("times", "bold");
        doc.setFontSize(30);
        doc.text("CERTIFICAT D'HONNEUR", 148, 55, { align: 'center' });
        doc.setFontSize(20);
        doc.text(`"${index === 0 ? 'CHAUFFEUR DU MOIS' : 'CHAUFFEUR DU MOIS - ' + (index + 1) + 'ème'}"`, 148, 70, { align: 'center' });

        doc.setTextColor(0, 0, 0); // Black
        doc.setFontSize(16);
        doc.setFont("times", "normal");
        doc.text("La direction de Petro Baraka a l'honneur de décerner ce certificat à:", 148, 95, { align: 'center' });
        
        doc.setFontSize(24);
        doc.setFont("times", "bold");
        doc.setTextColor(0, 128, 0); // Green
        doc.text(driver.name, 148, 115, { align: 'center' });
        
        doc.setTextColor(0, 0, 0); // Reset to Black
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        
        const monthYear = selectedTrimester;
        const part1 = "En reconnaissance de ses efforts exceptionnels et de son dévouement exemplaire dans l'exercice de ses fonctions durant le trimestre: ";
        const part2 = monthYear;
        const part3 = ". Vous avez fait preuve, au quotidien, d'un engagement exemplaire envers les valeurs de l'entreprise, alliant discipline, professionnalisme, respect strict des règles de sécurité routière et responsabilité totale dans la préservation des cargaisons et la satisfaction de nos clients. Nous sommes fiers de vous compter parmi notre équipe et vous souhaitons encore plus de succès dans votre carrière professionnelle avec nous.";
        
        const x = 148;
        let y = 125;
        const maxWidth = 200;
        
        const bodyText = part1 + part2 + part3;
        const lines = doc.splitTextToSize(bodyText, maxWidth);
        
        let currentY = y;
        for (const line of lines) {
            const totalWidth = doc.getTextWidth(line);
            const startX = x - totalWidth / 2;
            
            if (line.includes(part2)) {
                const parts = line.split(part2);
                const before = parts[0];
                const after = parts[1];
                
                doc.setTextColor(0, 0, 0);
                doc.text(before, startX, currentY);
                
                doc.setTextColor(0, 128, 0);
                doc.text(part2, startX + doc.getTextWidth(before), currentY);
                
                doc.setTextColor(0, 0, 0);
                doc.text(after, startX + doc.getTextWidth(before) + doc.getTextWidth(part2), currentY);
            } else {
                doc.setTextColor(0, 0, 0);
                doc.text(line, x, currentY, { align: 'center' });
            }
            currentY += 7;
        }
        
        doc.setTextColor(0, 0, 0); // Reset to Black

        // Footer (Adjusted higher)
        const [year, q] = selectedTrimester.split('-Q');
        const endMonth = parseInt(q) * 3;
        const lastDay = new Date(parseInt(year), endMonth, 0);
        const formattedDate = lastDay.toLocaleDateString('fr-FR');
        doc.text(`Fait à Biskra, le: ${formattedDate}`, 50, 170);
        doc.text("Signature de la Direction", 220, 170, { align: 'center' });
    }

    doc.save(`Certificats_Top3_${selectedTrimester}.pdf`);
  };

  const getMedal = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1: return <Medal className="w-8 h-8 text-slate-400" />;
      case 2: return <Medal className="w-8 h-8 text-amber-700" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-green/10 rounded-2xl text-brand-green">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Leaderboard Eco-Score</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Classement des chauffeurs basé sur la performance moyenne.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {top3.length > 0 && (
            <button 
              onClick={exportAllCertificates}
              className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-green/90 transition-all"
            >
              <FileDown className="w-4 h-4" />
              Exporter Certificats (Top 3)
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={selectedTrimester}
              onChange={(e) => setSelectedTrimester(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none py-1 pr-4"
            >
              {availableTrimesters.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Insights & Quick Stats */}
      {selectedDriver && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {(() => {
            const driver = allDrivers.find(d => d.name === selectedDriver);
            if (!driver) return null;
            return (
              <>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status Performance</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${driver.avgEcoScore >= 80 ? 'bg-green-500' : driver.avgEcoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {driver.avgEcoScore >= 80 ? 'Excellent' : driver.avgEcoScore >= 60 ? 'Correct' : 'À améliorer'}
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Vs Moyenne Flotte</p>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${driver.avgEcoScore >= fleetAvgEco ? 'text-green-500' : 'text-red-500'}`}>
                      {driver.avgEcoScore >= fleetAvgEco ? '+' : ''}{(driver.avgEcoScore - fleetAvgEco).toFixed(1)} pts
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Régularité</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {driver.consistency.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Style de Conduite</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Anticipation', value: driver.style.anticipation, color: 'bg-emerald-500' },
                      { label: 'Vitesse', value: driver.style.speedControl, color: 'bg-blue-500' },
                      { label: 'Freinage', value: driver.style.braking, color: 'bg-orange-500' }
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-[9px] mb-0.5">
                          <span className="text-slate-500">{s.label}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{s.value.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className={`${s.color} h-full transition-all duration-1000`} style={{ width: `${s.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Objectif Rang</p>
                  <div className="flex flex-col justify-center h-full">
                    {driver.distanceToNext > 0 ? (
                      <>
                        <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
                          <TrendingUp className="w-4 h-4" />
                          <span>+{driver.distanceToNext.toFixed(1)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Pour atteindre le rang {driver.rank - 1}</p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-500 font-black">
                        <Trophy className="w-4 h-4" />
                        <span>N°1 ACTUEL</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm md:col-span-1">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Badges Actifs</p>
                  <div className="flex flex-wrap gap-2">
                    {driver.badges.length > 0 ? driver.badges.map(b => {
                      const Icon = b.icon;
                      return (
                        <span key={b.label} className={`px-2 py-1 ${b.bgColor} rounded-lg text-[10px] font-bold flex items-center gap-1 border border-transparent`}>
                          <Icon className={`w-3 h-3 ${b.color}`} />
                          <span className={b.color}>{b.label}</span>
                        </span>
                      );
                    }) : <span className="text-xs text-slate-400 italic">Aucun badge</span>}
                  </div>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Top Improvers Carousel */}
      <AnimatePresence mode="wait">
        {currentImprover && (
          <motion.div 
            key={currentImprover.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-r ${currentGradient} rounded-[28px] p-6 text-white shadow-lg flex items-center justify-between overflow-hidden relative`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                {isBestImprover ? <Trophy className="w-5 h-5 text-yellow-300" /> : <Rocket className="w-5 h-5 text-white/80" />}
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                  {isBestImprover ? 'Meilleure Progression' : 'Progression du Mois'}
                </span>
              </div>
              <h2 className="text-2xl font-black mb-1">{currentImprover.name}</h2>
              <p className="text-white/80 text-sm">
                A augmenté son score de <span className="font-bold text-white">+{currentImprover.trend.toFixed(1)} points</span> ce mois-ci !
              </p>
            </div>
            <div className="relative z-10 text-right flex flex-col items-end">
              <div className="text-4xl font-black opacity-20 absolute -right-4 -top-8 scale-150">
                {isBestImprover ? 'BEST' : 'TOP'}
              </div>
              {isBestImprover && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="mb-2 bg-yellow-400/20 p-2 rounded-full border border-yellow-400/30"
                >
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </motion.div>
              )}
              <button 
                onClick={() => setSelectedDriver(currentImprover.name)}
                className="mt-2 px-6 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Voir Détails
              </button>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Driver History */}
        <div id="eco-evolution-chart" className="bg-white dark:bg-slate-900 rounded-[28px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Évolution Eco-Score {selectedDriver ? `(${selectedDriver})` : ''}</h3>
            {selectedDriver && (
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-brand-green" />
                  <span className="text-slate-600 dark:text-slate-400">Chauffeur</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-600 dark:text-slate-400">Moy. Flotte</span>
                </div>
              </div>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driverHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  label={{ value: 'Jours du Trimestre', position: 'insideBottom', offset: -5 }} 
                  tick={{ fontSize: 10 }}
                  ticks={[1, 10, 20, 30, 40, 50, 60, 70, 80, 90]}
                />
                <YAxis domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const entry = driverHistory.find(d => d.day === value);
                    return entry?.date ? `Date: ${entry.date}` : `Jour ${value}`;
                  }}
                />
                <Line type="monotone" dataKey="fleetScore" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={true} />
                {selectedDriver && (
                  <Line type="monotone" dataKey="driverScore" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} isAnimationActive={true} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Chart - Correlation */}
        <div id="eco-fuel-correlation-chart" className="bg-white dark:bg-slate-900 rounded-[28px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Corrélation Eco/Carburant</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="eco" name="Eco-Score" label={{ value: 'Eco-Score', position: 'insideBottom', offset: -5 }} />
                <YAxis type="number" dataKey="fuel" name="Fuel" label={{ value: 'Conso (L)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isFleetAvg = data.name === 'Moyenne Flotte';
                      return (
                        <div className={`p-3 border rounded-lg shadow-xl ${isFleetAvg ? 'bg-slate-800 text-white border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                          <p className="font-bold">{data.name}</p>
                          <p className="text-sm opacity-80">Eco-Score: {data.eco.toFixed(1)}</p>
                          <p className="text-sm opacity-80">Fuel: {data.fuel.toFixed(1)} L/100km</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Chauffeurs" data={correlationData} fill="#8884d8" isAnimationActive={true} />
                <Scatter name="Moyenne Flotte" data={[{ eco: fleetAvgEco, fuel: fleetAvgFuel, name: 'Moyenne Flotte' }]} fill="#ef4444" shape="star" isAnimationActive={true} />
                <ReferenceLine x={80} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Objectif', position: 'top', fill: '#22c55e', fontSize: 10 }} />
                <ReferenceLine y={fleetAvgFuel} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Moy. Fuel', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mission Distribution Dashboard */}
        <div id="mission-distribution-chart" className="bg-white dark:bg-slate-900 rounded-[28px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {selectedDriver ? `Activité de ${selectedDriver}` : 'Volume des Missions'}
            </h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Route className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="30%" 
                outerRadius="100%" 
                barSize={15} 
                data={podiumDistributionData.map((d, i) => ({
                  ...d,
                  fill: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                }))}
                startAngle={180} 
                endAngle={-180}
              >
                <PolarAngleAxis type="number" domain={[0, 'auto']} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  dataKey="value"
                  cornerRadius={10}
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                  isAnimationActive={true}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-800 text-white p-2 rounded-lg text-xs shadow-xl border border-slate-700">
                          <p className="font-bold">{payload[0].name}</p>
                          <p>{payload[0].value} Missions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {podiumDistributionData.reduce((sum, d) => sum + (d.value || 0), 0)}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
            </div>
          </div>

          {/* Micro Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {podiumDistributionData.map((item, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (item as any).color }} />
                  <span className="text-[10px] font-bold text-slate-500 truncate uppercase">{item.name}</span>
                </div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Driver Selection Row */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher un chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <select 
            value={selectedDriver || ''}
            onChange={(e) => setSelectedDriver(e.target.value || null)}
            className="w-full md:w-64 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="">Sélectionner un chauffeur</option>
            {allDrivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Podium Visuel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
        {/* N°2 */}
        {top3[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedDriver(top3[1].name)}
            className="order-2 md:order-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm text-center relative cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-600 w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white dark:border-slate-900 shadow-md">2</div>
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{top3[1].name}</h4>
            <div className="text-3xl font-black text-slate-400 mt-1">{top3[1].avgEcoScore.toFixed(1)}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eco-Score</div>
          </motion.div>
        )}

        {/* N°1 */}
        {top3[0] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSelectedDriver(top3[0].name)}
            className="order-1 md:order-2 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/10 dark:to-slate-900 rounded-[40px] p-10 border-2 border-yellow-300 dark:border-yellow-900/30 shadow-2xl text-center relative z-10 cursor-pointer transform hover:scale-[1.05] transition-all group"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-white w-16 h-16 rounded-full flex items-center justify-center font-black border-4 border-white dark:border-slate-900 shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="w-28 h-28 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-yellow-200 dark:border-yellow-900/40 group-hover:rotate-12 transition-transform">
              <User className="w-14 h-14 text-yellow-600" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 truncate">{top3[0].name}</h4>
            <div className="text-5xl font-black text-yellow-500 mt-2 drop-shadow-sm">{top3[0].avgEcoScore.toFixed(1)}</div>
            <div className="text-xs font-bold text-yellow-600/60 uppercase tracking-widest mt-2">Champion du Trimestre</div>
            
            <div className="mt-6 flex justify-center gap-3">
              {top3[0].badges.map(b => {
                const Icon = b.icon;
                return <Icon key={b.label} className="w-6 h-6 text-yellow-500 opacity-80" />;
              })}
            </div>
          </motion.div>
        )}

        {/* N°3 */}
        {top3[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedDriver(top3[2].name)}
            className="order-3 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm text-center relative cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white dark:border-slate-900 shadow-md">3</div>
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{top3[2].name}</h4>
            <div className="text-3xl font-black text-orange-400 mt-1">{top3[2].avgEcoScore.toFixed(1)}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eco-Score</div>
          </motion.div>
        )}
      </div>

      {/* Others Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden p-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Classement général</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Rang</th>
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Chauffeur</th>
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Missions</th>
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Distance Totale</th>
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tonnage Total</th>
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Eco-Score Moyen</th>
                <th className="px-6 py-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tendance (Mensuelle)</th>
              </tr>
            </thead>
            <tbody>
              {allDrivers.map((driver, index) => (
                <motion.tr 
                  key={driver.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => setSelectedDriver(driver.name)}
                >
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                    <span>{driver.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{driver.missions}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{(driver as any).totalKm?.toLocaleString()} km</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{(driver as any).totalTonnage?.toLocaleString()} T</td>
                  <td className="px-6 py-4 font-bold text-brand-green">{driver.avgEcoScore.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {driver.trend > 0.5 ? <TrendingUp className="w-4 h-4 text-green-500" /> : 
                       driver.trend < -0.5 ? <TrendingDown className="w-4 h-4 text-red-500" /> : 
                       <Minus className="w-4 h-4 text-slate-400" />}
                      <span className={`text-xs font-bold ${driver.trend > 0.5 ? 'text-green-500' : driver.trend < -0.5 ? 'text-red-500' : 'text-slate-400'}`}>
                        {driver.trend > 0 ? '+' : ''}{driver.trend.toFixed(1)}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
