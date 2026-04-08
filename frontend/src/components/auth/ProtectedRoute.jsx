import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import React from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuth, loading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers /login
  if (!isAuth()) {
    return <Navigate to="/login" replace />;
  }

  // Si authentifié, afficher le composant enfant
  return children;
};

export default ProtectedRoute;