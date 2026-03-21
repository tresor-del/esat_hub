// utils/axiosConfig.js (renommer de .jsx à .js)
import axios from "axios";

// URL de base de l'API
const _API_BASE_URL= "http://localhost:8000/api/v1";
const API_BASE_URL= "https://symmetrical-adventure-4jgg5rprr9x63qvvp-8000.app.github.dev/api/v1";

// Instance Axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL
});

let isRefreshing = false;
let failedQueue = [];
  
// fonction qui gère toutes les requêtes stockée dans la file d'attente
const processQueue = (error, token = null) => {

  failedQueue.forEach((prom) => {
    if (error){
      prom.reject(error)
    } else  {
      prom.resolve(token);
    }
  });
  failedQueue = [];

}

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour récupérer un nouveau token après expiration du nouveau
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;

    if (error.response?.status === 401 &&
        !request._retry && 
        localStorage.getItem("refresh_token")
    ) {

      request._retry = true;

      // stocker la requête si la recup du nouveau token est déjà en cours
      // et la traiter que si le token est récupéré
      if(isRefreshing){
        // stocker cette requête dans la file d'attente
        return new Promise(function (resolve, reject) {
          failedQueue.push({resolve, reject});
        }) 
        .then((token) => {
          request.headers.Authorization = "Bearer " + token;
          return api(request);
        })
        .catch((err) => Promise.reject(err));
      }

      // mécanisme pour récupérer le token si aucun processus de récupération n'est en cours
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refresh_token")
      
      try {
        // essayer de récuperer un nouveau token par axios
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {refresh_token: refreshToken}
        );

        // Mise à jour du stockage et des headers par défaut
        const newAccessToken = res.data.access_token;
        localStorage.setItem("access_token", newAccessToken);
        api.defaults.headers.Authorization = "Bearer " + newAccessToken;

        // on peut alors continuer les requêtes dans la queue
        processQueue(null, newAccessToken);

        // processus terminé donc:
        isRefreshing = false;

        // on relance la requête
        request.headers.Authorization = "Bearer " + newAccessToken;
        return api(request)

      } catch (refreshError) {

        // si le refresh est expiré aussi
        processQueue(refreshError, null);
        isRefreshing = false;

        // nettoyage complet
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

      }

      // notification globale pour rédiriger les requêtes vers le login
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
