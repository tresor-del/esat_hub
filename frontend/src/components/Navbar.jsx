/**
 * Composant Navbar - Barre de navigation
 * Affiche le logo, les liens de navigation et les informations utilisateur
 * Style inspiré de Reddit
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuth } = useAuth();

  /**
   * Gérer la déconnexion
   */
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo et nom de l'application */}
        <Link to="/" className="navbar-logo">
          <span>📱</span>
          <span>Esat-Hub</span>
        </Link>

        {/* Menu de navigation */}
        <div className="navbar-menu">
          {isAuth() ? (
            // Menu pour utilisateur connecté
            <>
              {/* Lien vers l'accueil */}
              <Link to="/" className="navbar-link">
                Accueil
              </Link>

              {/* Lien pour créer un poste */}
              <Link to="/create" className="btn btn-primary">
                + Créer un poste
              </Link>

              {/* Informations utilisateur */}
              <div className="navbar-user">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {user?.username || 'Utilisateur'}
                </span>
              </div>

              {/* Bouton de déconnexion */}
              <button 
                onClick={handleLogout}
                className="navbar-link"
                style={{ 
                  border: 'none', 
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--reddit-orange)',
                  fontWeight: '600'
                }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            // Menu pour utilisateur non connecté
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