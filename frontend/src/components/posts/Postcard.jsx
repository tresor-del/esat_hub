import React, { useState } from "react";
import { useEffect } from "react";
import PostAuthorInfo from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia from "./PostMedia";
import { useLocation } from "react-router-dom";
import { getComments } from "../../services/api";
import { formatRelativeDate } from "../../utils/dateFormatter";

const PostCard = ({
  post,
  onEdit,
  onDelete,
  onView,
  variant = "list"
}) => {

  const [commentsLength, setCommentLength] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = post.description.length > 50;

  useEffect(() => {
    fetchCount()
  }, [])

  const fetchCount = async () => {
    try {
      const result = await getComments(post.id)
      setCommentLength(result.total)
    } catch (error) {
      setCommentLength(0)
    }
  }

  const toggleReadMore = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }


  const handleCardClick = (e) => {
    if (variant === "detail") return;
    if (e.target.closest("button") || e.target.closest(".read-more-btn")) return;
    if (onView) {
      onView(post);
    }
  };


  return (
    <div className="post-card">
      <div className="post-content">
        {/* Métadonnées avec avatar */}
        <div className="post-meta">
          <PostAuthorInfo
            user={post.user}
            createdAt={post.created_at}
            dateVariant="relative"
            showAvatar={true}
          />

          <PostActionsMenu post={post} onEdit={onEdit} onDelete={onDelete} />
        </div>

        {/* Titre du poste */}
        <h3 className="post-title">{post.title}</h3>

        {/* Description */}
        {post.description && (
          <div>
            <p className={`post-description ${isExpanded ? 'expanded' : 'clamped'}`}>
              {post.description}
            </p>
            {isLongDescription && (
              <span className="read-more-btn" onClick={toggleReadMore}>
                {isExpanded ? " Voir moins" : "Voir plus"}
              </span>
            )}
          </div>
        )}

        {/* Médias */}
        <PostMedia post={post} />

        <div className="post-action" >
          <span className="post-action-btn" onClick={handleCardClick}>{commentsLength} commentaires</span>
          <span style={{ fontSize: "0.9rem" }}>{formatRelativeDate(post.created_at)}</span>
        </div>

      </div>
    </div>
  );
};

export default PostCard;
