import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiMessageCircle, FiUser } from "react-icons/fi";
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
                <FiLogOut /> Logout
            </button>
        </>
    );
};

export default UserMenuLinks;