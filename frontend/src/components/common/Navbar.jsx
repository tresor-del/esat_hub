import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth} from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { HiOutlineHome } from "react-icons/hi";
import UserMenu from "../user/UserMenu";
import NotificationDropdown from "../notifications/NofitificationDropdown";
import SearchDropdown from "../search/SearchDropdown";
import "../../styles/Navbar.css"

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
              
              {/* Icone du room */}
              <HiOutlineHome className="navbar-icon" onClick={() => navigate("/room")}/>
              {/* Bouton de notification */}
              <NotificationDropdown unreadCount={unreadCount} />

              <Link to="/create" className="btn btn-primary">
                + Créer
              </Link>


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
