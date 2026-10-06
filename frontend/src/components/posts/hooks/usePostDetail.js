import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getPost, deletePost } from "../../../services/api";

export const usePostDetail = ({ onClose = null, onPostDeleted = null } = {}) => {
    const navigate = useNavigate();

    const [commentCount,  setCommentCount]  = useState(0);
    const [postId, setPostId] = useState(null);


    const { data: post, isLoading, error } = useQuery({
        queryKey: ["post", postId],
        queryFn: () => getPost(postId),
        enabled: !!postId,  
        staleTime: 1000 * 60,
    });

    const loadPost = (id) => setPostId(id);
    
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

    useEffect(() => {
        if (post?.comments_count !== undefined) {
            setCommentCount(post.comments_count);
        }
    }, [post?.comments_count]);

    return {
        post,
        loading: isLoading,
        error: error ? "Erreur lors du chargement du post" : "",
        commentCount,
        loadPost,
        handleEdit,
        handleDelete,
        handleCommentAdded,
    };
};