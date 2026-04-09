import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getNotifications, markNotificationsAsRead } from '../services/api';

const wsUrl = import.meta.env.VITE_WS_BASE_URL;

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  // 1. Calcul du compteur (Badge)
  const unreadCount = notifications.filter(n => n.is_read === false).length;

  // 2. Fonction pour charger l'historique depuis la DB
  const loadNotifications = async () => {
    try {
      const result = await getNotifications();
      if (result?.notifications) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueFromDb = result.notifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...uniqueFromDb];
        });
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    }
  };

  // 3. Gestion du WebSocket et du chargement initial
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // On charge la DB dès qu'on a le token
    loadNotifications();

    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // On s'assure que le message temps réel est marqué non lu
      console.log("message du ws: ", data)
      setNotifications(prev => [{ ...data, is_read: false }, ...prev]);
    };

    return () => wsRef.current?.close();
  }, [user]); // Se relance à la connexion/déconnexion

  const markAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const result = await markNotificationsAsRead()
      console.log(result)
    } catch (error) {
      console.log("Erreur: ", error)
    }
  };

  return (
    <WebSocketContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </WebSocketContext.Provider>
  );
};
