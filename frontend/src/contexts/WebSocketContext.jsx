import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const wsUrl = import.meta.env.VITE_WS_BASE_URL;

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return;

    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => alert('WebSocket connecté');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Notification reçue:', data);
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    ws.onclose = () => console.log('WebSocket déconnecté');
    ws.onerror = (error) => console.error('Erreur WebSocket:', error);

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    };
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <WebSocketContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </WebSocketContext.Provider>
  );
};