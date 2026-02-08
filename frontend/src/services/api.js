/**
 * Service API - Gestion de toutes les requêtes HTTP
 * Ce fichier centralise toutes les communications avec le backend
 */

import axios from 'axios';

// URL de base de l'API
const API_BASE_URL = 'http://localhost:8000';

// Instance Axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide - déconnecter l'utilisateur
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * =========================================
 * AUTHENTICATION API
 * =========================================
 */

/**
 * Connexion d'un utilisateur
 * @param {string} username - Nom d'utilisateur (email)
 * @param {string} password - Mot de passe
 * @returns {Promise} Token d'accès
 */
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post('/auth/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

/**
 * Inscription d'un nouvel utilisateur
 * @param {string} username - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise} Message de confirmation
 */
export const register = async (username, password) => {
  const response = await api.post('/auth/register', {
    username,
    email: username,
    password,
  });
  return response.data;
};

/**
 * Vérification de l'email via token
 * @param {string} token - Token de vérification reçu par email
 * @returns {Promise} Message de confirmation
 */
export const confirmEmail = async (token) => {
  const response = await api.get(`/auth/confirm-email?token=${token}`);
  return response.data;
};

/**
 * =========================================
 * POSTS API
 * =========================================
 */

/**
 * Récupérer tous les postes avec pagination et filtres
 * @param {number} skip - Nombre de postes à ignorer
 * @param {number} limit - Nombre maximum de postes
 * @param {string} postType - Type de poste (photo/document/null)
 * @returns {Promise} Liste des postes
 */
export const getPosts = async (skip = 0, limit = 20, postType = null) => {
  let url = `/posts/?skip=${skip}&limit=${limit}`;
  if (postType) {
    url += `&post_type=${postType}`;
  }
  const response = await api.get(url);
  return response.data;
};

/**
 * Rechercher des postes par mot-clé
 * @param {string} query - Terme de recherche
 * @param {number} skip - Nombre de postes à ignorer
 * @param {number} limit - Nombre maximum de postes
 * @returns {Promise} Liste des postes correspondants
 */
export const searchPosts = async (query, skip = 0, limit = 20) => {
  const response = await api.get(`/posts/search/?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
  return response.data;
};

/**
 * Récupérer un poste spécifique par ID
 * @param {number} postId - ID du poste
 * @returns {Promise} Détails du poste
 */
export const getPost = async (postId) => {
  const response = await api.get(`/posts/${postId}`);
  return response.data;
};

/**
 * Créer un nouveau poste
 * @param {Object} postData - Données du poste
 * @param {string} postData.title - Titre du poste
 * @param {string} postData.description - Description du poste
 * @param {string} postData.post_type - Type (photo/document)
 * @param {File} postData.file - Fichier à uploader
 * @returns {Promise} Poste créé
 */
export const createPost = async (postData) => {
  const formData = new FormData();
  formData.append('title', postData.title);
  formData.append('description', postData.description || '');
  formData.append('post_type', postData.post_type);
  formData.append('file', postData.file);

  const response = await api.post('/posts/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Mettre à jour un poste existant
 * @param {number} postId - ID du poste à modifier
 * @param {Object} updateData - Nouvelles données
 * @param {string} updateData.title - Nouveau titre
 * @param {string} updateData.description - Nouvelle description
 * @returns {Promise} Poste mis à jour
 */
export const updatePost = async (postId, updateData) => {
  const response = await api.put(`/posts/${postId}`, updateData);
  return response.data;
};

/**
 * Supprimer un poste
 * @param {number} postId - ID du poste à supprimer
 * @returns {Promise} Confirmation de suppression
 */
export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

/**
 * Obtenir l'URL du fichier d'un poste
 * @param {number} postId - ID du poste
 * @returns {string} URL du fichier
 */
export const getPostFileUrl = (postId) => {
  return `${API_BASE_URL}/posts/${postId}/file`;
};

/**
 * Télécharger le fichier d'un poste
 * @param {number} postId - ID du poste
 * @param {string} fileName - Nom du fichier
 */
export const downloadPostFile = async (postId, fileName) => {
  const response = await api.get(`/posts/${postId}/file`, {
    responseType: 'blob',
  });
  
  // Créer un lien de téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * =========================================
 * UTILITAIRES
 * =========================================
 */

/**
 * Vérifier si l'utilisateur est authentifié
 * @returns {boolean} True si authentifié
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

/**
 * Déconnecter l'utilisateur
 */
export const logout = () => {
  localStorage.removeItem('access_token');
};

export default api;