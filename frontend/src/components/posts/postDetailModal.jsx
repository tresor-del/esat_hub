import React, { useEffect, useState } from "react";
import { FiHeart, FiX, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import CommentSection from "../../components/comments/CommentSection";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import { usePostDetail } from "../../components/posts/hooks/usePostDetail";
import { formatRelativeDate } from "../../utils/dateFormatter";
import { togglePostLike } from "../../services/api";
import "../../styles/Posts/PostDetail.css"

const PostDetailModal = ({ postId, onClose, onPostDeleted }) => {
  const { user } = useAuth();

  const {
    post,
    loading,
    error,
    loadPost,
    handleCommentAdded,
    commentCount,
  } = usePostDetail({ onClose, onPostDeleted });

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [likesCount, setLikesCount] = useState(post?.likes_count ?? 0);
  const [likedByMe, setLikedByMe] = useState(post?.liked_by_me ?? false);
  const [loadingLike, setLoadingLike] = useState(false);

  useEffect(() => {
    if (postId) loadPost(postId);
  }, [postId]);

  useEffect(() => {
    setLikesCount(post?.likes_count ?? 0);
    setLikedByMe(post?.liked_by_me ?? false);
  }, [post?.id, post?.likes_count, post?.liked_by_me]);

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (!post?.id || loadingLike) return;

    setLoadingLike(true);
    try {
      const result = await togglePostLike(post.id);
      setLikedByMe(result.liked_by_me);
      setLikesCount(result.likes_count);
    } catch (error) {
      console.error("Erreur lors du like du post:", error);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleImageLoad = (e) => {
    setImgSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
  };

  if (error) return <p className="alert alert-error">{error}</p>;

  const toggleReadMore = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="post-detail-modal" onClick={onClose}>

      <div className="return-to-post-btn" onClick={onClose}>
        <FiX size={33} />
      </div>


      <div className="post-detail-content" onClick={(e) => e.stopPropagation()}>

        {/* IMAGE */}
        <div className="post-detail-media">

          {post?.file_path && (
            <img
              src={post.file_path}
              alt={post.title}
              className="post-image"
            />
          )}

        </div>

        {/* COMMENTS */}
        <div className="post-detail-info">
          <div className="post-detail-header">
            <PostAuthorInfo user={post?.user} postDate={formatRelativeDate(post?.created_at)} />
          </div>
          <div>
            <p>
              <strong>{post?.title}</strong>
            </p>
            <p>
              {post?.description}
            </p>

            <div className="post-action" >
              <button type="button" className={`post-action-btn ${likedByMe ? "liked" : ""}`} onClick={handleLikeClick} disabled={loadingLike}>
                <FiHeart size={20} fill={likedByMe ? "#ef4444" : "none"} color={likedByMe ? "#ef4444" : undefined} />
                {likesCount}
              </button>
              <span className="post-action-btn"> <FiMessageCircle size={25} /> {commentCount ?? post?.comments_count ?? 0}</span>
            </div>

          </div>

          <CommentSection
            postId={post?.id}
            user={user}
            onCommentAdded={handleCommentAdded}
          />

        </div>

      </div>
    </div>
  );
};

export default PostDetailModal;