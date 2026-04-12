import React from "react";
import { useWebSocket } from "../contexts/WebSocketContext";


export const useNotification = () => {
  const { notifications, unreadCount, markAsRead, removeNotifications} = useWebSocket();
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    removeNotifications
  };
};
