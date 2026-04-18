/**
 * Service API - Gestion de toutes les requêtes HTTP
 */

import api, { API_BASE_URL } from "../utils/axiosConfig";


// ==================== USER PROFILE ====================

/**
 * Obtenir le profil d'un utilisateur
 */
export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * Mettre à jour son profil
 */
export const updateProfile = async (data) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

/**
 * Upload photo de profil
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/files/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Obtenir l'URL de l'avatar
 */
export const getAvatarUrl = (userId, bust = null) => {
  if (!userId) return null;
  const base = `${api.defaults.baseURL}/files/users/${userId}/avatar`;
  return bust ? `${base}?v=${bust}` : base;

};

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

  const data = response.data
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return response.data;
};

export const register = async (data) => {
  console.log("Données envoyées :", data);
  const response = await api.post("/auth/register", data);
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

export const getPosts = async ({ skip = 0, limit = 20, postType = null, myPost = false, id = null, roomId = null } = {}) => {
  const params = new URLSearchParams({ skip, limit, my_post: myPost });
  
  if (id) params.append("id", id);
  if (postType) params.append("post_type", postType);
  if (roomId) params.append("room_id", roomId);

  const response = await api.get(`/posts/?${params}`);
  return response.data;
};


export const searchPosts = async (query, skip = 0, limit = 20) => {
  const response = await api.get(
    `/search/general?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`,
  );
  return response.data;
};

export const getPost = async (postId) => {
  const response = await api.get(`/posts/${postId}`);
  console.log(response.data);
  return response.data;
};


export const createPost = async (postData) => {
  const formData = new FormData();
  formData.append("title", postData.title);
  formData.append("description", postData.description || "");
  formData.append("post_type", postData.post_type);
  if (postData.room_id) {
    formData.append("room_id", postData.room_id);
  }
  formData.append("file", postData.file);

  const response = await api.post("/posts/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updatePost = async (postId, updateData) => {
  console.log("Juste avant l'envoie vers le serveur: ", updateData.get("title"));
  const response = await api.put(`/posts/${postId}`, updateData);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

export const getPostFileUrl = (postId, bust = null) => {
  const base = `${API_BASE_URL}/files/posts/${postId}`;
  return bust ? `${base}?v=${bust}` : base;
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
    const response = await api.get(`/files/posts/${postId}`, {
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

/* Commentaires */

export const getComments = async (postId) => {
  const response = await api.get(`${API_BASE_URL}/comments/posts/${postId}/comments`)
  return response.data
}

export const addComment = async (data) => {
  const response = await api.post(`${API_BASE_URL}/comments/create`, data);
  return response.data
}

export const deleteComment = async (commentId) => {
  const response = await api.delete(`${API_BASE_URL}/comments/delete/${commentId}`)
  return response.data
}

export const updateComment = async (commentId, new_content) => {
  const response = await api.put(`${API_BASE_URL}/comments/update/${commentId}?new_content=${new_content}`)
  return response.data
}

/* Notification */

export const getNotifications = async () => {
  const response = await api.get(`${API_BASE_URL}/notifications/me/all`)
  return response.data
} 

export const markNotificationsAsRead = async () => {
  const response = await api.put(`${API_BASE_URL}/notifications/me/all`)
  return response.data
}

export const deleteNotif = async (notifId) => {
  const response = await api.delete(`${API_BASE_URL}/notifications/me/delete/${notifId}`)
  return response.data
}

// Room apis

export const getUserRoom = async () => {
  const response = await api.get(`${API_BASE_URL}/rooms/me`)
  return response.data
}

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
