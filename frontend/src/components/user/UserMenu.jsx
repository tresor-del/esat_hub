import React from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiSettings, FiInbox } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import DropdownMenu from "../ui/DropdownMenu";
import { HiOutlineHome } from "react-icons/hi";
import { useWebSocket } from "../../contexts/WebSocketContext";
import Avatar from "../ui/Avatar";
import "../../styles/UserMenu.css"

export const UserMenuLinks = ({ user, isAdmin, onAction }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { unreadCount, unreadChatsCount } = useWebSocket();

  const handleNavigate = (path) => {
    navigate(path);
    if (onAction) onAction();
  };

  return (
    <>
      <button className="user-profile-btn" onClick={() => handleNavigate(`/profile/${user.id}`)}>
        <FiUser /> Profile
      </button>
      <button className="user-profile-btn" onClick={() => handleNavigate("/room")}>
        <HiOutlineHome /> Room
      </button>
      <button className="user-profile-btn" onClick={() => handleNavigate("/chat")}>
        <FiInbox /> Inbox
        {unreadChatsCount > 0 && (
            <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-8px',
                background: '#e53e3e',
                color: 'white',
                borderRadius: '50%',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: 'bold'
            }}>
                {unreadChatsCount}
            </span>
        )}
      </button>
      {isAdmin && (
        <button className="user-profile-btn" onClick={() => handleNavigate("/admin")}>
          <FiSettings /> Admin
        </button>
      )}
      <button className="user-logout-btn" onClick={() => { logout(); if (onAction) onAction(); }}>
        <FiLogOut /> Logout
      </button>
    </>
  );
};

const UserMenu = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="user-menu-desktop-only">
      <DropdownMenu trigger={<Avatar user={user} openModal={false} />} align="right">
        <div className="user-menu">
          <UserMenuLinks user={user} isAdmin={isAdmin} />
        </div>
      </DropdownMenu>
    </div>
  );
};
export default UserMenu;