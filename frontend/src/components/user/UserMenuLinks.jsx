import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiUser, FiInfo, FiFileText, FiLock } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Users/UserMenu.css";
import Avatar from "../ui/Avatar";

export const UserMenuLinks = ({ user, isAdmin, onAction, isDesktop = false }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onAction?.();
  };

  return (
    <div className="um-menu">
      {/* En-tête utilisateur */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", padding: "10px" }}>
          <Avatar user={user} />
          <div className="um-header">
            <p className="um-name">{user.first_name} {user.last_name}</p>
            <p className="um-role">{isAdmin ? "Administrateur" : "Étudiant"}</p>
          </div>
        </div>
      )}

      <div className="um-section">
        <button className="um-item" onClick={() => go(`/profile/${user.id}`)}>
          <span className="um-icon"><FiUser /></span>
          <span>Mon profil</span>
        </button>

        <div className="um-divider" />

        <button onClick={() => go(`/bout}`)} className="footer-link">
          <span className="um-icon"><FiInfo /></span>
          <span>À propos d'Esathub</span>
        </button>
        <button onClick={() => go(`/privacy}`)} className="footer-link">
          <span className="um-icon"><FiFileText /></span>
          Confidentialité
        </button>
        <button onClick={() => go(`/terms}`)} className="footer-link">
          <span className="um-icon"><FiLock /></span>
          Condition d'utilisation
        </button>


        {isAdmin && (
          <button className="um-item" onClick={() => go("/admin")}>
            <span className="um-icon"><FiSettings /></span>
            <span>Administration</span>
          </button>
        )}
      </div>

      <div className="um-divider" />

      <div className="um-section">
        <button
          className="um-item um-item--danger"
          onClick={() => { logout(); onAction?.(); }}
        >
          <span className="um-icon"><FiLogOut /></span>
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenuLinks;