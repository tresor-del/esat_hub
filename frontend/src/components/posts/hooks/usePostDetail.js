// ─── usePostDetail.js ─────────────────────────────────────────────────────────
// Shared by PostDetail (page) and PostDetailModal.
// Handles post loading, edit/delete navigation, comment count.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPost, deletePost } from "../../../services/api";

export const usePostDetail = ({ onClose = null, onPostDeleted = null } = {}) => {
    const navigate = useNavigate();

    const [post,          setPost]          = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");
    const [commentCount,  setCommentCount]  = useState(0);

    const loadPost = async (id) => {
        try {
            setLoading(true);
            const result = await getPost(id);
            setPost(result);
        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement du post");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (currentPost) => {
        if (onClose) {
            // Modal context: hard navigate (no router history in modal)
            window.location.href = `/edit/${currentPost.id}`;
        } else {
            navigate(`/edit/${currentPost.id}`);
        }
    };

    const handleDelete = async (currentPost) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce post ?")) return;
        try {
            await deletePost(currentPost.id);
            if (onClose) {
                onClose();
                onPostDeleted?.(currentPost.id);
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error(err);
            alert("Impossible de supprimer le post.");
        }
    };

    const handleCommentAdded = (count) => setCommentCount(count);

    return {
        post,
        loading,
        error,
        commentCount,
        loadPost,
        handleEdit,
        handleDelete,
        handleCommentAdded,
    };
};