import React, { useEffect, useState } from "react";
import PostAuthorInfo from "../posts/PostAuthorInfo";
import { formatRelativeDate } from "../../utils/dateFormatter";
import { useLocation } from "react-router-dom";
import { FiEdit, FiTrash2, FiMoreVertical } from "react-icons/fi";
import CommentActionsMenu from "./CommentActionsMenu";
import "../../styles/CommentSection.css"
import { useAuth } from "../../contexts/AuthContext";
import { getComment, getUserProfile } from "../../services/api";

const CommentCard = ({ comment, user, onReplySubmit, loading, onEdit, onDelete }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const commentId = params.get("commentId");
    const isCommentInReplies = comment.replies?.some(r => r.id == commentId)
    const [showReplies, setShowReplies] = useState(isCommentInReplies);

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content)

    const isOwner = user && user?.id === comment.user?.id
    const isAdmin = user && user?.role === "ADMIN";

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onReplySubmit(comment.id, replyText);
        setReplyText("");
        setIsReplying(false);
        setShowReplies(true); // Affiche les réponses après avoir répondu
    };

    const hasReplies = comment.replies && comment.replies.length > 0;

    const hasParent = !!comment.parent;

    const cancelEdit = () => {
        setIsEditing(false);
        setEditText(comment.content)
    }

    const openEditMode = () => {
        setIsEditing(true);
    };

    const handleDelete = async () => {
        await onDelete(comment.id);
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        try {
            await onEdit(comment.id, editText)
        } catch (error) {
            console.log(error)
        } finally {
            setIsEditing(false);
        }

    }


    return (
        <div className="comment-item" id={`comment-${comment.id}`}>
            <div>
                <div className="comment-info">
                    <PostAuthorInfo user={comment.user} variant="default" />
                    <span className="comment-date">{formatRelativeDate(comment.created_at)}</span>
                </div>

                <div className="comment-body">
                    {isEditing ? (
                        <div className="edit-comment-form">
                            <input
                                className="input-response"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                autoFocus
                            />
                            <div className="response-buttons">
                                <button onClick={handleEdit} disabled={loading}>Sauvegarder</button>
                                <button onClick={cancelEdit}>Annuler</button>
                            </div>
                        </div>
                    ) : (
                        hasParent ? (
                            <div className="comment-content"> <span style={{color: "blue"}}>@{comment.parent?.user?.profil_name}</span>: {comment.content}</div>
                        ) : (
                            <div className="comment-content">{comment.content}</div>
                        )
                    )}

                    {!isEditing && (
                        <div className="comment-actions">
                            <button onClick={() => setIsReplying(!isReplying)} className="comment-action-btn">
                                Répondre
                            </button>

                            {hasReplies && (
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="comment-action-btn toggle-replies"
                                >
                                    {showReplies ? "Cacher les réponses" : `Afficher les réponses (${comment.replies.length})`}
                                </button>
                            )}
                        </div>
                    )}


                    {isReplying && (
                        <form onSubmit={handleSubmit} className="response-form">
                            <input
                                type="text"
                                className="input-response"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Écrivez votre réponse..."
                                autoFocus
                            />
                            <div className="response-buttons">
                                <button type="submit" disabled={loading}>Envoyer</button>
                                <button type="button" onClick={() => setIsReplying(false)}>Annuler</button>
                            </div>
                        </form>
                    )}


                </div>
                {/* Affichage conditionnel des réponses */}
                {hasReplies && showReplies && (
                    <div className="replies-container">
                        {comment.replies.map((reply) => (
                            <CommentCard
                                key={reply.id}
                                comment={reply}
                                user={user}
                                onReplySubmit={onReplySubmit}
                                loading={loading}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
            {(isAdmin || isOwner) && !isEditing && (
                <div className="comment-options">
                    <CommentActionsMenu comment={comment} onEdit={openEditMode} onDelete={handleDelete} />
                </div>
            )}


        </div>
    );
};

export default CommentCard;
