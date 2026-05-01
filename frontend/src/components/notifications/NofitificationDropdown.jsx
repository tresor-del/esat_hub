import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBell } from 'react-icons/hi';
import { FiX, FiMenu } from 'react-icons/fi';

import { useNotification } from '../../hooks/useNotification';
import Avatar from '../../components/ui/Avatar';
import { deleteNotif } from '../../services/api';
import DropdownMenu from '../ui/DropdownMenu';
import NotificationActionsMenu from './NotificationActionsMenu';
import '../../styles/Notifications.css';
import '../../styles/Navbar.css'
import '../../styles/UserMenu.css'

const NotificationDropdown = ({ unreadCount }) => {

  const { notifications, markAsRead, removeNotifications } = useNotification();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleOpenMobile = () => {
    if (badgeCount > 0) markAsRead();
    setIsMobileOpen(true);
  };

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

  const badgeCount = useMemo(() => {
    return sortedNotifications.filter(group =>
      notifications.some(n => group.ids.includes(n.id) && !n.is_read)
    ).length;
  }, [sortedNotifications, notifications])

  const handleDeleteNotif = async (notifIds) => {
    if (window.confirm("voulez vous supprimer cette notification ?")) {
      try {
        await Promise.all(notifIds.map(id => deleteNotif(id)))
        removeNotifications(notifIds);
      } catch (error) {
        console.log(error)
      }
    }

  }

  const Content = (
        <div className="notifications-container-content">
      <div className="notifications-mobile-header">
        <h4>Notifications</h4>
        <button className="close-notif-btn" onClick={() => setIsMobileOpen(false)}>
          <FiX />
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="no-notifications">Aucune notification pour le moment.</p>
      ) : (
        <div className="notifications-list">
          {sortedNotifications.map((notif) => {
            const groupKey = `${notif.type}-${notif.post_id}`
            const isGroupUnread = notifications.some(n => notif.ids.includes(n.id) && !n.is_read);
            return (
              <div key={groupKey} className={`notification-item ${isGroupUnread ? 'unread' : ''}`} 
                   onClick={() => { navigate(`/post/${notif.post_id}?commentId=${notif.comment_id}`); setIsMobileOpen(false); }}>
                <div className="notification-content">
                  <Avatar user={notif.count === 1 ? notif.sender : notif.latest_sender} size='small' />
                  <p>
                    {notif.count === 1 ? notif.content : 
                     notif.count === 2 ? `${notif.latest_author} et 1 autre personne ont commenté votre post` :
                     `${notif.latest_author} et ${notif.count - 1} personnes ont commenté votre post`}
                  </p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <NotificationActionsMenu notifIds={notif.ids} onDelete={handleDeleteNotif} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
{/* VERSION MOBILE : Intégrée à la liste des boutons */}
<div className="notification-mobile-wrapper">
  <div className="notification-trigger-mobile" onClick={handleOpenMobile}>
    <button className="user-profile-btn mobile-notification-btn">
      <div className="icon-with-badge">
        <HiOutlineBell />
        {badgeCount > 0 && <span className="notification-badge">{badgeCount}</span>}
      </div>
      Notifications
    </button>
  </div>
  
  {isMobileOpen && (
    <div className="notifications-full-page">
      {Content}
    </div>
  )}
</div>

      {/* VERSION DESKTOP : Dropdown classique */}
      <div className="notification-desktop-wrapper">
        <DropdownMenu trigger={
          <div className="notification-trigger" onClick={() => badgeCount > 0 && markAsRead()}>
            <HiOutlineBell className="navbar-icon" />
            {badgeCount > 0 && <span className="notification-badge">{badgeCount}</span>}
          </div>
        } align="right">
          {Content}
        </DropdownMenu>
      </div>
    </>
    // <DropdownMenu trigger={
    //   <div className="notification-trigger"
    //     onClick={() => {
    //       if (badgeCount > 0) markAsRead(); // On ne l'appelle que s'il y a du contenu non lu
    //     }}
    //   >
    //     <HiOutlineBell className="navbar-icon" />
    //     {/* 4. Affichage du badge si > 0 */}
    //     {badgeCount > 0 && <span className="notification-badge">{badgeCount}</span>}
    //   </div>
    // } align="right">
    //     <h4>Notifications</h4>
    //   <hr />
    //   {notifications.length === 0 ? (
    //     <p className="no-notifications">Aucune notification pour le moment.</p>
    //   ) : (
    //     <div className="notifications-list">
    //       {sortedNotifications.map((notif) => {
    //         const isGroupUnread = notifications.some(n => notif.ids.includes(n.id) && !n.is_read);
    //         return (

    //         <div key={notif.id} className={`notification-item ${isGroupUnread ? 'unread' : ''}`} onClick={() => navigate(`/post/${notif.post_id}?commentId=${notif.comment_id}`)}>
    //           {/* <div className="notification-header"> 
    //             <span className="notification-time">{formatRelativeDate(notif.latest_date)}</span>
    //           </div> */}
    //           <div className="notification-content">

    //             {notif.count === 1 ?
    //               (<Avatar user={notif.sender} size='small' />) : <Avatar user={notif.latest_sender} size='small' />
    //             }

    //             <p>
    //               {notif.count === 1 && notif.content}

    //               {notif.count === 2
    //                 && `${notif.latest_author} et 1 autre personne ont commenté votre post`}

    //               {notif.count > 2
    //                 && `${notif.latest_author} et ${notif.count - 1} personnes ont commenté votre post `}
    //             </p>

    //           </div >
    //           <div onClick={(e) => e.stopPropagation()}>
    //             <NotificationActionsMenu notifIds={notif.ids} onDelete={handleDeleteNotif} />
    //           </div>
    //           {/* <div className="btns">
    //             <button className='notification-button-delete' onClick={() => handleDeleteNotif(notif.ids)}>
    //               Supprimer
    //             </button>
    //           </div> */}
    //         </div>
    //         )
    //       })}
    //     </div>
    //   )}
    // </DropdownMenu>
  );
};

export default NotificationDropdown;