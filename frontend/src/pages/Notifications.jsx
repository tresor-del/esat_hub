import React, { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import '../styles/Notifications.css';

const Notifications = () => {
  const { notifications, markAsRead } = useWebSocket();

  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  return (
    <div className="notifications-page">
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p className="no-notifications">Aucune notification pour le moment.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif, index) => (
            <div key={index} className="notification-item">
              <div className="notification-header">
                <span className="notification-type">{notif.type === 'new_comment' ? 'Nouveau commentaire' : notif.type}</span>
                <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
              </div>
              <div className="notification-content">
                {notif.type === 'new_comment' ? (
                  <p><strong>{notif.author}</strong> a commenté votre post : "{notif.content}"</p>
                ) : (
                  <p>{notif.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;