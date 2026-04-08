import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notifications.css';
import { useNotification } from '../../hooks/useNotification';
import { formatRelativeDate } from '../../utils/dateFormatter';

const Notifications = () => {
  const { notifications, markAsRead } = useNotification();

  useEffect(() => {
    markAsRead();
  }, [])

  const navigate = useNavigate();

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
                <span className="notification-time">{formatRelativeDate(notif.created_at)}</span>
              </div>
              <div className="notification-content">
                <p>{notif.content}"</p>
                {notif.post_id && (
                  <button className='notification-button' onClick={() => navigate(`/post/${notif.post_id}?commentId=${notif.comment_id}`)}>
                    Voir
                  </button>
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