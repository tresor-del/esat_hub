import React, { useState, useEffect } from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css'; // Import des styles de base

const UserTour = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // On vérifie si l'utilisateur a déjà vu le guide pour ne pas l'embêter à chaque connexion
    const hasSeenTour = localStorage.getItem('esathub_tour_seen');
    if (!hasSeenTour) {
      setEnabled(true);
    }
  }, []);

  const onExit = () => {
    setEnabled(false);
    localStorage.setItem('esathub_tour_seen', 'true'); // Enregistre qu'il a vu le guide
  };

  return (
    <Steps
      enabled={enabled}
      steps={[
        {
          element: '[data-step="1"]',
          intro: 'Bienvenue sur EsatHub ! Cliquez ici pour installer l\'application sur votre écran d\'accueil.',
          position: 'bottom',
        },
        {
          element: '[data-step="2"]',
          intro: 'Voici le lecteur interactif. Vous pouvez tourner les pages en un clic.',
          position: 'top',
        }
      ]}
      initialStep={0}
      onExit={onExit}
      options={{
        nextLabel: 'Suivant ▶',
        prevLabel: '◀ Précédent',
        doneLabel: 'J\'ai compris ! 🎉',
        showBullets: true,
        exitOnOverlayClick: false, // Force à suivre le guide ou cliquer sur la croix
      }}
    />
  );
};

export default UserTour;
