import api, { API_BASE_URL } from "../utils/axiosConfig";

// ==================== USERS ====================

/**
 * Obtenir tous les utilisateurs (admin)
 */
export const getAllUsers = async ({ skip = 0, limit = 100, role = null, status = null, domain = null, year = null } = {}) => {
  const params = new URLSearchParams({ skip, limit });
  if (role) params.append("role", role);
  if (status) params.append("status", status);
  if (domain) params.append("domain", domain);
  if (year) params.append("year", year);

  const response = await api.get(`/admin/users?${params}`);
  return response.data;
};

/**
 * Rechercher des utilisateurs (admin)
 */
export const searchUsers = async (query, limit = 50) => {
  const response = await api.get(`/admin/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.data;
};

/**
 * Obtenir un utilisateur par ID (admin)
 */
export const getUserById = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Mettre à jour le statut d'un utilisateur (admin)
 */
export const updateUserStatus = async (userId, newStatus) => {
  const response = await api.patch(`/admin/users/${userId}/status?new_status=${newStatus}`);
  return response.data;
};

// ==================== STATS ====================

/**
 * Obtenir les statistiques du dashboard admin
 */
export const getAdminStats = async () => {
  const response = await api.get("/admin/statistics");
  return response.data;
};

// ==================== POSTS ====================

/**
 * Obtenir tous les posts (admin)
 */
export const getAllPostsAdmin = async ({ skip = 0, limit = 50, postType = null, status = null, roomId = null } = {}) => {
  const params = new URLSearchParams({ skip, limit });
  if (postType) params.append("post_type", postType);
  if (status) params.append("status", status);
  if (roomId !== null) params.append("room_id", roomId);

  const response = await api.get(`/admin/posts?${params}`);
  return response.data;
};

/**
 * Obtenir les statistiques des posts (admin)
 */
export const getPostStatistics = async () => {
  const response = await api.get("/admin/posts/statistics");
  return response.data;
};

/**
 * Obtenir un post par ID (admin)
 */
export const getPostByIdAdmin = async (postId) => {
  const response = await api.get(`/admin/posts/${postId}`);
  return response.data;
};

/**
 * Mettre à jour le statut d'un post (admin)
 */
export const updatePostStatus = async (postId, newStatus) => {
  const response = await api.patch(`/admin/posts/${postId}/status?new_status=${newStatus}`);
  return response.data;
};

/**
 * Supprimer un post (admin)
 */
export const deletePostAdmin = async (postId) => {
  const response = await api.delete(`/admin/posts/${postId}`);
  return response.data;
};

// ==================== COMMENTS ====================

/**
 * Obtenir les statistiques des commentaires (admin)
 */
export const getCommentStatistics = async () => {
  const response = await api.get("/admin/comments/statistics");
  return response.data;
};

/**
 * Obtenir tous les commentaires (admin)
 */
export const getAllCommentsAdmin = async ({ skip = 0, limit = 50, postId = null } = {}) => {
  const params = new URLSearchParams({ skip, limit });
  if (postId) params.append("post_id", postId);

  const response = await api.get(`/admin/comments?${params}`);
  return response.data;
};

// ==================== ROOMS ====================

/**
 * Obtenir toutes les rooms (admin)
 */
export const getAllRoomsAdmin = async ({ skip = 0, limit = 100 } = {}) => {
  const params = new URLSearchParams({ skip, limit });
  const response = await api.get(`/admin/rooms?${params}`);
  return response.data;
};

/**
 * Obtenir les statistiques des rooms (admin)
 */
export const getRoomStatistics = async () => {
  const response = await api.get("/admin/rooms/statistics");
  return response.data;
};

/**
 * Obtenir une room par ID (admin)
 */
export const getRoomByIdAdmin = async (roomId) => {
  const response = await api.get(`/admin/rooms/${roomId}`);
  return response.data;
};