import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  User, 
  Package, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  Lock, 
  FileLock2, 
  Clock4, 
  ShieldCheck,
  FileText,
  Crosshair,
  Check
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const ROLES = [
  {
    id: 0,
    title: 'Logistique',
    phase: 'Disponibilité Flotte',
    icon: <Truck className="w-10 h-10" />,
    badgeIcon: <Truck className="w-4 h-4" />,
    colorClass: 'bg-slate-100 text-slate-600',
    sceneClass: 'bg-gradient-to-br from-slate-100 to-slate-200',
    responsibilities: [
      "Renseigner le matériel disponible à l'instant T.",
      "Gérer la base de données interne (Camions, Chauffeurs)."
    ],
    limit: {
      title: 'Accès restreint',
      message: 'Aucune création de mission possible. Interface strictement limitée à la gestion du parc.',
      icon: <ShieldAlert className="w-4 h-4 text-red-500" />
    }
  },
  {
    id: 1,
    title: 'Commercial',
    phase: 'Lancement & Ciblage',
    icon: <FileText className="w-10 h-10" />,
    badgeIcon: <User className="w-4 h-4" />,
    colorClass: 'bg-blue-50 text-blue-600',
    sceneClass: 'bg-gradient-to-br from-blue-50 to-blue-100',
    responsibilities: [
      "Créer la mission et cibler le besoin précis.",
      "Assigner le camion adéquat parmi ceux disponibles.",
      "Saisir la Data Client, le N° de BL et le N° de Facture."
    ],
    limit: {
      title: 'Dépendance matérielle',
      message: 'Ne peut affecter qu\'un matériel rendu "Disponible" par la Logistique.',
      icon: <Lock className="w-4 h-4 text-slate-500" />
    }
  },
  {
    id: 2,
    title: 'Magasin',
    phase: 'Chargement Physique',
    icon: <Package className="w-10 h-10" />,
    badgeIcon: <Package className="w-4 h-4" />,
    colorClass: 'bg-amber-50 text-amber-600',
    sceneClass: 'bg-gradient-to-br from-amber-50 to-amber-100',
    responsibilities: [
      "Sélectionner et valider le tonnage effectivement chargé.",
      "Pointer la conformité de la marchandise dans le camion sélectionné."
    ],
    limit: {
      title: 'Données figées',
      message: 'Impossible de modifier le choix du camion ou d\'altérer les données du client.',
      icon: <FileLock2 className="w-4 h-4 text-slate-500" />
    }
  },
  {
    id: 3,
    title: 'Commercial',
    phase: 'Clôture de Mission',
    icon: <ShieldCheck className="w-10 h-10" />,
    badgeIcon: <CheckCircle2 className="w-4 h-4" />,
    colorClass: 'bg-emerald-50 text-emerald-600',
    sceneClass: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    responsibilities: [
      "Valider la clôture définitive de la mission.",
      "Confirmer informatiquement que la marchandise a été récupérée ou réceptionnée."
    ],
    limit: {
      title: 'Chronologie forcée',
      message: 'Clôture bloquée par le système tant que le Magasin n\'a pas validé le Chargement.',
      icon: <Clock4 className="w-4 h-4 text-slate-500" />
    }
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipOnboarding, setSkipOnboarding] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(40);
  const carouselRef = useRef<HTMLDivElement>(null);

  const DURATION = 10000; // 10s per slide
  const progressPercent = ((currentIndex + 1) / ROLES.length) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ROLES.length);
    }, DURATION);

    const timeTimer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(timeTimer);
    };
  }, []);

  useEffect(() => {
    setTimeRemaining((ROLES.length - currentIndex) * 10);
  }, [currentIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    const rect = carouselRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    carouselRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    carouselRef.current.style.transition = 'none';
  };

  const handleMouseLeave = () => {
    if (!carouselRef.current) return;
    carouselRef.current.style.transform = `rotateX(0) rotateY(0)`;
    carouselRef.current.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
  };

  const handleFinish = () => {
    if (skipOnboarding) {
      localStorage.setItem('baraka_skip_onboarding', 'true');
    }
    onComplete();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      className="fixed inset-0 z-[200] bg-white/70 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto"
    >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [0, 100, 0],
                y: [0, -50, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-50/30 rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                x: [0, -100, 0],
                y: [0, 50, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-50/30 rounded-full blur-3xl"
            />
          </div>

          <div className="w-full max-w-[1100px] space-y-12 relative z-10">
            {/* Intro Section with Logo Filling Effect */}
            <div className="text-center space-y-8 flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-72 h-36"
              >
                {/* Logo Filling Effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="https://i.ibb.co/m5KrYLsV/BARAKA-LOGISTIQUE-LOGO-noir-et-blanc.png" 
                    alt="Logo N&B" 
                    className="absolute inset-0 w-full h-full object-contain opacity-[0.08]" 
                  />
                  <motion.img 
                    src="https://i.ibb.co/GQnFBJRp/BARAKA-LOGISTIQUE-LOGO-couleur.png" 
                    alt="Logo Couleur" 
                    className="absolute inset-0 w-full h-full object-contain" 
                    animate={{ clipPath: `inset(${100 - progressPercent}% 0 0 0)` }}
                    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.div 
                    className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[1px] shadow-[0_0_15px_rgba(251,191,36,0.9)] z-10"
                    animate={{ bottom: `${progressPercent}%` }}
                    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                  {/* Bubbles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-400/40 rounded-full"
                      animate={{
                        y: [0, -40],
                        x: [0, (i % 2 === 0 ? 10 : -10) * Math.random()],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.5]
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut"
                      }}
                      style={{
                        bottom: `${progressPercent}%`,
                        left: `${40 + Math.random() * 20}%`
                      }}
                    />
                  ))}
                  {/* Subtle Glow behind logo */}
                  <motion.div 
                    className="absolute inset-0 bg-amber-400/5 blur-3xl rounded-full -z-10"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              <div className="space-y-3">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight"
                >
                  Espace Opérationnel <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a5c38] to-emerald-600">& Traçabilité</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-slate-500 text-base md:text-xl max-w-3xl mx-auto leading-relaxed font-medium"
                >
                  Afin de garantir l'excellence de nos opérations, cette application est régie par un <span className="text-[#1a5c38] font-extrabold underline underline-offset-4 decoration-emerald-200">flux de travail strict</span>.
                </motion.p>
              </div>
            </div>

            {/* Carousel Section */}
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-[45px] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              
              <div 
                ref={carouselRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/50 overflow-hidden min-h-[480px] relative preserve-3d transition-all duration-700 ease-out"
                style={{ 
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 0)', 
                  backgroundSize: '40px 40px',
                  boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.12)'
                }}
              >
                {/* Time Badge */}
                <div className="absolute top-4 right-6 z-20 bg-slate-100/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-2 border border-white/50">
                  <Clock className="w-3 h-3" />
                  <span>{timeRemaining === 10 ? "Dernière étape" : `${timeRemaining}s restantes`}</span>
                </div>

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 flex gap-1.5 z-30">
                  {ROLES.map((_, idx) => (
                    <div key={idx} className="flex-1 bg-slate-100 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: idx === currentIndex ? '100%' : idx < currentIndex ? '100%' : '0%' }}
                        transition={{ duration: idx === currentIndex ? DURATION / 1000 : 0.3, ease: 'linear' }}
                        className="h-full bg-[#1a5c38]"
                      />
                    </div>
                  ))}
                </div>

                {/* Role Cards */}
                <div className="relative h-full">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={currentIndex}
                      initial={{ opacity: 0, y: 20, translateZ: 0 }}
                      animate={{ opacity: 1, y: 0, translateZ: 20 }}
                      exit={{ opacity: 0, y: -20, translateZ: 0 }}
                      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                      className="flex flex-col md:flex-row p-8 md:p-12 gap-8 md:gap-12 h-full items-center md:items-start"
                    >
                      {/* Column 1: Icon & Scene */}
                      <div className="flex flex-col items-center md:items-start gap-6 w-full md:w-auto translate-z-30">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ÉTAPE 0{currentIndex + 1} / 04</span>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm ${ROLES[currentIndex].colorClass}`}>
                          {ROLES[currentIndex].badgeIcon}
                          {ROLES[currentIndex].title}
                        </div>
                        
                        <div className={`w-32 h-32 rounded-2xl flex items-center justify-center relative shadow-lg translate-z-40 ${ROLES[currentIndex].sceneClass}`}>
                          {currentIndex === 0 && (
                            <>
                              <div className="absolute w-16 h-16 border-2 border-dashed border-slate-400 rounded-full animate-spin-slow" />
                              <Truck className="w-10 h-10 text-slate-600 relative z-10 animate-pulse" />
                            </>
                          )}
                          {currentIndex === 1 && (
                            <>
                              <FileText className="w-10 h-10 text-blue-600 animate-bounce-slow" />
                              <Crosshair className="absolute top-6 right-6 w-5 h-5 text-blue-400 animate-pulse" />
                            </>
                          )}
                          {currentIndex === 2 && (
                            <>
                              <Package className="w-6 h-6 text-amber-700 absolute top-4 animate-drop-box" />
                              <Truck className="w-12 h-12 text-amber-600 absolute bottom-6 animate-idle-truck" />
                            </>
                          )}
                          {currentIndex === 3 && (
                            <>
                              <div className="absolute w-12 h-12 bg-emerald-300 rounded-full animate-ripple opacity-0" />
                              <ShieldCheck className="w-12 h-12 text-emerald-600 relative z-10" />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Responsibilities */}
                      <div className="flex-1 space-y-6 translate-z-15">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Responsabilités Autorisées</p>
                          <h2 className="text-xl font-black text-slate-900">{ROLES[currentIndex].phase}</h2>
                        </div>
                        <ul className="space-y-4">
                          {ROLES[currentIndex].responsibilities.map((resp, i) => (
                            <motion.li 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.1 }}
                              className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-[#1a5c38] mt-2 flex-shrink-0" />
                              {resp}
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 3: Limits */}
                      <div className="w-full md:w-64 space-y-4 translate-z-25">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Limites du Système</p>
                        <div className="bg-slate-50 p-5 rounded-2xl border-l-4 border-red-500 space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                            {ROLES[currentIndex].limit.icon}
                            {ROLES[currentIndex].limit.title}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {ROLES[currentIndex].limit.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-6">
                {/* Indicators */}
                <div className="flex gap-2">
                  {ROLES.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#1a5c38]' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-8">
                  {/* Skip Checkbox */}
                  <motion.label 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: currentIndex === ROLES.length - 1 ? 1 : 0, x: currentIndex === ROLES.length - 1 ? 0 : 10 }}
                    className={`flex items-center gap-3 cursor-pointer group ${currentIndex === ROLES.length - 1 ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  >
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={skipOnboarding}
                        onChange={(e) => setSkipOnboarding(e.target.checked)}
                      />
                      <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${skipOnboarding ? 'bg-[#1a5c38] border-[#1a5c38]' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                        {skipOnboarding && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Ne plus afficher</span>
                  </motion.label>

                  <button 
                    type="button"
                    onClick={handleFinish}
                    className={`relative z-50 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer ${currentIndex === ROLES.length - 1 ? 'bg-[#1a5c38] text-white shadow-[#1a5c38]/20' : 'bg-white text-[#1a5c38] border-2 border-[#1a5c38] hover:bg-[#e6f0eb]'}`}
                  >
                    {currentIndex === ROLES.length - 1 ? 'Démarrer la session' : 'Passer l\'introduction'}
                    {currentIndex === ROLES.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
  );
};
