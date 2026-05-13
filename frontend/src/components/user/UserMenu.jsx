import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiMessageCircle } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi";

import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import DropdownMenu from "../ui/DropdownMenu";
import Avatar from "../ui/Avatar";
import "../../styles/UserMenu.css";

/* ─────────────────────────────────────────────────
   UserMenuLinks
   Liste des actions utilisateur (réutilisable dans
   le drawer mobile ou le dropdown desktop).

   Props :
     user     – objet utilisateur courant
     isAdmin  – booléen
     onAction – callback appelé après chaque action
                (ex. fermer le drawer)
   ───────────────────────────────────────────────── */

export const UserMenuLinks = ({ user, isAdmin, onAction }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onAction?.();
  };

  return (
    <>
      <button onClick={() => go("/room")}>
        <HiOutlineHome /> Room
      </button>

      {isAdmin && (
        <button onClick={() => go("/admin")}>
          <FiSettings /> Admin
        </button>
      )}

      <button
        className="user-logout-btn"
        onClick={() => { logout(); onAction?.(); }}
      >
        <FiLogOut /> Se déconnecter
      </button>
    </>
  );
};

/* ─────────────────────────────────────────────────
   UserMenu
   Dropdown affiché dans la navbar desktop.
   ───────────────────────────────────────────────── */

const UserMenu = ({ onAction }) => {
  const { user } = useAuth();
  const isAdmin  = user?.role === "ADMIN";

  return (
    <DropdownMenu
      trigger={<Avatar user={user} openModal={false} />}
      align="right"
      title="Mon compte"
    >
      <div className="user-menu">
        <UserMenuLinks user={user} isAdmin={isAdmin} onAction={onAction} />
      </div>
    </DropdownMenu>
  );
};

export default UserMenu;