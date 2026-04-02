import React from "react";
import { useWebSocket } from "../contexts/WebSocketContext";


export const useNotification = () => {
  const { notifications, unreadCount, markAsRead } = useWebSocket();
  
  return {
    notifications,
    unreadCount,
    markAsRead
  };
};
