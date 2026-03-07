export const playNotificationSound = () => {
  // Initialise le contexte audio
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Configuration d'un son "Ding" clair et professionnel
  oscillator.type = 'sine'; // Onde sinusoïdale pour un son pur
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Fréquence de départ
  oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);

  // Gestion du volume (Fade in / Fade out très rapide pour éviter les "clics")
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01); 
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  // Joue le son pendant 0.3 secondes
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.3);
};
