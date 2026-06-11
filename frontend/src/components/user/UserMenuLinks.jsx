import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiMessageCircle, FiUser } from "react-icons/fi";
import { HiOutlineHome } from "react-icons/hi";

import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import DropdownMenu from "../ui/DropdownMenu";
import Avatar from "../ui/Avatar";
import "../../styles/Users/UserMenu.css";

export const UserMenuLinks = ({ user, isAdmin, onAction, isDesktop = false }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const go = (path) => {
        navigate(path);
        onAction?.();
    };

    return (
        <>

            {isDesktop && (

                <button onClick={() => go(`profile/${user.id}`)}>
                    <FiUser /> Profile
                </button>
            )}
            <button className="user-menu-btn" onClick={() => go("/room")}>
                <HiOutlineHome /> {isDesktop ? "Room" : "Aller dans la salle" }
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
                <FiLogOut /> {isDesktop ? "Logout" : "Se déconnecter" }
            </button>
        </>
    );
};

export default UserMenuLinks;