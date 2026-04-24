import React from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import DropdownMenu from "../ui/DropdownMenu";
import { HiOutlineHome } from "react-icons/hi";
import Avatar from "../ui/Avatar";
import "../../styles/UserMenu.css"

const UserMenu = (closeMenu) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  return (
    <DropdownMenu trigger={<Avatar user={user} openModal={false} />} align="right">
      <div className="user-menu">
        <button
          className="user-profile-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${user.id}`);
            if (closeMenu) closeMenu();
          }}
        >
          <FiUser />
          Profile
        </button>

        <button
          className="user-profile-btn"
          onClick={() => navigate("/room")}
        >

          <HiOutlineHome />
          Room
        </button>

        <button
          className="user-logout-btn"
          onClick={(e) => {
            e.stopPropagation();
            logout();
          }}
        >
          <FiLogOut />
          Logout
        </button>
      </div>

    </DropdownMenu>
  );
};

export default UserMenu;