import { Link } from "react-router-dom";
import { useAuth} from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import UserMenu from "../user/UserMenu";
import React from "react";
import "../../styles/Navbar.css"
import NotificationDropdown from "../notifications/NofitificationDropdown";
import SearchDropdown from "../search/SearchDropdown";

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const { unreadCount } = useWebSocket();


  const navigate = useNavigate();


  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo et nom de l'application */}
        <Link to="/" className="navbar-logo">
          <span>Esat-Hub</span>
        </Link>

        {/* Barre de recherche compacte */}
        <div className="navbar-filters-wrapper">
          <SearchDropdown />
        </div>

        {/* Menu de navigation */}
        <div className="navbar-menu">
          {isAuth() ? (
            <>
              
                <FiHome className="navbar-icon" onClick={() => navigate("/room")}/>

              <Link to="/create" className="btn btn-primary">
                + Créer
              </Link>

              <NotificationDropdown unreadCount={unreadCount} />

              {user && (
                <UserMenu className="user-menu-btn" />
              )}

            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Se connecter
              </Link>
              <Link to="/register" className="btn btn-primary">
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
