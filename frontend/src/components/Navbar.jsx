import { Link } from "react-router-dom";
import { useAuth} from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import SearchFilters from "./SearchFilters";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FiMessageSquare } from "react-icons/fi";
import Avatar from "./Avatar";

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
