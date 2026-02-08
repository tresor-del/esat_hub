/**
 * Contexte d'Authentification
 * Gère l'état d'authentification global de l'application
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, isAuthenticated } from '../services/api';

// Création du contexte
const AuthContext = createContext(null);

/**
 * Provider d'authentification
 * Enveloppe l'application pour fournir l'état d'authentification à tous les composants
 */
export const AuthProvider = ({ children }) => {
  // État de l'utilisateur connecté
  const [user, setUser] = useState(null);
  // État de chargement
  const [loading, setLoading] = useState(true);

  /**
   * Vérifier si un utilisateur est déjà connecté au chargement
   */
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        // Si un token existe, on considère l'utilisateur comme connecté
        // Note: Dans une vraie app, on devrait vérifier la validité du token
        setUser({ authenticated: true });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Fonction de connexion
   * @param {string} username - Nom d'utilisateur (email)
   * @param {string} password - Mot de passe
   * @returns {Promise} Résultat de la connexion
   */
  const login = async (username, password) => {
    try {
      const data = await apiLogin(username, password);
      
      // Sauvegarder le token dans localStorage
      localStorage.setItem('access_token', data.access_token);
      
      // Mettre à jour l'état de l'utilisateur
      setUser({ authenticated: true, username });
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Gérer les différents types d'erreurs
      if (error.response?.status === 401) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erreur de connexion. Veuillez réessayer.' 
      };
    }
  };

  /**
   * Fonction de déconnexion
   */
  const logout = () => {
    // Supprimer le token
    apiLogout();
    
    // Réinitialiser l'état de l'utilisateur
    setUser(null);
  };

  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns {boolean} True si authentifié
   */
  const isAuth = () => {
    return !!user;
  };

  // Valeur fournie par le contexte
  const value = {
    user,
    login,
    logout,
    isAuth,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * Exemple d'utilisation: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
};