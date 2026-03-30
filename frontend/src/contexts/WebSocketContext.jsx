import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1/ws`;
const wsUrl = import.meta.env.VITE_WS_BASE_URL || defaultWsUrl;
const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);



  useEffect(() => {
    if (!user?.id) return;

    const ws = new WebSocket(`${wsUrl}?user_id=${user.id}`);
    wsRef.current = ws;

    ws.onopen = () => console.log('WebSocket connecté');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Notification reçue:', data);
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    ws.onclose = () => console.log('WebSocket déconnecté');
    ws.onerror = (error) => console.error('Erreur WebSocket:', error);

    return () => {
      ws.close();
    };
  }, [user?.id]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <WebSocketContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </WebSocketContext.Provider>
  );
};