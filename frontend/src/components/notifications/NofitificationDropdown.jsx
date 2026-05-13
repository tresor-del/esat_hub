import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBell } from "react-icons/hi";

import { useNotification } from "../../hooks/useNotification";
import { deleteNotif } from "../../services/api";
import Avatar from "../ui/Avatar";
import DropdownMenu from "../ui/DropdownMenu";
import NotificationActionsMenu from "./NotificationActionsMenu";
import "../../styles/Notifications.css";

/**
 * Regroupe les notifications par type + post,
 * puis trie par date décroissante.
 */
function groupNotifications(notifications) {
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
        ids: [notif.id],
      };
    } else {
      groups[key].count += 1;
      groups[key].ids.push(notif.id);

      if (new Date(notif.created_at) > new Date(groups[key].latest_date)) {
        groups[key].latest_date   = notif.created_at;
        groups[key].latest_author = notif.sender?.username;
        groups[key].latest_sender = notif.sender;
      }
    }
  });

  return Object.values(groups).sort(
    (a, b) => new Date(b.latest_date) - new Date(a.latest_date)
  );
}

/**
 * Construit le texte d'une notification groupée.
 */
function buildNotifText(notif) {
  if (notif.count === 1) return notif.content;
  if (notif.count === 2) return `${notif.latest_author} et 1 autre personne ont commenté votre post`;
  return `${notif.latest_author} et ${notif.count - 1} personnes ont commenté votre post`;
}

/* ─────────────────────────────────────────────── */

const NotificationDropdown = ({ unreadCount }) => {
  const { notifications, markAsRead, removeNotifications } = useNotification();
  const navigate = useNavigate();

  /* Groupes triés */
  const grouped = useMemo(
    () => groupNotifications(notifications),
    [notifications]
  );

  /* Nombre de groupes ayant au moins une notif non lue */
  const badgeCount = useMemo(
    () =>
      grouped.filter((group) =>
        notifications.some((n) => group.ids.includes(n.id) && !n.is_read)
      ).length,
    [grouped, notifications]
  );

  /* Supprimer une ou plusieurs notifications */
  const handleDelete = async (notifIds) => {
    if (!window.confirm("Voulez-vous supprimer cette notification ?")) return;
    try {
      await Promise.all(notifIds.map((id) => deleteNotif(id)));
      removeNotifications(notifIds);
    } catch (error) {
      console.error("Erreur suppression notification :", error);
    }
  };

  /* Naviguer vers le post ciblé */
  const handleClick = (notif) => {
    navigate(`/post/${notif.post_id}?commentId=${notif.comment_id}`);
  };

  /* ── Contenu de la liste ── */
  const ListContent = (
    <div className="notifications-list-wrapper">
      {notifications.length === 0 ? (
        <p className="notifications-empty">Aucune notification pour le moment.</p>
      ) : (
        <ul className="notifications-list">
          {grouped.map((notif) => {
            const key        = `${notif.type}-${notif.post_id}`;
            const isUnread   = notifications.some(
              (n) => notif.ids.includes(n.id) && !n.is_read
            );
            const senderUser = notif.count === 1 ? notif.sender : notif.latest_sender;

            return (
              <li
                key={key}
                className={`notification-item ${isUnread ? "notification-item--unread" : ""}`}
                onClick={() => handleClick(notif)}
              >
                <Avatar user={senderUser} size="medium" />
                <p className="notification-text">{buildNotifText(notif)}</p>

                {/* Empêche le clic sur le menu d'actions de naviguer */}
                <div onClick={(e) => e.stopPropagation()}>j
                  <NotificationActionsMenu
                    notifIds={notif.ids}
                    onDelete={handleDelete}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  /* ── Trigger (icône cloche + badge) ── */
  const BellTrigger = (
    <div
      className="notification-trigger navbar-icon-container"
      onClick={() => badgeCount > 0 && markAsRead()}
    >
      <HiOutlineBell className="navbar-icon" size={30} style={{ opacity: 0.7 }} />
      {badgeCount > 0 && (
        <span className="notification-badge">{badgeCount}</span>
      )}
    </div>
  );

  return (
    <DropdownMenu trigger={BellTrigger} align="right" title="Notifications">
      {ListContent}
    </DropdownMenu>
  );
};

export default NotificationDropdown;