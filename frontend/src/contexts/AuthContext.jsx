import axios from "axios";
import { API_BASE_URL } from "../utils/axiosConfig";
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
        // si l'access token a expiré:
        if (decoded.exp * 1000 < Date.now()) {
          // tenter de récupérer le refresh token:
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            try {
              // tenter le refresh
              const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken
              });
              localStorage.setItem("access_token", res.data.access_token);
              localStorage.setItem("refresh_token", res.data.refresh_token);
              // puis charger le profil normalement
              const newDecoded = jwtDecode(res.data.access_token);
              const profile = await getUserProfile(newDecoded.sub);
              setUser({ authenticated: true, ...profile });
            } catch (e) {
              // refresh expiré aussi → déconnexion réelle
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              setUser(null);
            }
          } else {

            localStorage.removeItem("access_token");
            setUser(null);
          };
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
      const userprofile = await getUserProfile(decoded.sub);
      setUser({
        authenticated: true,
        ...userprofile,
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

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  }

  // Valeur fournie par le contexte
  const value = {
    user,
    login,
    logout,
    isAuth,
    loading,
    updateUser,
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
