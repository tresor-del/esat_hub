/**
 * Service API - Gestion de toutes les requêtes HTTP
 */

import api, { API_BASE_URL } from "../utils/axiosConfig";

/**
 * =========================================
 * AUTHENTICATION API
 * =========================================
 */

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await api.post("/auth/token", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data;
};

export const register = async (username, password) => {
  console.log("Données envoyées :", { username, password });
  const response = await api.post("/auth/register", {
    username,
    password,
  });
  return response.data;
};

export const confirmEmail = async (token) => {
  const response = await api.get(`/auth/confirm-email?token=${token}`);
  return response.data;
};

/**
 * =========================================
 * POSTS API
 * =========================================
 */

export const getPosts = async (skip = 0, limit = 20, postType = null) => {
  let url = `/posts/?skip=${skip}&limit=${limit}`;
  if (postType) {
    url += `&post_type=${postType}`;
  }
  const response = await api.get(url);
  // console.log(response.data);
  return response.data;
};

export const searchPosts = async (query, skip = 0, limit = 20) => {
  const response = await api.get(
    `/posts/search/?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`,
  );
  return response.data;
};

export const getPost = async (postId) => {
  const response = await api.get(`/posts/${postId}`);
  return response.data;
};

export const createPost = async (postData) => {
  const formData = new FormData();
  formData.append("title", postData.title);
  formData.append("description", postData.description || "");
  formData.append("post_type", postData.post_type);
  formData.append("file", postData.file);

  const response = await api.post("/posts/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updatePost = async (postId, updateData) => {
  const response = await api.put(`/posts/${postId}`, updateData);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

export const getPostFileUrl = (postId) => {
  return `${API_BASE_URL}/posts/${postId}/file`;
};

export const downloadPostFile = async (postId, fileName) => {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      // Pas de token -> déconnexion locale
      logout();
      throw new Error("Not authenticated");
    }

    // Certains navigateurs / configurations peuvent ne pas appliquer
    // correctement l'intercepteur axios pour les requêtes avec
    // responseType: 'blob'. On ajoute donc explicitement le header Authorization.
    const response = await api.get(`/posts/${postId}/file`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName || "file");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    // Si l'API renvoie 401, forcer la déconnexion et redirection
    if (error.response?.status === 401) {
      logout();
      // Optionnel: rediriger vers /login
      window.location.href = "/login";
    }
    throw error;
  }
};

/**
 * =========================================
 * UTILITAIRES
 * =========================================
 */

export const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};

export const logout = () => {
  localStorage.removeItem("access_token");
};

export default api;
