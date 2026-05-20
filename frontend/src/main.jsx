import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ── REGISTRE MANUEL ET STRICT POUR VOTRE MANIFESTE PERSONNALISÉ ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';

    navigator.serviceWorker.register(swUrl, { type: 'module' })
      .then((registration) => {
        console.log('Service Worker EsatHub enregistré avec succès:', registration);

        // Force la vérification d'une mise à jour auprès du serveur
        registration.update();

        // Détecte si un nouveau Service Worker est en train d'arriver
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // Dès que le nouveau code est installé et prêt (en attente d'activation)
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nouvelle version prête en arrière-plan.');
                // On déclenche un événement global pour React
                window.dispatchEvent(new Event('swUpdateAvailable'));
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}

window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  console.log("✅ PWA prête à être installée !");
});

// Créer le root et monter l'application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
);
