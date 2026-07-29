import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import UserMenu from "../user/UserMenu";
import { useHomeData } from "../../pages/Home/hooks/useHomeData";
import NotificationDropdown from "../notifications/NofitificationDropdown"
import SearchDropdown from "../search/SearchDropdown";
import InstallPWA from "./InstallPWA";
import { useCreatePostModal } from "../../contexts/createPostContext";
import { FiMenu, FiX, FiMessageCircle, FiHome, FiUsers, FiPlus, FiSearch, FiServer } from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import "../../styles/Common/Navbar.css";
import Avatar from "../ui/Avatar";
import Logo from "./Logo";
import { useRoomData } from "../../pages/room/hooks/useRoomData";

const Navbar = (props) => {
  const { user, isAuth } = useAuth();
  const { unreadCount, unreadChatsCount } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const {room} = useRoomData();
  const lastScrollY = useRef(0);
  const lastShowTopBarChange = useRef(0);
  const { openCreatePost } = useCreatePostModal();

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const [showTopBar, setShowTopBar] = useState(() => {
    const mobile = window.innerWidth <= 768;
    return !mobile ;
  });

  const [showBottomBar, setShowBottomBar] = useState(() => {
    const mobile = window.innerWidth <= 768;
    return !mobile ;
  });


  useEffect(() => {
    let dernierePosition = 0;

    const handleScrollMobile = () => {
      const navbar = document.getElementById('navbar--mobile');
      if (!navbar) return;

      const positionActuelle = window.pageYOffset || document.documentElement.scrollTop;
      if (positionActuelle > dernierePosition && positionActuelle > 100) {
        navbar.classList.add('cache');
      } else {
        navbar.classList.remove('cache');
      }
      dernierePosition = positionActuelle <= 0 ? 0 : positionActuelle;
    };

    window.addEventListener('scroll', handleScrollMobile);
    return () => window.removeEventListener('scroll', handleScrollMobile); // cleanup
  }, []);

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

    const excludedPaths = 
      location.pathname.startsWith("/room") ||
      location.pathname.startsWith("/chat") ||
      location.pathname.startsWith("/profile") ||
      location.pathname.startsWith("/post-page/");

    const excludedOnB = 
      location.pathname.startsWith("/post-page/");

    if (excludedPaths) {
      setShowTopBar(false);
    } else {
      setShowTopBar(true);
    }

     if (excludedOnB) {
      setShowBottomBar(false);
    } else {
      setShowBottomBar(true);
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

  const HomeButton = (
    <button
      className={`navbar-icon-btn ${activeSection === "home" ? "active" : ""}`}
      onClick={() => { navigate("/"); closeMenu(); }}
      aria-label="Accueil"
    >
      <div className="icon-with-badge navbar-icon-container">
        <FiHome size={24} strokeWidth={activeSection === "home" ? 2.2 : 1.8} />
        Posts
      </div>
    </button>
  );

  const RoomsButton = (
    <button
      className={`navbar-icon-btn ${activeSection === "rooms" ? "active" : ""}`}
      onClick={() => { navigate(`/room/${room.id}`); closeMenu(); }}
      aria-label="Salles"
    >
      <div className="icon-with-badge navbar-icon-container">
        <FaChalkboardTeacher size={24} strokeWidth={activeSection === "rooms" ? 2.2 : 1.8} />
        Classe
      </div>
    </button>
  );

  const ChatButton = (
    <button
      className={`navbar-icon-btn ${activeSection === "chat" ? "active" : ""}`}
      onClick={() => { navigate("/chat"); closeMenu(); }}
      aria-label="Messages"
      data-step="2"
      data-intro="Accedez au chat ici !"
    >
      <div className="icon-with-badge navbar-icon-container">
        <FiMessageCircle size={24} strokeWidth={activeSection === "chat" ? 2.2 : 1.8} />
        {unreadChatsCount > 0 && (
          <span className="notification-badge">{unreadChatsCount}</span>
        )}
        Messages
      </div>
    </button>
  );


  const CreateButton = (
    <div className="btn btn-create" onClick={() => { openCreatePost(); closeMenu(); }}>
      <FiPlus size={25} />
      <span>Créer</span>
    </div>
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
      <div className="navbar-container desktop">

        {/* Gauche : logo */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {getLogo}

          <SearchDropdown />
        </div>


        {/* Centre : home + rooms + chat */}
        <div className="navbar-center">
          {HomeButton}
          {RoomsButton}
          {ChatButton}
        </div>

        {/* Droite : actions */}
        <div className="navbar-actions">
          {isAuth() ? (
            <>
              {CreateButton}
              <NotificationDropdown unreadCount={unreadCount} />

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

  const MobileNavbar = (
    <nav className={`navbar navbar--mobile `} id="navbar--mobile">

      {/* Barre supérieure */}
      <div className={`navbar-container navbar-topbar ${showTopBar ? "" : "hidden"} `}>

        {/* Logo */}
        {/* {getLogo} */}


        <UserMenu />

        <SearchDropdown />


        <NotificationDropdown unreadCount={unreadCount} />

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
        <div className={`navbar-mobile-bottom ${showBottomBar ? "" : "hidden"}  }`}>
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
            Posts
          </button>

          <button
            className={`navbar-icon-btn mobile-action ${activeSection === "rooms" ? "active" : ""}`}
            aria-label="Salles"
            onClick={() => {
              navigate(`/room/${room.id}`);
              closeMenu();
            }}
          >
            <div className="icon-with-badge navbar-icon-container">
              <FiUsers size={25} style={{ opacity: activeSection === "rooms" ? 1 : 0.7 }} />
            </div>
            Classe
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
            Messages
          </button>

          {CreateButton}

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