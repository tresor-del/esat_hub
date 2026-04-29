import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import UserMenu from "../user/UserMenu";
import NotificationDropdown from "../notifications/NofitificationDropdown";
import SearchDropdown from "../search/SearchDropdown";
import { FiSettings, FiMenu, FiX } from "react-icons/fi";
import InstallPWA from "./InstallPWA";
import { UserMenuLinks } from "../user/UserMenu";
import "../../styles/Navbar.css"

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const { unreadCount } = useWebSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const navigate = useNavigate();
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo et nom de l'application */}
        <Link to="/" className="navbar-logo">
          <span className="full-logo">Esat-Hub</span>
          <span className="short-logo">EH</span>
        </Link>

        {/* Barre de recherche compacte */}
        <div className="navbar-search">
          <SearchDropdown />
        </div>



        <div className="navbar-actions-group">
          {isAuth() && (
            <Link to="/create" className="btn btn-primary btn-create" onClick={closeMenu}>
              <span className="btn-plus">+</span>
              <span className="btn-text">Créer</span>
            </Link>
          )}

          <div className="menu-toggle-container" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FiX className="menu-toggle" /> : <FiMenu className="menu-toggle" />}
          </div>
        </div>

        </div>

        {/* Menu de navigation */}
        <div className={`navbar-menu navbar-links-wrapper ${isMenuOpen ? "open" : ""}`}>
          {isAuth() ? (
            <div className="nav-items">
              <InstallPWA />

              {/* Bouton de notification */}
              <NotificationDropdown unreadCount={unreadCount} />

              <div className="user-menu-mobile">
                <UserMenuLinks user={user} isAdmin={isAdmin} onAction={closeMenu} />
              </div>

              <UserMenu className="user-menu-btn" />

            </div>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>
                Se connecter
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
    </nav>
  );
};

export default Navbar;
