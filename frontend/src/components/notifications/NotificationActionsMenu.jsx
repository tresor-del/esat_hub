import React from "react";
import { FiEdit, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import DropdownMenu from "../ui/DropdownMenu";

const NotificationActionsMenu = ({notifIds, onDelete }) => {

  return (
    <DropdownMenu trigger={<FiMoreVertical />} align="right">
        <div className="notif-menu">
            {onDelete && (
        <button
          className="notif-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notifIds);
          }}
        >
          <FiTrash2 />
          <span>Supprimer</span>
        </button>
      )}
        </div>
      
    </DropdownMenu>
  );
};

export default NotificationActionsMenu;