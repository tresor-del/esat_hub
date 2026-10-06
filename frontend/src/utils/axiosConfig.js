import axiosRetry from 'axios-retry'
import axios from "axios";
import { Preferences } from '@capacitor/preferences';

const getToken = async (key) => {
  const { value } = await Preferences.get({ key });
  return value;
};

// URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Instance Axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL
});

// // Les retries sur les erreurs réseaux
// let isRetrying = null

// axiosRetry(api, {
//   retries: 5,
//   retryDelay: axiosRetry.exponentialDelay,
//   retryCondition: (error) => !error.response || error.response.status >=500,
//   onRetry: (retryCount) => {
//     if (!isRetrying) {
//       isRetrying = true
//       window.dispatchEvent(new CustomEvent('app:retry', {detail: { retryCount }}))
//     }
//   }
// })

// // Quand une requête réussit après retry
// api.interceptors.response.use((response) => {
//   if (isRetrying) {
//     isRetrying = false
//     window.dispatchEvent(new CustomEvent('app:retry-success'))
//   }
//   return response
// })

let isRefreshing = false;
let failedQueue = [];

const shouldLogoutOnAuthError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

// fonction qui gère toutes les requêtes stockée dans la file d'attente
const processQueue = (error, token = null) => {

  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];

}

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await getToken("access_token");
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
      await getToken("refresh_token")
    ) {

      request._retry = true;

      // stocker la requête si la recup du nouveau token est déjà en cours
      // et la traiter que si le token est récupéré
      if (isRefreshing) {
        // stocker cette requête dans la file d'attente
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            request.headers.Authorization = "Bearer " + token;
            return api(request);
          })
          .catch((err) => Promise.reject(err));
      }

      // mécanisme pour récupérer le token si aucun processus de récupération n'est en cours
      isRefreshing = true;
      const refreshToken = await getToken("refresh_token")

      try {
        // essayer de récuperer un nouveau token par axios
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        // Mise à jour du stockage et des headers par défaut
        const newAccessToken = res.data.access_token;
        const newRefreshToken = res.data.refresh_token
        await Preferences.set({ key: "access_token", value: newAccessToken });
        await Preferences.remove({ key: "refresh_token" });
        await Preferences.set({ key: "refresh_token", value: newRefreshToken });
        api.defaults.headers.Authorization = "Bearer " + newAccessToken;

        // evenement pour permettre au ws d'utiliser le nouveau token pour les requetes
        window.dispatchEvent(new CustomEvent("TOKEN_REFRESHED", { detail: { token: newAccessToken } }));


        // on peut alors continuer les requêtes dans la queue
        processQueue(null, newAccessToken);

        // processus terminé donc:
        isRefreshing = false;

        // on relance la requête
        request.headers.Authorization = "Bearer " + newAccessToken;
        return api(request)

      } catch (refreshError) {

        processQueue(refreshError, null);
        isRefreshing = false;

        if (shouldLogoutOnAuthError(refreshError)) {
          await Preferences.remove({ key: "access_token" });
          await Preferences.remove({ key: "refresh_token" });

          window.dispatchEvent(
            new CustomEvent("app:logout", { detail: { reason: "unauthorized" } }),
          );
        }

        return Promise.reject(refreshError);

      }

    }

    return Promise.reject(error);
  },
);

// EXPORTER l'instance et l'URL de base
export { API_BASE_URL };
export default api;
