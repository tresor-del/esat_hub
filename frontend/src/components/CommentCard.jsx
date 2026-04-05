import React, { useState } from "react";
import PostAuthorInfo from "./PostAuthorInfo";
import { formatRelativeDate } from "../utils/dateFormatter";
import { useLocation } from "react-router-dom";
import "../styles/CommentSection.css"

const CommentCard = ({ comment, user, onReplySubmit, loading }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const commentId = params.get("commentId");
    const isCommentInReplies = comment.replies?.some(r => r.id == commentId)
    const [showReplies, setShowReplies] = useState(isCommentInReplies); // État pour cacher/afficher

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onReplySubmit(comment.id, replyText);
        setReplyText("");
        setIsReplying(false);
        setShowReplies(true); // Affiche les réponses après avoir répondu
    };

    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
        <div className="comment-item" id={`comment-${comment.id}`}>
            <div className="comment-info">
                <PostAuthorInfo user={comment.user} />
                <span className="comment-date">{formatRelativeDate(comment.created_at)}</span>
            </div>
            
            <div className="comment-body">
                <div className="content">{comment.content}</div>

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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentCard;
