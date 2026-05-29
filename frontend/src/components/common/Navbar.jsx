import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import UserMenuLinks from "../user/UserMenuLinks";
import UserMenu from "../user/UserMenu";
import NotificationDropdown from "../notifications/NofitificationDropdown"
import SearchDropdown from "../search/SearchDropdown";
import InstallPWA from "./InstallPWA";
import { FiMenu, FiX, FiMessageCircle, FiHome, FiUsers } from "react-icons/fi";
import "../../styles/Navbar.css";
import Avatar from "../ui/Avatar";
import DropdownMenu from "../ui/DropdownMenu";
import Logo from "./Logo";

const Navbar = (props) => {
  const { user, isAuth } = useAuth();
  const { unreadCount, unreadChatsCount } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showTopBar, setShowTopBar] = useState(() => {
    const mobile = window.innerWidth <= 768;
    return !mobile || !location.pathname.startsWith("/room");
  });
  const lastScrollY = useRef(0);
  const lastShowTopBarChange = useRef(0);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowTopBar(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      const isScrollingDown = currentScrollY > lastScrollY.current && currentScrollY > 40;
      const newShowTopBar = !isScrollingDown;
      
      // Debounce: only update if enough time has passed
      const now = Date.now();
      if (now - lastShowTopBarChange.current > 150) {
        setShowTopBar(newShowTopBar);
        lastShowTopBarChange.current = now;
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    if (location.pathname.startsWith("/room")) {
      setShowTopBar(false);
    } else {
      setShowTopBar(true);
    }
  }, [isMobile, location.pathname]);

  const activeSection = (() => {
    const path = location.pathname.toLowerCase();
    if (path === "/" || path === "/home") return "home";
    if (path.startsWith("/chat")) return "chat";
    if (path.startsWith("/room")) return "rooms";
    return "";
  })();

  /* ── Éléments réutilisables ──────────────────── */

  const getLogo = (
    <div style={{ display: "flex" }}>
      {isMobile && (
        <div></div>
        // <DropdownMenu trigger={<FiMenu size={22} />}>
        //   <div className="user-menu">
        //     <UserMenuLinks user={user} onAction={closeMenu} />
        //   </div>
        // </DropdownMenu>
      )}
      <Link to="/" className="navbar-logo">
        <Logo size={isMobile ? 45 : 40} />
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
    <nav className={`navbar navbar--desktop ${props.className}`}>
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
    <nav className={`navbar navbar--mobile ${props.className}`}>

      {/* Barre supérieure */}
      <div className={`navbar-container navbar-topbar ${showTopBar ? "" : "hidden"}`}>

        {/* Logo */}
        {getLogo}

        {/* Cloche — toujours visible dans la barre */}
        {isAuth() && (
          <div className="navbar-actions">
            {CreateButton}
            {user ? (
              <Avatar user={user} openModal={false} onClick={() => navigate(`/profile/${user.id}`)} data-step="5" />
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

      {/* Barre d'actions mobile en bas du navbar (mobile only) */}
      {isMobile && (
        <div className="navbar-mobile-bottom">
          <button
            className={`navbar-icon-btn mobile-action ${activeSection === "home" ? "active" : ""}`}
            aria-label="Accueil"
            onClick={() => {
              navigate("/");
              closeMenu();
            }}
          >
            <div className="icon-with-badge navbar-icon-container">
              <FiHome size={25} style={{ opacity: activeSection === "home" ? 1 : 0.7 }} />
            </div>
          </button>

          <button
            className={`navbar-icon-btn mobile-action ${activeSection === "rooms" ? "active" : ""}`}
            aria-label="Salles"
            onClick={() => {
              navigate("/room");
              closeMenu();
            }}
          >
            <div className="icon-with-badge navbar-icon-container">
              <FiUsers size={25} style={{ opacity: activeSection === "rooms" ? 1 : 0.7 }} />
            </div>
          </button>

          <button
            className={`navbar-icon-btn mobile-action ${activeSection === "chat" ? "active" : ""}`}
            aria-label="Messages"
            onClick={() => {
              navigate("/chat");
              closeMenu();
            }}
          >
            <div className="icon-with-badge navbar-icon-container">
              <FiMessageCircle size={25} style={{ opacity: activeSection === "chat" ? 1 : 0.7 }} />
              {unreadChatsCount > 0 && (
                <span className="notification-badge">{unreadChatsCount}</span>
              )}
            </div>
          </button>

          <NotificationDropdown unreadCount={unreadCount} /> 

        </div>

      )}

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