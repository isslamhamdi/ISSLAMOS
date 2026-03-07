import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Role } from '../types';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  setIsAuthenticated: (auth: boolean) => void;
  setIsAdding: (adding: boolean) => void;
  setRole: (role: Role) => void;
  loginError: string;
  setLoginError: (error: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  setIsAuthenticated, 
  setIsAdding, 
  setRole, 
  loginError, 
  setLoginError 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Auth state change will be handled by onAuthStateChanged in App.tsx
      setIsAuthenticated(true);
      setIsAdding(true);
      onClose();
    } catch (error: any) {
      console.error("Google login error:", error);
      setLoginError('Erreur Google: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const userInput = formData.get('username') as string;
    const pass = formData.get('password') as string;

    let email = userInput;
    let role: Role = 'VIEWER';

    // Map username to email if it's not already an email
    if (!userInput.includes('@')) {
      switch (userInput.toLowerCase()) {
        case 'admin':
          email = 'admin@petrobaraka.com';
          role = 'ADMIN';
          break;
        case 'planification':
          email = 'planification@petrobaraka.com';
          role = 'SCHEDULER';
          break;
        case 'commercial':
          email = 'commercial@petrobaraka.com';
          role = 'COMMERCIAL';
          break;
        case 'logistique':
          email = 'logistique@petrobaraka.com';
          role = 'WAREHOUSE';
          break;
        case 'chauffeur':
          email = 'chauffeur@petrobaraka.com';
          role = 'DRIVER';
          break;
        default:
          setLoginError('Identifiant inconnu. Utilisez un nom d\'utilisateur (admin, commercial...) ou votre email.');
          setIsLoading(false);
          return;
      }
    } else {
      // It's an email, role will be determined in App.tsx by onAuthStateChanged
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Login successful
      setIsAuthenticated(true);
      setRole(role);
      setIsAdding(true);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        // FALLBACK: If Email/Password is not enabled in Firebase Console, 
        // allow access in "Demo Mode" for this session.
        console.warn("Firebase Email/Password auth not enabled. Falling back to Demo Mode.");
        setIsAuthenticated(true);
        setRole(role);
        setIsAdding(true);
        onClose();
        return;
      }
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
         // Try to create the user if it doesn't exist (for demo purposes)
         try {
           await createUserWithEmailAndPassword(auth, email, pass);
           // Sign in immediately after creation
           await signInWithEmailAndPassword(auth, email, pass);
           
           setIsAuthenticated(true);
           setRole(role);
           setIsAdding(true);
           onClose();
         } catch (createErr: any) {
            console.error("Error creating user:", createErr);
            if (createErr.code === 'auth/email-already-in-use') {
               setLoginError('Mot de passe incorrect');
            } else {
               setLoginError('Erreur de connexion: ' + createErr.message);
            }
         }
      } else {
        console.error("Login error:", err);
        setLoginError('Erreur de connexion: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 p-8 space-y-6 transition-colors duration-500 relative"
      >
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent pointer-events-none" />
        
        <div className="text-center space-y-2 relative z-10">
          <div className="h-20 w-full flex items-center justify-center mb-4">
            <img 
              src="https://i.ibb.co/qM5cKP7r/BARAKA-LOGISTIQUE-1-noir-et-blanc.png" 
              alt="BARAKA LOGISTIQUE" 
              className="h-full object-contain opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tighter">Accès Restreint</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Veuillez vous identifier pour gérer le programme.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-1.5"
          >
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email / Utilisateur</label>
            <motion.input 
              whileFocus={{ scale: 1.01 }}
              name="username" 
              required 
              autoFocus
              placeholder="admin ou email@exemple.com" 
              className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-green/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:text-slate-200 transition-all" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1.5"
          >
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Mot de passe</label>
            <motion.input 
              whileFocus={{ scale: 1.01 }}
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full px-4 py-3.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-green/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:text-slate-200 transition-all" 
            />
          </motion.div>

          {loginError && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] text-red-600 font-bold text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg"
            >
              {loginError}
            </motion.p>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 pt-2"
          >
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              ANNULER
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: '#10b981' }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isLoading}
              className="flex-[2] py-3.5 bg-brand-green text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
            </motion.button>
          </motion.div>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase">Ou continuer avec</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            GOOGLE
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
