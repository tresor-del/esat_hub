import React, { useState } from "react";
import { useEffect } from "react";
import PostAuthorInfo from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia from "./PostMedia";
import { useLocation } from "react-router-dom";
import { getComments, getUserProfile } from "../../services/api";
import { formatRelativeDate } from "../../utils/dateFormatter";
import "../../styles/PostCard.css"

const PostCard = ({
  post,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  variant = "list",
  detail = false
}) => {

  const [commentsLength, setCommentLength] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState()


  useEffect(() => {
    const handResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handResize);
    fetchCount()
    return () => window.removeEventListener("resize", handResize);
  }, []);

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

    if (isMobile) {
      if (onView) {
        onView(post);
      }
    } else {
      if (onView) {
        onView(post);
      }
    }
  };

  const getPostUserProfile = async(userId) => {
    try {
      const user = await getUserProfile(userId);
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getPostUserProfile(post.user?.id)
  }, [post])



  return (
    <div className={`post-card ${detail ? 'post-detail-card' : ''}`}>
      <div className="post-content post-content-d">
        {/* Métadonnées avec avatar */}
        <div className="post-meta">
          <PostAuthorInfo
            user={user}
            createdAt={post.created_at}
            dateVariant="relative"
            showAvatar={true}
            openModal={false}
            variant="compact"
          />

          <PostActionsMenu post={post} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />
        </div>

        {/* Titre du poste */}
        <h3 className="post-title">{post.title}</h3>

        {/* Description */}
        {post.description && (
          <div>
            <p className={`post-description ${isExpanded ? 'expanded' : 'clamped'}`}>
              {post.description}
            </p>
            {post.description.length > 50 && (
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
