import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Additional layer of protection for the 'fetch' property error
(function() {
  try {
    const win = window as any;
    const nativeFetch = win.fetch;
    const desc = Object.getOwnPropertyDescriptor(win, 'fetch');
    if (desc && desc.configurable === false) return;

    Object.defineProperty(win, 'fetch', {
      get: () => nativeFetch,
      set: () => { console.warn('BARAKA LOGISTIQUE: Blocked fetch overwrite in bundle.'); },
      configurable: true,
      enumerable: true
    });
  } catch (e) {}
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
