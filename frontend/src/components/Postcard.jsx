// components/PostCard.jsx (VERSION FINALE AVEC CALLBACK)
import { useEffect } from "react";
import PostAuthorInfo from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia from "./PostMedia";
import { useLocation } from "react-router-dom";

const PostCard = ({
  post,
  onEdit,
  onDelete,
  onView,
  variant = "list"
}) => {


  const handleCardClick = (e) => {
    if (variant === "detail") return;
    if (e.target.closest("button")) return;
    if (onView) {
      onView(post);
    }
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
        <PostMedia post={post} variant="detail"  />

      </div>
    </div>
  );
};

export default PostCard;
