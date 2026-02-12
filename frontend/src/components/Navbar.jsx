/**
 * Composant Navbar - Barre de navigation
 */

import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { FiUser, FiSun, FiMoon } from "react-icons/fi";
import DropdownMenu from "./DropdownMenu";
import SearchFilters from "./SearchFilters";

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
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
                + Créer un poste
              </Link>

              {/* Menu utilisateur */}
              {user && (
                <DropdownMenu
                  trigger={
                    <div className="navbar-user-trigger" aria-label="user menu">
                      <div className="avatar">
                        {(user.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="nav-username">
                        {user.username || "Utilisateur"}
                      </span>
                    </div>
                  }
                  align="right"
                >
                  <div className="navbar-user">
                    <span style={{ color: "var(--text-secondary)" }}>
                      {user?.username || "Utilisateur"}
                    </span>
                  </div>

                  {/* Theme toggle inside user menu for discoverability */}
                  <button
                    onClick={() => toggleTheme()}
                    className="navbar-link"
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {theme === "dark" ? <FiSun /> : <FiMoon />}
                    <span>
                      {theme === "dark" ? "Mode clair" : "Mode sombre"}
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="navbar-link"
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--reddit-orange)",
                      fontWeight: "600",
                    }}
                  >
                    Déconnexion
                  </button>
                </DropdownMenu>
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
