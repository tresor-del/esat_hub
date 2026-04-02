import React, { useState } from "react";
import { useEffect } from "react";
import PostAuthorInfo from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia from "./PostMedia";
import { useLocation } from "react-router-dom";
import { getComments } from "../services/api";
import { formatRelativeDate } from "../utils/dateFormatter";

const PostCard = ({
  post,
  onEdit,
  onDelete,
  onView,
  variant = "list"
}) => {

  const [commentsLength, setCommentLength] = useState(0)

  useEffect( () => {
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


  const handleCardClick = (e) => {
    if (variant === "detail") return;
    if (e.target.closest("button")) return;
    if (onView) {
      onView(post);
    }
  };

  /**
   * Formater la date de création
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart("2", "0")
    const month = (date.getMonth() + 1).toString().padStart("2", "0")
    const year = date.getFullYear().toString()
    const min = date.getMinutes().toString().padStart("2", "0")
    const hour = date.getHours().toString().padStart("2", "0")
    
    const valideDate = `${day}-${month}-${year} at ${hour}:${min}`
    console.log(valideDate)
    return valideDate


  };

  return (
    <div className="post-card" onClick={handleCardClick}>
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
          <p className="post-description">{post.description}</p>
        )}

        {/* Médias */}
        <PostMedia post={post} variant="detail"/>
        <div style={{display: "flex", justifyContent: "space-between"}}>
          <span>{commentsLength} commentaires</span>
          <span style={{ fontSize: "0.9rem"}}>{formatRelativeDate(post.created_at)}</span>
        </div>

      </div>
    </div>
  );
};

export default PostCard;
