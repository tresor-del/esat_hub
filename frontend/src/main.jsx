/**
 * Point d'entrée de l'application React
 * Initialise et monte l'application dans le DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Créer le root et monter l'application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);