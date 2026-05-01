import React, { useEffect, useState } from "react";
import { addComment, getComments, deleteComment, updateComment, getComment } from "../../services/api"; // Assure-toi que l'import est bon
import { useLocation } from "react-router-dom";
import CommentCard from "./CommentCard";
import "../../styles/CommentSection.css";

const CommentSection = ({ postId, user, onCommentAdded }) => {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const location = useLocation();

    
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
        const handleRealtimeComment = async (event) => {
            const comment_data = event.detail;

            const isSamePost = String(comment_data.post_id) === String(postId);
            const isNotFromMe = comment_data.sender?.id !== user?.id;

            if (isSamePost && isNotFromMe) {
                // 1. Vérifier si on l'a déjà (sécurité doublon)
                const exists = comments.some(c => c.id === comment_data.comment_id);
                if (exists) return;

                try {
                    // 2. On récupère l'objet complet
                    const newComment = await getComment(comment_data.comment_id);
                    if (!newComment) return;

                    setComments(prev => {
                        // SI C'EST UNE RÉPONSE (parent_id existe)
                        if (newComment.parent_id) {
                            return prev.map(c => {
                                if (c.id === newComment.parent_id) {
                                    // On l'ajoute dans les replies du parent
                                    const updatedReplies = c.replies ? [newComment, ...c.replies] : [newComment];
                                    return { ...c, replies: updatedReplies };
                                }
                                return c;
                            });
                        }

                        // SI C'EST UN COMMENTAIRE RACINE
                        if (prev.some(c => c.id === newComment.id)) return prev;
                        return [newComment, ...prev];
                    });
                } catch (error) {
                    console.log("Erreur realtime reply:", error);
                }
            }
        };

        window.addEventListener("NEW_COMMENT", handleRealtimeComment);
        return () => window.removeEventListener("NEW_COMMENT", handleRealtimeComment);
    }, [postId, user?.id, comments]); // Crucial d'avoir comments ici


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
            const response = await addComment(commentData);
            setContent("");
            setComments(prevComments => [response, ...prevComments]);
            // loadComments(); // Recharger pour voir le nouveau commentaire et sa structure
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
            const response = await addComment(responseData);
            setComments(prevComments => {
                return prevComments.map(c => {
                    if (c.id === parentId) {
                        // On ajoute la réponse dans le tableau replies du parent
                        const updatedReplies = c.replies ? [response, ...c.replies] : [response];
                        return { ...c, replies: updatedReplies };
                    }
                    return c;
                });
            });
        } catch (err) {
            setError("Erreur lors de l'envoi de la réponse");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm("Voulez-vous vraiment supprimé ce commentaire ?")) {
            try {
                const result = await deleteComment(commentId);
                if (result) {
                    alert("Commentaire supprimé");
                    loadComments();
                }
            } catch (error) {
                console.log("Erreur lors de la suppression: ", error);
                alert("Erreur lors de la suppression, réessayez plus tard");
            }
        }
    }

    const handleUpdateComment = async (commentId, new_content) => {
        try {
            const response = await updateComment(commentId, new_content);
            if (response) {
                alert("Commentaire modifié avec succès");
                setComments(prev => prev.map(c => c.id === commentId ? response : c));
            }
        } catch (error) {
            console.log("Erreur lors de la mise à jour: ", error);
            alert("Erreur lors de la mise à jour du commentaire")
        }
    }

    const handleTextareaChange = (e) => {
        const element = e.target;
        setContent(element.value);

        // Ajustement automatique de la hauteur
        element.style.height = "auto"; // Réinitialise pour recalculer
        element.style.height = `${element.scrollHeight}px`; // Applique la hauteur du contenu
    };

    return (
        <div className="comment-section-container">
            {error && <p className="error-message">{error}</p>}

            <div className="submitForm">
                <textarea
                    placeholder="Écrivez un commentaire..."
                    className="comment-textarea"
                    value={content}
                    onChange={handleTextareaChange}
                    rows="1" // Commence sur une seule ligne
                />
                <button className="submitButton" onClick={handleSubmit} disabled={loading || !content.trim()}>
                    {loading ? "..." : "Publier"}
                </button>
            </div>

            <div className="commentBox">
                {comments
                    .filter(c => c.parent_id === null).sort((a, b) => {
                        return new Date(b.created_at) - new Date(a.created_at)
                    })
                    .map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            user={user}
                            onReplySubmit={handleReply}
                            loading={loading}
                            onEdit={handleUpdateComment}
                            onDelete={handleDeleteComment}
                        />
                    ))}
            </div>
        </div>
    );
};

export default CommentSection;
