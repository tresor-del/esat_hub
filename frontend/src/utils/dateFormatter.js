import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  return formatDistanceToNow(new Date(date), { 
    locale: fr 
  });
};

export const formatChatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // On remet les heures à zéro pour comparer uniquement les jours
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const oneWeekAgo = new Date(startOfToday);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

  if (date >= startOfToday) {
    return "Aujourd'hui";
  } else if (date >= startOfYesterday) {
    return "Hier";
  } else if (date >= oneWeekAgo) {
    // Affiche le nom du jour (ex: "Lundi")
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
  } else {
    // Affiche la date complète (ex: "12/05/2024")
    return new Intl.DateTimeFormat('fr-FR').format(date);
  }
};

