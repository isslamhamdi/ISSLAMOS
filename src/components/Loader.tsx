import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  onComplete: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("MISE EN PRESSION...");
  const [isValidated, setIsValidated] = useState(false);
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [hideUI, setHideUI] = useState(false);
  
  const particlesContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const statusMessages = [
    { threshold: 0, text: "MISE EN PRESSION..." },
    { threshold: 25, text: "POMPAGE DES LUBRIFIANTS..." },
    { threshold: 60, text: "VISCOSITÉ OPTIMALE..." },
    { threshold: 90, text: "NIVEAU MAXIMAL..." },
    { threshold: 100, text: "TRANSACTION VALIDÉE." }
  ];

  const createBubble = (currentHeightPercent: number) => {
    if (!particlesContainerRef.current) return;
    
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    const size = Math.random() * 8 + 4;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 90 + 5}%`;
    bubble.style.bottom = `${currentHeightPercent}%`;
    bubble.style.animationDuration = `${Math.random() * 1.5 + 1.5}s`;
    
    particlesContainerRef.current.appendChild(bubble);
    setTimeout(() => {
      if (bubble.parentNode) bubble.remove();
    }, 3000);
  };

  const triggerParticleSplash = () => {
    if (!particlesContainerRef.current) return;
    
    const particleCount = 20;
    for(let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('splash-particle');
        const size = Math.random() * 6 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.transform = 'translate(-50%, -50%)';

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 150 + 80;
        particle.style.setProperty('--tx', `${Math.cos(angle) * radius}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * radius}px`);
        
        particle.style.animationDuration = `${Math.random() * 0.4 + 0.3}s`;

        particlesContainerRef.current.appendChild(particle);
        setTimeout(() => {
          if (particle.parentNode) particle.remove();
        }, 700);
    }
  };

  const triggerSpecialDisappearance = () => {
    setStatusText("ACCÈS AUTORISÉ");
    setIsValidated(true);
    setHideUI(true);

    setTimeout(() => {
      setIsDisappearing(true);
      triggerParticleSplash();

      setTimeout(() => {
        onComplete();
      }, 800);
      
    }, 700);
  };

  const updateStatusText = (currentProgress: number) => {
    const currentMessage = [...statusMessages].reverse().find(m => currentProgress >= m.threshold);
    if (currentMessage) {
      setStatusText(currentMessage.text);
    }
  };

  const simulateFluidFill = () => {
    let increment = Math.random() * 2.5 + 0.2;
    progressRef.current += increment;

    if (progressRef.current >= 100) {
      progressRef.current = 100;
      setProgress(100);
      updateStatusText(100);
      triggerSpecialDisappearance();
      return;
    }

    setProgress(progressRef.current);
    updateStatusText(progressRef.current);
    
    if (Math.random() > 0.4) {
      createBubble(progressRef.current);
    }
    
    timeoutRef.current = setTimeout(simulateFluidFill, Math.random() * 60 + 30);
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(simulateFluidFill, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const displayValue = Math.min(100, Math.floor(progress));
  const insetTop = 100 - progress;

  return (
    <div className="loader-container">
      <div className="loader-wrapper">
        
        <div className={`logo-container ${isDisappearing ? 'disappearing' : ''}`}>
            <img 
              src="https://i.ibb.co/m5KrYLsV/BARAKA-LOGISTIQUE-LOGO-noir-et-blanc.png" 
              alt="Logo N&B" 
              className="logo-bw" 
              style={{ opacity: hideUI ? 0 : 0.15 }}
            />
            <img 
              src="https://i.ibb.co/GQnFBJRp/BARAKA-LOGISTIQUE-LOGO-couleur.png" 
              alt="Logo Couleur" 
              className={`logo-color ${isValidated ? 'validated' : ''}`} 
              style={{ clipPath: `inset(${insetTop}% 0 0 0)` }}
            />
            <div 
              className="oil-surface" 
              style={{ bottom: `${progress}%`, opacity: hideUI ? 0 : 1 }}
            ></div>
            <div className="particles-container" ref={particlesContainerRef}></div>
        </div>

        <div className="oil-pipe" style={{ opacity: hideUI ? 0 : 1 }}>
            <div className="oil-fluid-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="data-info" style={{ opacity: hideUI ? 0 : 1 }}>
            <span>{statusText}</span>
            <span className="percentage">{isValidated ? "READY" : `${displayValue}%`}</span>
        </div>

      </div>
    </div>
  );
};
