import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Notifications.css';
import { useNotification } from '../../hooks/useNotification';
import { formatRelativeDate } from '../../utils/dateFormatter';
import Avatar from '../../components/ui/Avatar';
import { deleteNotif } from '../../services/api';

const Notifications = () => {
  const { notifications, markAsRead } = useNotification();

  useEffect(() => {
    markAsRead();
  }, [])

  const sortedNotifications = useMemo(() => {
    const groups = {};

    notifications.forEach((notif) => {
      const key = `${notif.type}-${notif.post_id}`;

      if (!groups[key]) {
        groups[key] = {
          ...notif,
          count: 1,
          latest_date: notif.created_at,
          latest_author: notif.sender?.username,
          latest_sender: notif.sender,
          ids: [notif.id]
        };
      } else {
        groups[key].count += 1;
        groups[key].ids.push(notif.id);
        if (new Date(notif.created_at) > new Date(groups[key].latest_date)) {
          groups[key].latest_date = notif.created_at;
          groups[key].latest_author = notif.sender?.username;
          groups[key].latest_sender = notif.sender;
        }
      }
    })
    return Object.values(groups).sort((a, b) =>
      new Date(b.latest_date) - new Date(a.latest_date)
    );
  }, [notifications])

  const navigate = useNavigate();

  const handleDeleteNotif = async (notifIds) => {
    if (window.confirm("voulez vous supprimer cette notification ?")) {
      try {
        await Promise.all(notifIds.map(id => deleteNotif(id)))
        alert("Notification éffacer")
      } catch (error) {
        console.log(error)
      }
    }

  }
  return (
    <div className="notifications-page">
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p className="no-notifications">Aucune notification pour le moment.</p>
      ) : (
        <div className="notifications-list">
          {sortedNotifications.map((notif) => (
            <div key={notif.id} className="notification-item">
              <div className="notification-header">
                <span className="notification-type">{notif.type === 'new_comment' ? 'Nouveau commentaire' : notif.type}</span>
                <span className="notification-time">{formatRelativeDate(notif.latest_date)}</span>
              </div>
              <div className="notification-content">

                {notif.count === 1 ?
                  (<Avatar user={notif.sender} size='small' />) : <Avatar user={notif.latest_sender} size='small' />
                }

                <p>
                  {notif.count === 1 && notif.content}

                  {notif.count === 2
                    && `${notif.latest_author} et 1 autre personne ont commenté votre post`}

                  {notif.count > 2
                    && `${notif.latest_author} et ${notif.count - 1} personnes ont commenté votre post `}
                </p>

              </div>
              <div className="btns">
                {notif.post_id && (
                  <button className='notification-button' onClick={() => navigate(`/post/${notif.post_id}?commentId=${notif.comment_id}`)}>
                    Voir
                  </button>
                )}
                <button className='notification-button-delete' onClick={() => handleDeleteNotif(notif.ids)}>
                  Supprimer
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;