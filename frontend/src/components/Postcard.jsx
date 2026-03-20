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
  // onPostUpdate, // ← NOUVEAU : callback pour notifier Home
  variant = "list"
}) => {

  console.log(post)

  // // Hook pour gérer les likes
  // const { likesCount, isLiked, handleToggleLike } = usePostLike(
  //   post.likes_count || 0,
  //   post.is_liked_by_current_user || false,
  //   post.id,
  // );

  /**
   * 🔧 NOUVEAU : Notifier le parent quand les likes changent
   */
  // useEffect(() => {

  //   if (
  //     onPostUpdate &&
  //     (likesCount !== post.likes_count ||
  //       isLiked !== post.is_liked_by_current_user)
  //   ) {
  //     // Créer un objet post mis à jour
  //     const updatedPost = {
  //       ...post,
  //       likes_count: likesCount,
  //       is_liked_by_current_user: isLiked,
  //     };
  //     onPostUpdate(updatedPost);
  //   }
  // }, [likesCount, isLiked]);

  /**
   * Gérer le clic sur la carte
   */

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

        {/* Actions avec vrais likes */}
        {/* <PostActions
          voteCount={likesCount}
          commentCount={post.comments_count || 0}
          downloadCount={0}
          isLiked={isLiked}
          onUpvote={handleToggleLike}
          variant="default"
        /> */}

      </div>
    </div>
  );
};

export default PostCard;
