import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiMessageCircle, FiUser} from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi";

import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import DropdownMenu from "../ui/DropdownMenu";
import UserMenuLinks from "./UserMenuLinks";
import Avatar from "../ui/Avatar";
import "../../styles/UserMenu.css";


/* ─────────────────────────────────────────────────
   UserMenu
   Dropdown affiché dans la navbar desktop.
   ───────────────────────────────────────────────── */

const UserMenu = ({ onAction }) => {
  const { user } = useAuth();
  const isAdmin  = user?.role === "ADMIN";

  return (
    <DropdownMenu
      trigger={<Avatar user={user} openModal={false} data-step="6"  />}
      align="right"
      title="Mon compte"
    >
      <div className="user-menu">
        <UserMenuLinks user={user} isAdmin={isAdmin} onAction={onAction} isDesktop={true} />
      </div>
    </DropdownMenu>
  );
};

export default UserMenu;