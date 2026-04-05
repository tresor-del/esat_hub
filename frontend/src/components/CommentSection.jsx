import React, { useEffect, useState } from "react";
import { addComment, getComments } from "../services/api"; // Assure-toi que l'import est bon
import CommentCard from "./CommentCard";
import "../styles/CommentSection.css";

const CommentSection = ({ postId, user, onCommentAdded }) => {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Charger les commentaires
    const loadComments = async () => {
        try {
            setLoading(true);
            const result = await getComments(postId);
            // On suppose que l'API renvoie { comments: [...], total: X }
            if (result && result.comments) {
                setComments(result.comments);
            }
        } catch (err) {
            setError("Erreur lors du chargement des commentaires");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [postId]);

    // Notifier le parent du nombre de commentaires
    useEffect(() => {
        if (onCommentAdded) {
            onCommentAdded(comments.length);
        }
    }, [comments, onCommentAdded]);

    // Ajouter un commentaire racine
    const handleSubmit = async () => {
        if (!content.trim()) return;
        try {
            setLoading(true);
            const commentData = {
                user_id: user.id,
                post_id: postId,
                content: content,
                parent_id: null
            };
            await addComment(commentData);
            setContent("");
            loadComments(); // Recharger pour voir le nouveau commentaire et sa structure
        } catch (err) {
            setError("Erreur lors de l'ajout");
        } finally {
            setLoading(false);
        }
    };

    // Ajouter une réponse (appelé depuis CommentCard)
    const handleReply = async (parentId, text) => {
        try {
            setLoading(true);
            const responseData = {
                user_id: user.id,
                post_id: postId,
                content: text,
                parent_id: parentId
            };
            await addComment(responseData);
            loadComments(); 
        } catch (err) {
            setError("Erreur lors de l'envoi de la réponse");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="comment-section-container">
            {error && <p className="error-message">{error}</p>}

            <div className="submitForm">
                <input 
                    placeholder="Écrivez un commentaire..."
                    className="input"
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                />
                <button className="submitButton" onClick={handleSubmit} disabled={loading || !content.trim()}>
                    {loading ? "..." : "Publier"}
                </button>
            </div>

            <div className="commentBox">
                {comments
                    .filter(c => c.parent_id === null) // N'affiche que les commentaires de premier niveau
                    .map((comment) => (
                        <CommentCard 
                            key={comment.id} 
                            comment={comment} 
                            user={user} 
                            onReplySubmit={handleReply}
                            loading={loading}
                        />
                ))}
            </div>
        </div>
    );
};

export default CommentSection;
