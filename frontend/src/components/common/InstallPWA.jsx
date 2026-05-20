import React, { useEffect, useState } from 'react';

import "../../styles/Navbar.css"

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  useEffect(() => {
    // L'événement est peut-être déjà capturé dans main.jsx
    if (window.deferredPrompt) {
      setSupportsPWA(true);
      setPromptInstall(window.deferredPrompt);
      return;
    }

    // Sinon on écoute si ça arrive après le montage
    const handler = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (e) => {
    e.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
    promptInstall.userChoice.then(() => {
      window.deferredPrompt = null; 
      setPromptInstall(null);
      setSupportsPWA(false);
    });
  };

  if (!supportsPWA) return null;

  return (
    <button 
      className="pwa-install-btn" 
      onClick={onClick}
      title="Installer l'application EsatHub"
    >
      Installer
    </button>
  );
};

export default InstallPWA;
