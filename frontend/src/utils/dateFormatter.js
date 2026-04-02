import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, // Ajoute le "il y a"
    locale: fr       // Force le français
  });
};
