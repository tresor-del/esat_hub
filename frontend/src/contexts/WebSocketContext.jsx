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
   const shouldReconnect = useRef(true);

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

useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    shouldReconnect.current = true;
    loadNotifications();

    // let reconnectTimeout; 

    const createWebSocket = () => {
      if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(`${wsUrl}?token=${token}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.recipient?.id === user?.id) {
                setNotifications(prev => [{ ...data, is_read: false }, ...prev]);
            }
            if (data.type === "new_comment") {
                window.dispatchEvent(new CustomEvent("NEW_COMMENT", { detail: data }));
            }
            if (data.type === "new_post") {
                window.dispatchEvent(new CustomEvent("NEW_POST", { detail: data}))
            }
        };

        ws.onclose = (e) => {
          if (e.code === 1008) {
                console.log("Accès refusé (403), on arrête la reconnexion.");
                shouldReconnect.current = false;
                return;
            }
            // if (shouldReconnect.current) {
            //     setTimeout(createWebSocket, 3000); // ✅ réattache tout automatiquement
            // }
        };
    };

    createWebSocket();

    return () => {
        // shouldReconnect.current = false;
        // clearTimeout(reconnectTimeout); 
        wsRef.current?.close();
    };
}, [user?.id]);

  const markAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const result = await markNotificationsAsRead()
      console.log(result)
    } catch (error) {
      console.log("Erreur: ", error)
    }
  };

  const removeNotifications = (idsToDelete) => {
    setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
  };

  return (
    <WebSocketContext.Provider value={{ notifications, unreadCount, markAsRead, removeNotifications }}>
      {children}
    </WebSocketContext.Provider>
  );
};
