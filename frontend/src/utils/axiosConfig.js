// utils/axiosConfig.js (renommer de .jsx à .js)
import axios from "axios";

// URL de base de l'API
const API_BASE_URL = "http://localhost:8000";

// Instance Axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide - supprimer le token et notifier l'application
      // Au lieu de forcer une navigation ici, on déclenche un événement custom
      // que l'application React peut écouter pour effectuer une déconnexion SPA.
      try {
        localStorage.removeItem("access_token");
      } catch (e) {
        // ignore
      }
      window.dispatchEvent(
        new CustomEvent("app:logout", { detail: { reason: "unauthorized" } }),
      );
    }
    return Promise.reject(error);
  },
);

// EXPORTER l'instance et l'URL de base
export { API_BASE_URL };
export default api;
