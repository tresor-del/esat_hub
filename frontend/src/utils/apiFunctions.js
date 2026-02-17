/**
 * Exemple de fonction API pour updatePost
 * À ajouter dans votre fichier services/api.js
 */

import api from "./axiosConfig";

/**
 * Mettre à jour un post
 * @param {number} postId - ID du post à modifier
 * @param {FormData} formData - Données du formulaire
 * @returns {Promise} Post mis à jour
 */
export const updatePost = async (postId, formData) => {
  try {
    const response = await api.put(`/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    throw error;
  }
};

/**
 * Alternative : Si votre API utilise PATCH au lieu de PUT
 */
export const updatePostPatch = async (postId, formData) => {
  try {
    const response = await api.patch(`/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    throw error;
  }
};

/**
 * Alternative : Si vous envoyez du JSON au lieu de FormData
 */
export const updatePostJSON = async (postId, data) => {
  try {
    const response = await api.put(`/posts/${postId}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    throw error;
  }
};

/**
 * Supprimer un post (utile aussi)
 */
export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    throw error;
  }
};