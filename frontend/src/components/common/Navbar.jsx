import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import UserMenuLinks from "../user/UserMenuLinks";
import UserMenu from "../user/UserMenu";
import NotificationDropdown from "../notifications/NofitificationDropdown"
import SearchDropdown from "../search/SearchDropdown";
import InstallPWA from "./InstallPWA";
import { FiMenu, FiX, FiMessageCircle } from "react-icons/fi";
import "../../styles/Navbar.css";
import Avatar from "../ui/Avatar";
import DropdownMenu from "../ui/DropdownMenu";
import Logo from "./Logo";

const Navbar = () => {
  const { user, isAuth } = useAuth();
  const { unreadCount, unreadChatsCount } = useWebSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const isMobile = window.innerWidth <= 768;

  /* ── Éléments réutilisables ──────────────────── */

  const getLogo = (
    <div style={{ display: "flex" }}>
      {isMobile && (
        <DropdownMenu trigger={<FiMenu size={22} />}>
          <div className="user-menu">
            <UserMenuLinks user={user} onAction={closeMenu} />
          </div>
        </DropdownMenu>
      )}
      <Link to="/" className="navbar-logo">
        <Logo size={isMobile ? 45 : 40}/>
        {/* <img src={logo} alt="esat-hub" width={isMobile ? 45 : 40} height={isMobile ? 45 : 40} /> */}
        {isMobile ? (
          <h3>EsatHub</h3>
        ) : (
          <h2>EsatHub</h2>
        )}
      </Link>
    </div>
  );

  const ChatButton = (
    <button
      className="navbar-icon-btn "
      onClick={() => { navigate("/chat"); closeMenu(); }}
      aria-label="Messages"
      data-step="2"
      data-intro="Accedez au chat ici !"
    >
      <div className="icon-with-badge navbar-icon-container ">
        <FiMessageCircle size={30} style={{ opacity: 0.7 }} />
        {unreadChatsCount > 0 && (
          <span className="notification-badge">{unreadChatsCount}</span>
        )}
      </div>
    </button>
  );

  const CreateButton = (
    <Link to="/create" className="btn btn-primary btn-create" onClick={closeMenu}>
      + Créer
    </Link>
  );

  const AuthLinks = (
    <>
      <Link to="/login" className="navbar-link" onClick={closeMenu}>
        Se connecter
      </Link>
      <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
        S'inscrire
      </Link>
    </>
  );

  /* ── VERSION DESKTOP ─────────────────────────── */
  /*
   * Layout : [Logo] [Recherche──flex] [Créer] [Cloche] [Chat] [Avatar]
   * Tous les éléments à droite ont flex-shrink:0 → jamais écrasés
   */

  const DesktopNavbar = (
    <nav className="navbar navbar--desktop">
      <div className="navbar-container">

        {/* Gauche : logo */}
        {getLogo}

        {/* Centre : barre de recherche (prend tout l'espace disponible) */}
        <div className="navbar-search">
          <SearchDropdown />
        </div>

        {/* Droite : actions */}
        <div className="navbar-actions">
          {isAuth() ? (
            <>
              {/* {CreateButton} */}
              <NotificationDropdown unreadCount={unreadCount} />
              {ChatButton}
              <UserMenu />
            </>
          ) : (
            AuthLinks
          )}
        </div>

      </div>
    </nav>
  );

  /* ── VERSION MOBILE ──────────────────────────── */
  /*
   * Layout barre : [☰] [Logo] [Recherche──flex] [Cloche]
   * Drawer (si ouvert) : Chat, Créer, UserMenu
   */

  const MobileNavbar = (
    <nav className="navbar navbar--mobile">

      {/* Barre supérieure */}
      <div className="navbar-container">

        {/* Logo */}
        {getLogo}

        {/* Cloche — toujours visible dans la barre */}
        {isAuth() && (
          <div className="navbar-actions">
            {/* {CreateButton} */}
            {ChatButton}
            <NotificationDropdown unreadCount={unreadCount} />
            {user ? (
              <Avatar user={user} openModal={false} onClick={() => navigate(`/profile/${user.id}`)} data-step="5"  />
            ) : (
              <div className="skeleton-avatar skeleton-blink" style={{ width: '32px', height: '32px' }} />
            )}
            {/* <UserMenu /> */}
          </div>
        )}

      </div>

      {/* Drawer
      {isMenuOpen && (
        <div className="navbar-drawer">
          {isAuth() ? (
            <>
              <UserMenu onAction={closeMenu} />
              <InstallPWA />
            </>
          ) : (
            AuthLinks
          )}
        </div>
      )} */}

    </nav>
  );

  /* ── Rendu ───────────────────────────────────── */

  return (
    <>
      <div className="show-desktop">{DesktopNavbar}</div>
      <div className="show-mobile">{MobileNavbar}</div>
    </>
  );
};

export default Navbar;