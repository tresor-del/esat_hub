import { Link } from "react-router-dom";
import { useAuth} from "../contexts/AuthContext";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useNavigate } from "react-router-dom";
import SearchFilters from "./SearchFilters";
import Avatar from "./Avatar";
import React from "react";

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const { unreadCount } = useWebSocket();

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
    }
  };

  const navigate = useNavigate();

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (user?.id) {
      console.log(user.id)
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo et nom de l'application */}
        <Link to="/" className="navbar-logo">
          <span>Esat-Hub</span>
        </Link>

        {/* Barre de recherche compacte */}
        <div className="navbar-filters-wrapper">
          <SearchFilters compact={true} />
        </div>

        {/* Menu de navigation */}
        <div className="navbar-menu">
          {isAuth() ? (
            <>
              <Link to="/create" className="btn btn-primary">
                + Créer
              </Link>

              <Link to="/notifications" className="navbar-link notifications-link">
                🔔 Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
              </Link>

              {user && (
                <Avatar user={user} onClick={handleUserClick}/>
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
