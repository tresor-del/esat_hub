import React, { useState, useEffect } from 'react';

export const Countdown = ({ dueDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(dueDate) - +new Date();
      
      // Si la date est dépassée
      if (difference <= 0) {
        setTimeLeft("Temps écoulé !");
        return;
      }

      // Calcul des jours, heures, minutes et secondes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      // Formatage du texte (ex: 2j 05h 12m 09s ou simplement 05h 12m 09s s'il reste moins d'un jour)
      const daysStr = days > 0 ? `${days}j ` : '';
      const hoursStr = `${hours.toString().padStart(2, '0')}:`;
      const minutesStr = `${minutes.toString().padStart(2, '0')}:`;
      const secondsStr = `${seconds.toString().padStart(2, '0')}`;

      setTimeLeft(`${daysStr}${hoursStr}${minutesStr}${secondsStr}`);
    };

    // Calculer immédiatement au montage
    calculateTimeLeft();

    // Mettre à jour toutes les secondes
    const timer = setInterval(calculateTimeLeft, 1000);

    // Nettoyer le timer si le composant est démonté
    return () => clearInterval(timer);
  }, [dueDate]);

  return <span className="countdown-timer">{timeLeft}</span>;
};
