import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import {
  login as apiLogin,
  logout as apiLogout,
  isAuthenticated,
  getUserProfile,
} from "../services/api";
import React from "react";

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
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        const decoded = jwtDecode(token); // { sub: "user_id", exp: ... }
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("access_token");
          setUser(null);
        } else {
          try {
            const profile = await getUserProfile(decoded.sub);
            setUser({
              authenticated: true,
              ...profile,
            });
          } catch (error) {
            console.error("Erreur chargement profil:", error);
            // Fallback to basic info
            let storedUsername = null;
            try {
              storedUsername = localStorage.getItem("username");
            } catch (e) {
              storedUsername = null;
            }
            setUser({
              authenticated: true,
              id: decoded.sub,
              username: storedUsername || null,
            });
          }
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  /**
   * Fonction de connexion
   * @param {string} username - Nom d'utilisateur 
   * @param {string} password - Mot de passe
   * @returns {Promise} Résultat de la connexion
   */
  const login = async (username, password) => {
    try {
      const data = await apiLogin(username, password);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token)

      // Persist username so we can restore it after page reloads
      try {
        localStorage.setItem("username", username);
      } catch (e) {
        // ignore storage errors
      }

      const decoded = jwtDecode(data.access_token);
      setUser({
        authenticated: true,
        id: decoded.sub,
        username,
      });

      return { success: true };
    } catch (error) {
      console.error("Erreur de connexion:", error);

      // Gérer les différents types d'erreurs
      if (error.response?.status === 401) {
        return { success: false, error: "Email ou mot de passe incorrect" };
      }

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Erreur de connexion. Veuillez réessayer.",
      };
    }
  };

  /**
   * Fonction de déconnexion
   */
  const logout = () => {
    // Supprimer le token
    apiLogout();

    try {
      localStorage.removeItem("username");
    } catch (e) {
      // ignore
    }

    // Réinitialiser l'état de l'utilisateur
    setUser(null);
  };

  // Écouter les événements de déconnexion globaux (ex: axios envoie 'app:logout')
  // Permet à l'application de gérer la navigation/état depuis un point central
  useEffect(() => {
    const onAppLogout = (e) => {
      try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
      } catch (err) {
        // ignore
      }
      setUser(null);
      // Rediriger vers /login sauf si l'événement précise le contraire
      if (e?.detail?.redirect !== false) {
        window.location.href = "/login";
      }
    };

    window.addEventListener("app:logout", onAppLogout);
    return () => window.removeEventListener("app:logout", onAppLogout);
  }, []);

  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns {boolean} True si authentifié
   */
  const isAuth = () => user?.authenticated === true;

  // Valeur fournie par le contexte
  const value = {
    user,
    login,
    logout,
    isAuth,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * Exemple d'utilisation: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }

  return context;
};
