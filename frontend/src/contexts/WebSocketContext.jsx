import axios from "axios";
import { API_BASE_URL } from "../utils/axiosConfig";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getNotifications, markNotificationsAsRead, markNotificationAsRead } from '../services/api';
import { getUnreadMsgTotal } from '../services/chatApi';
import { sendSystemNotification } from "../services/notificationService";
import { Preferences } from "@capacitor/preferences";

const getToken = async (key) => {
  const { value } = await Preferences.get({ key });
  return value;
};

const wsUrl = import.meta.env.VITE_WS_BASE_URL;

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const shouldReconnect = useRef(true);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const unreadCount = notifications.filter(n => n.is_read === false).length;
  const activeConvRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const result = await getNotifications();
      if (result?.notifications) {
        setNotifications(prev => {
          // console.log("notifications avant merge:", prev.map(n => n.id));
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

  const createWebSocketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const token = await getToken("access_token");
      if (!token) return;

      if (window.AppInventor && user?.id) {
        console.log("Transmission de l'UUID de l'utilisateur à Kodular :", user.id);
        window.AppInventor.setWebViewString(String(user.id));
      }

      shouldReconnect.current = true;

      const createWebSocket = (wsToken) => {
        // ── SÉCURITÉ : Si un socket est déjà OUVERT ou en cours de CONNEXION, on ne fait rien
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
          console.log("WebSocket déjà actif ou en cours de connexion. Annulation.");
          return;
        }

        if (wsRef.current) wsRef.current.close();

        // On garde l'URL globale d'origine
        const ws = new WebSocket(`${wsUrl}?token=${wsToken}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          // 1. GESTION DU CHAT
          if (data.from === "chat") {
            const interlocutorId = data.sender.id === user.id ? data.recipient_id : data.sender.id;

            setMessages(prev => ({
              ...prev,
              [interlocutorId]: [...(prev[interlocutorId] || []), data]
            }));

            const isIncoming = data.sender.id !== user.id;
            if (isIncoming) {

              const isReadingThisConv = activeConvRef.current === data.sender.id;
              if (!isReadingThisConv) {
                setUnreadChatsCount(prev => prev + 1);

                // sendSystemNotification({
                //   type: "SHOW_WS_NOTIFICATION",
                //   title: data.sender.first_name,
                //   body: data.content || "Vous avez reçu un message.",
                //   url: `/chat?user=${data.sender.id}`,
                //   icon: data.sender?.avatar_path,
                // });
              }


            }

            window.dispatchEvent(new CustomEvent("CHAT_UPDATED", {
              detail: { ...data, isIncoming }
            }));

            return; // On stoppe ici pour le cas du chat
          }

          // GESTION DES NOTIFICATIONS GLOBALES / ÉVÉNEMENTS
          if (data.recipient?.id === user?.id) {
            setNotifications(prev => {
              if (prev.some(n => n.id === data.id)) return prev;
              return [{ ...data, is_read: false }, ...prev];
            });

            // Appel sécurisé pour les alertes globales

            // sendSystemNotification({
            //   type: "SHOW_WS_NOTIFICATION",
            //   title: data.title || "None",
            //   body: data.content || "Il y a du nouveau sur votre compte.",
            //   url: "/"
            // });


          }


          // GESTION DES ACTIONS SPÉCIFIQUES

          if (data.event === "NEW_ATTENDANCE") {
            window.dispatchEvent(new CustomEvent("NEW_ATTENDANCE", { detail: data }));
            return;
          }

          if (data.type === "new_comment") {

            // sendSystemNotification({
            //   type: "SHOW_WS_NOTIFICATION",
            //   title: "Nouveau Commentaire",
            //   body: data.content || "Il y a du nouveau sur votre compte.",
            //   url: `/post/${data.post_id}?commentId=${data.comment_id}`
            // });

            window.dispatchEvent(new CustomEvent("NEW_COMMENT", { detail: data }));
            return
          }

          if (data.type === "new_post") {

            // sendSystemNotification({
            //   type: "SHOW_WS_NOTIFICATION",
            //   title: "Nouvelle publication",
            //   body: data.content || "Il y a du nouveau sur votre compte.",
            //   url: `/post/${data.post_id}`
            // });

            window.dispatchEvent(new CustomEvent("NEW_POST", { detail: data }));
            return
          }
        };


        ws.onclose = (e) => {
          if (e.code === 1008) {
            console.log("Accès refusé (403), on arrête la reconnexion.");
            shouldReconnect.current = false;
            return;
          }

          // Reconnexion automatique après 3 secondes
          if (shouldReconnect.current) {
            setTimeout(async () => {
              const token = await getToken("access_token");
              if (token && createWebSocketRef.current) {
                console.log("🔄 Reconnexion WebSocket...");
                createWebSocketRef.current(token);
              }
            }, 3000);
          }
        };

      };

      // Stocke createWebSocket dans le ref pour y accéder ailleurs
      createWebSocketRef.current = createWebSocket;

      loadNotifications();
      loadInitialUnread();
      createWebSocket(token);

      return () => {
        shouldReconnect.current = false;
        clearTimeout(reconnectTimeout.current);
        wsRef.current?.close();
      };
    };
    init();

  }, [user?.id]);

  // Écoute TOKEN_REFRESHED quand une requete http déclenche le refresh token
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      const newToken = event.detail.token;
      if (createWebSocketRef.current) {
        createWebSocketRef.current(newToken);
      }
    };
    window.addEventListener("TOKEN_REFRESHED", handleTokenRefresh);
    return () => window.removeEventListener("TOKEN_REFRESHED", handleTokenRefresh);
  }, []);

  const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const upsertMessage = (recipientId, message) => {
    setMessages(prev => {
      const list = prev[recipientId] || [];
      const index = list.findIndex(m => m.local_id === message.local_id);
      if (index >= 0) {
        const updatedList = [...list];
        updatedList[index] = { ...updatedList[index], ...message };
        return { ...prev, [recipientId]: updatedList };
      }
      return { ...prev, [recipientId]: [...list, message] };
    });
  };

  const sendMessage = async (recipientId, content, mediaId, localId = null, metadata = {}) => {
    const messageId = localId || generateLocalId();
    const timestamp = new Date().toISOString();
    const pendingMessage = {
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      timestamp,
      status: 'sending',
      local_id: messageId,
      ...metadata,
    };

    upsertMessage(recipientId, pendingMessage);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        recipient_id: recipientId,
        message: content,
        media_id: mediaId,
        local_id: messageId,
      };

      try {
        wsRef.current.send(JSON.stringify(payload));
        upsertMessage(recipientId, { local_id: messageId, status: 'sent' });
        return { success: true, local_id: messageId };
      } catch (error) {
        console.error('Erreur envoi WS:', error);
        upsertMessage(recipientId, { local_id: messageId, status: 'failed', error: 'send_error' });
        return { success: false, error, local_id: messageId };
      }
    }

    console.warn('WebSocket non connecté, message non envoyé');
    upsertMessage(recipientId, { local_id: messageId, status: 'failed', error: 'ws_closed' });
    return { success: false, error: 'WebSocket non connecté', local_id: messageId };
  };

  const markAsRead = async (id) => {

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );

    try {
      const result = await markNotificationAsRead(id);
      console.log(result);
    } catch (error) {
      console.log("Erreur: ", error);
    }

  };

  const removeNotifications = (idsToDelete) => {
    setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
  };


  // Ping périodique pour garder le ws en vie 
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      // Vérifie si le token va bientôt expirer
      const token = await getToken("access_token");
      if (!token) return;

      const { exp } = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = exp * 1000 - Date.now();

      // Si moins de 5 minutes restantes, refresh proactif
      if (expiresIn < 5 * 60 * 1000) {
        try {
          const refreshToken = await getToken("refresh_token");
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          await Preferences.set({ key: "access_token", value: res.data.access_token });
          await Preferences.set({ key: "refresh_token", value: res.data.refresh_token });
          // TOKEN_REFRESHED va reconnecter le WS automatiquement
          window.dispatchEvent(new CustomEvent("TOKEN_REFRESHED", {
            detail: { token: res.data.access_token }
          }));
        } catch (e) {
          window.dispatchEvent(new CustomEvent("app:logout", { detail: { reason: "unauthorized" } }));
        }
      }
    }, 5 * 60 * 1000); // vérifie toutes les minutes

    return () => clearInterval(interval);
  }, [user]);


  return (
    <WebSocketContext.Provider value={{
      notifications,
      messages,
      sendMessage,
      upsertMessage,
      unreadCount,
      markAsRead,
      removeNotifications,
      unreadChatsCount,
      setUnreadChatsCount,
      refreshUnreadCount,
      activeConvRef
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
