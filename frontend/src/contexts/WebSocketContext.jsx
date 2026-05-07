import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getNotifications, markNotificationsAsRead } from '../services/api';
import { getUnreadMsgTotal } from '../services/chatApi';

const wsUrl = import.meta.env.VITE_WS_BASE_URL;

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState({});
  const wsRef = useRef(null);
  const shouldReconnect = useRef(true);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const unreadCount = notifications.filter(n => n.is_read === false).length;

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

  const loadInitialUnread = async () => {
    const res = await getUnreadMsgTotal();
    setUnreadChatsCount(res.total);
  };

  const refreshUnreadCount = async () => {
    try {
        const res = await getUnreadMsgTotal();
        setUnreadChatsCount(res.total);
    } catch (e) {
        console.error("Erreur refresh count", e);
    }
};

  useEffect(() => {
    if (user) {
      loadInitialUnread();
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    shouldReconnect.current = true;
    loadNotifications();

    const createWebSocket = () => {
      if (wsRef.current) wsRef.current.close();

      // On garde l'URL globale d'origine
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // 1. GESTION DU CHAT
        // Si les données reçues ont un sender_id, c'est un message de chat
        if (data.sender_id) {

          const interlocutorId = data.sender_id === user.id ? data.recipient_id : data.sender_id

          setMessages(prev => ({
            ...prev,
            [interlocutorId]: [...(prev[interlocutorId] || []), data]
          }));

          if (data.sender_id && data.sender_id !== user.id) {
            setUnreadChatsCount(prev => prev + 1);
          }

          return; // On stoppe ici pour ce message
        }

        // 2. GESTION DES NOTIFICATIONS
        if (data.recipient?.id === user?.id) {
          setNotifications(prev => [{ ...data, is_read: false }, ...prev]);
        }
        if (data.type === "new_comment") {
          window.dispatchEvent(new CustomEvent("NEW_COMMENT", { detail: data }));
        }
        if (data.type === "new_post") {
          window.dispatchEvent(new CustomEvent("NEW_POST", { detail: data }));
        }

      };

      ws.onclose = (e) => {
        if (e.code === 1008) {
          console.log("Accès refusé (403), on arrête la reconnexion.");
          shouldReconnect.current = false;
          return;
        }
      };
    };

    createWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [user?.id]);

  // FONCTION POUR ENVOYER UN MESSAGE DE CHAT
  const sendMessage = (recipientId, content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        recipient_id: recipientId,
        message: content
      };

      // On l'envoie au serveur via le socket unique
      wsRef.current.send(JSON.stringify(payload));

      // On l'ajoute à notre affichage local
      const myMsg = {
        sender_id: user.id,
        recipient_id: recipientId,
        content: content,
        timestamp: new Date().toISOString()
      };

      // On stocke notre propre message dans la boîte dédiée à ce destinataire
      setMessages(prev => ({
        ...prev,
        [recipientId]: [...(prev[recipientId] || []), myMsg]
      }));
    }
  };

  const markAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const result = await markNotificationsAsRead();
      console.log(result);
    } catch (error) {
      console.log("Erreur: ", error);
    }
  };

  const removeNotifications = (idsToDelete) => {
    setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
  };



  return (
    <WebSocketContext.Provider value={{
      notifications,
      messages,
      sendMessage,
      unreadCount,
      markAsRead,
      removeNotifications,
      unreadChatsCount,
      refreshUnreadCount
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
