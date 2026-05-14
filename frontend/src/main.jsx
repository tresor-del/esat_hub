import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ── REGISTRE MANUEL ET STRICT POUR VOTRE MANIFESTE PERSONNALISÉ ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vite compile sous dev-sw.js en développement mais garde votre code si injectManifest est actif
    const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';

    navigator.serviceWorker.register(swUrl, { type: 'module' })
      .then((registration) => {
        console.log('Service Worker EsatHub enregistré avec succès:', registration);
      })
      .catch((error) => {
        console.error('Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}

// Créer le root et monter l'application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
);
